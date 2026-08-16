import "server-only";
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { getDataDir } from "@/lib/data-dir";

/**
 * Tabelas que, numa instalação já em uso, nunca deveriam aparecer ausentes
 * ou vazias. Se o arquivo do banco já existe (não é a primeira execução) e
 * qualquer uma delas estiver faltando/zerada, tratamos como sinal de perda
 * de dados — não como "primeira vez, hora de semear dados de exemplo".
 *
 * Contexto: incidente de 2026-08-15 em que o arquivo do banco foi
 * substituído por um esqueleto vazio entre uma noite e a manhã seguinte, e
 * o app teria silenciosamente recriado tabelas com dados fictícios de seed
 * assim que qualquer página de cadastro fosse aberta.
 */
const TABELAS_CRITICAS = ["veiculos", "garagens", "itens_checklist"] as const;

const NOME_ARQUIVO_ALERTA = "ALERTA_INTEGRIDADE.json";
const NOME_ARQUIVO_VERIFICANDO = "VERIFICANDO_INTEGRIDADE.flag";

export interface ResultadoIntegridade {
  ok: boolean;
  motivo?: string;
  detalhes?: Record<string, number | "ausente">;
}

export interface AlertaAtivo {
  motivo: string;
  detectadoEm: string;
  detalhes?: Record<string, number | "ausente">;
}

function caminhoBanco(): string {
  return path.join(getDataDir(), "sistema-limpeza-frota.db");
}

function caminhoAlerta(): string {
  return path.join(getDataDir(), NOME_ARQUIVO_ALERTA);
}

function caminhoVerificando(): string {
  return path.join(getDataDir(), NOME_ARQUIVO_VERIFICANDO);
}

function escreverAlerta(motivo: string, detalhes?: Record<string, number | "ausente">) {
  const payload: AlertaAtivo = { motivo, detectadoEm: new Date().toISOString(), detalhes };
  fs.writeFileSync(caminhoAlerta(), JSON.stringify(payload, null, 2), "utf-8");
}

function limparAlerta() {
  const p = caminhoAlerta();
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

function marcarVerificando() {
  fs.writeFileSync(caminhoVerificando(), new Date().toISOString(), "utf-8");
}

function desmarcarVerificando() {
  const p = caminhoVerificando();
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

/**
 * Leitura rápida (sem tocar no banco) usada pelo layout em toda requisição —
 * true enquanto o retry de verificarIntegridadeBanco() ainda está em
 * andamento. Enquanto isso, a UI mostra "Verificando..." em vez de tratar
 * como alarme prematuramente ou liberar acesso antes da hora.
 */
export function estaVerificando(): boolean {
  return fs.existsSync(caminhoVerificando());
}

// Teto de segurança para o pior caso. CALIBRADO COM DADOS REAIS EM
// 2026-08-16 (não é mais estimativa): dois reboots completos e genuínos da
// máquina do Fábio (não `taskkill` simulado) no mesmo dia esgotaram as 90
// tentativas anteriores (~90s) nas duas vezes, de forma bem consistente —
// 93,8s e 92,7s até o alarme disparar, com os dados sempre íntegros por
// baixo. Ou seja: 90s não tinha folga nenhuma, era exatamente o limite.
// 150 x 1s = até ~151s dá uma folga real (~58s) acima do pior caso medido,
// em vez de só encostar nele de novo. Não afeta o caminho normal: a
// resposta é confiável e o laço para assim que vier um resultado OK —
// normalmente na 1ª tentativa, sem nenhum atraso extra.
const TENTATIVAS = 150;
const INTERVALO_MS = 1000;

// Pausa fixa antes da 1ª tentativa (mitigação empírica — ver histórico
// completo no comentário de verificarIntegridadeBanco).
const PAUSA_INICIAL_MS = 2000;

function dormir(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Uma tentativa isolada, sem retry e sem escrever o arquivo de alerta — usada pelo laço de retry abaixo. */
function tentarVerificar(dbPath: string): ResultadoIntegridade {
  let db: InstanceType<typeof DatabaseSync> | null = null;
  try {
    // NUNCA abrir isto como readOnly: o SQLite recusa fazer a recuperação
    // do WAL numa conexão somente-leitura, e essa recuperação é exatamente
    // o que precisamos que aconteça sozinha aqui.
    //
    // IMPORTANTE (removido em 2026-08-15 após piorar o problema em vez de
    // ajudar): NÃO forçar `PRAGMA wal_checkpoint` aqui. Chegamos a tentar
    // isso como forma de detecção "precisa", mas cada chamada TRUNCATE
    // reescreve o arquivo — e os testes mostraram que quanto mais vezes
    // reescrevíamos o arquivo em sequência (mais tentativas rápidas), MAIOR
    // ficava a janela até os dados aparecerem certos de novo, não menor.
    // Isso é o padrão clássico de um antivírus com proteção em tempo real
    // reagindo a cada modificação do arquivo e re-travando o acesso — nossa
    // própria tentativa de "confirmar mais rápido" estava alimentando o
    // próprio bloqueio. Por isso: só leitura aqui, zero escrita.
    db = new DatabaseSync(dbPath);

    const tabelasExistentes = new Set(
      (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(
        (r) => r.name
      )
    );

    const detalhes: Record<string, number | "ausente"> = {};
    let comprometido = false;
    for (const tabela of TABELAS_CRITICAS) {
      if (!tabelasExistentes.has(tabela)) {
        detalhes[tabela] = "ausente";
        comprometido = true;
        continue;
      }
      const linha = db.prepare(`SELECT COUNT(*) as c FROM ${tabela}`).get() as { c: number };
      detalhes[tabela] = linha.c;
      if (linha.c === 0) comprometido = true;
    }

    if (comprometido) {
      return { ok: false, motivo: "Tabelas críticas ausentes ou vazias — possível perda de dados.", detalhes };
    }
    return { ok: true, detalhes };
  } catch (erro) {
    return {
      ok: false,
      motivo: `Falha ao verificar integridade do banco: ${erro instanceof Error ? erro.message : String(erro)}`,
    };
  } finally {
    db?.close();
  }
}

/**
 * Roda a verificação (com retry) e atualiza o arquivo de alerta (grava se
 * encontrar problema, remove se estiver tudo certo). Chamada na
 * inicialização do servidor (instrumentation.ts) e periodicamente junto do
 * backup automático, para detectar perda de dados mesmo sem reiniciar o
 * processo.
 *
 * MITIGAÇÃO EMPÍRICA, NÃO CAUSA RAIZ RESOLVIDA. Histórico do que já foi
 * tentado em 2026-08-15 (do mais pro menos ingênuo — mantido aqui de
 * propósito para não repetir os mesmos becos sem saída numa sessão futura):
 *
 *   1. Conexão `readOnly: true` — impedia a própria recuperação do WAL.
 *      Trocado para conexão normal.
 *   2. Retry com tempo fixo estimado (5x600ms, depois 20x1,5s) —
 *      insuficiente; a janela real observada passou de 38s.
 *   3. `PRAGMA wal_checkpoint(TRUNCATE)` a cada tentativa, na tentativa de
 *      ter um sinal "preciso" (`busy`) em vez de inferir pela existência de
 *      tabela — PIOROU o problema. A cada `taskkill` de teste seguido de
 *      reinício, a janela até resolver crescia (2,4s → 38s → 40s → 42s+),
 *      e o `busy=0` do checkpoint nem sempre significava leitura confiável
 *      (viu tabelas ausentes mesmo com busy=0 na 1ª tentativa). Hipótese
 *      mais provável: cada checkpoint TRUNCATE reescreve o arquivo, e algo
 *      externo (suspeita forte: antivírus com proteção em tempo real) reage
 *      a cada modificação, reiniciando o próprio bloqueio que estávamos
 *      tentando detectar — ou seja, a "detecção precisa" estava alimentando
 *      o problema que tentava resolver.
 *   4. Removida a escrita forçada (voltou a só ler, sem PRAGMA
 *      wal_checkpoint) para testar a hipótese do item 3 — o padrão de
 *      ~40-42s se manteve IDÊNTICO. Ou seja, a hipótese "nossa própria
 *      escrita alimenta o bloqueio" está DESCARTADA: o atraso é puramente
 *      externo, com um relógio próprio que não muda com nada que fazemos
 *      aqui (nem ler mais devagar, nem ler mais rápido, nem escrever).
 *   5. Em 2026-08-16, dois REBOOTS REAIS E COMPLETOS da máquina (não
 *      `taskkill` simulado — um deles ao ligar o PC de manhã, outro
 *      deliberado com o Fábio observando ao vivo) esgotaram as 90
 *      tentativas anteriores (~90s) nas DUAS vezes, com uma consistência
 *      alta: 93,8s e 92,7s até o alarme disparar. Ou seja, o orçamento de
 *      90s não tinha nenhuma folga de verdade — era praticamente o limite
 *      exato. Orçamento recalibrado para ~150s (150x1s) com dado real, não
 *      mais estimativa.
 *
 * Estratégia atual (a mais confiável possível só com código, dado que a
 * causa é externa e não influenciável por aqui): leitura pura (zero
 * escrita) em tentarVerificar(), pausa fixa antes da 1ª tentativa
 * (PAUSA_INICIAL_MS), e retry só até a primeira leitura OK — toda leitura
 * de sucesso observada nos testes foi sempre confiável; leituras de falha
 * continuam tentando até esgotar o orçamento (~151s, calibrado com os dois
 * reboots reais medidos em 2026-08-16, não mais estimativa) antes de
 * declarar alarme de verdade. Isso não elimina o atraso, mas garante que o
 * sistema espere tempo suficiente antes de assustar alguém à toa — a tela
 * "Verificando..." cobre essa espera.
 *
 * PRÓXIMO PASSO REAL (fora do escopo de código, é config do Windows — não
 * decido isso sozinho): adicionar `%LOCALAPPDATA%\SistemaLimpezaFrota\` às
 * exclusões do Windows Defender. É a suspeita mais forte que resta (atraso
 * de dezenas de segundos, consistente, independente de tudo que o app faz,
 * é a assinatura clássica de antivírus fazendo varredura em tempo real) —
 * e é praticamente sem risco excluir uma pasta que só tem dado do próprio
 * app. Em 2026-08-16 o Fábio decidiu levar essa solicitação para o TI da
 * empresa em vez de aplicar sozinho (a máquina não é de uso pessoal livre);
 * aprovação pode demorar — o orçamento de 150s acima é a rede de segurança
 * enquanto isso não sai. Se a exclusão do Defender não resolver mesmo
 * depois de aprovada, aí sim a investigação com Process Monitor da
 * Sysinternals (ao vivo, durante um reboot real) é o próximo passo — ver
 * project_sistema_limpeza_frota.md.
 */
export async function verificarIntegridadeBanco(): Promise<ResultadoIntegridade> {
  const dbPath = caminhoBanco();

  // Instalação nova de verdade: arquivo ainda não existe. Não é incidente,
  // é o primeiro boot — deixa o fluxo normal de seed cuidar disso.
  if (!fs.existsSync(dbPath)) {
    limparAlerta();
    return { ok: true };
  }

  marcarVerificando();
  const inicio = Date.now();
  try {
    await dormir(PAUSA_INICIAL_MS);

    let ultimoResultado: ResultadoIntegridade = { ok: false };
    for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
      const tInicioTentativa = Date.now();
      ultimoResultado = tentarVerificar(dbPath);
      const duracaoTentativa = Date.now() - tInicioTentativa;
      const decorridoTotal = Date.now() - inicio;

      if (ultimoResultado.ok) {
        console.log(
          `[integridade] OK na tentativa ${tentativa}/${TENTATIVAS} (essa tentativa: ${duracaoTentativa}ms, total decorrido: ${decorridoTotal}ms).`
        );
        limparAlerta();
        return ultimoResultado;
      }

      console.log(
        `[integridade] Tentativa ${tentativa}/${TENTATIVAS} ainda comprometida (essa tentativa: ${duracaoTentativa}ms, total decorrido: ${decorridoTotal}ms): ${ultimoResultado.motivo}`
      );
      if (tentativa < TENTATIVAS) await dormir(INTERVALO_MS);
    }

    // Esgotou todo o orçamento sem nenhuma leitura OK — só agora trata como
    // alarme de verdade.
    const decorridoFinal = Date.now() - inicio;
    console.log(
      `[integridade] Todas as ${TENTATIVAS} tentativas falharam (total decorrido: ${decorridoFinal}ms) — registrando alarme.`
    );
    escreverAlerta(ultimoResultado.motivo ?? "Falha na verificação de integridade.", ultimoResultado.detalhes);
    return ultimoResultado;
  } finally {
    desmarcarVerificando();
  }
}

/** Leitura rápida (sem tocar no banco) usada pelo layout em toda requisição. */
export function lerAlertaAtivo(): AlertaAtivo | null {
  const p = caminhoAlerta();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as AlertaAtivo;
  } catch {
    return {
      motivo: "Alerta de integridade ativo (arquivo de alerta ilegível).",
      detectadoEm: new Date().toISOString(),
    };
  }
}
