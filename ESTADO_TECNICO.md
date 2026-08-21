# Estado técnico — Sistema de Inspeção e Liberação da Limpeza da Frota

Documento de handoff técnico. Escrito em 2026-08-20 para dar contexto completo a qualquer
sessão de IA (Claude Code, ChatGPT ou outra) que precise entender o projeto sem ter
acompanhado o histórico. Se você é uma IA lendo isto pela primeira vez: leia inteiro antes
de sugerir qualquer mudança — várias decisões aqui parecem "estranhas" isoladamente mas têm
motivo documentado.

## 1. O que é

App interno para a empresa do Fábio Barbosa (Rota Transportes): checklist digital de
inspeção e liberação da limpeza de ônibus da frota. Substitui um processo em papel/memória.
290 veículos reais já cadastrados.

## 2. Stack atual

- **Next.js 16** (App Router, Turbopack) + **React 19** + TypeScript.
- **Banco**: `node:sqlite` (módulo nativo do Node, não `better-sqlite3`), modo WAL. Um único
  arquivo em disco. Cada tabela: `{id, status, criado_em, atualizado_em, data: JSON}` — o
  "schema" de verdade vive dentro do JSON, as colunas SQL são só metadados de busca.
- **Autenticação**: cookie próprio, HMAC-SHA256 assinado (`src/lib/auth/session.ts`), não usa
  NextAuth nem JWT de biblioteca. `secure: false` hoje (roda só em HTTP local) — **precisa
  virar `true` antes de qualquer deploy com HTTPS real**.
- **Perfis**: INSPETOR (Inspetor/Encarregado), GESTOR, ADMIN. Regras de acesso por rota em
  `src/proxy.ts` (equivalente ao antigo `middleware.ts` — Next 16 renomeou essa convenção).
- **Fotos de evidência**: base64 inline dentro do JSON da inspeção (`fotoDataUrl` em
  `ItemResultado`, ver `src/types/inspection.ts`). **Não há armazenamento de arquivo
  separado.** Isso é um problema real de escala, não just estilo — banco vai inchar com uso
  real.
- **PDF**: não existe. Zero código relacionado no projeto inteiro (confirmado por busca
  completa em 2026-08-20).
- **PWA**: não existe ainda (sendo adicionado nesta mesma sessão).

## 3. ⚠️ AVISO CRÍTICO — não repita esta investigação do zero

Entre 2026-08-14 e 2026-08-20, o banco de produção foi **repetidamente reduzido a um
esqueleto vazio** (só a tabela `usuarios`, sem linhas) — pelo menos 5-6 vezes confirmadas,
umas na madrugada, uma em pleno uso, uma com frequência de dezenas de vezes por dia em
alguns dias. **Nunca foi causa raiz confirmada.** Foi extensivamente investigado e
DESCARTADO com evidência:

- Lógica do próprio app (`src/lib/db/sqlite.ts`, `getDb()`) — lida linha a linha, não tem
  DROP/migration/seed que explique isso.
- WAL/snapshot obsoleto do `node:sqlite` — refutado por experimento isolado.
- Watchdog (`scripts/start-prod.ps1`) — só sobe/reinicia processo, nunca toca o banco.
- Dois watchdogs concorrentes, duplicidade de processo Node, service worker, Agendador de
  Tarefas do Windows — todos descartados.
- Conexão `readOnly: true` na guarda de integridade — impedia recuperação do WAL. Corrigido.
- Retry por tempo fixo, depois `PRAGMA wal_checkpoint` como sinal "preciso" — ambos
  tentados, o segundo **piorou** o problema (ver comentário completo em
  `src/lib/db/integrity-guard.ts`).
- Exclusão do Windows Defender aplicada pelo TI da empresa em 2026-08-20 — **o problema
  continuou depois**, o que enfraquece (mas não descarta 100%) a hipótese do antivírus.

**Hipótese que ganhou força:** o problema é específico da máquina de trabalho do Fábio —
sem privilégio de administrador, dentro do domínio/rede da empresa, possivelmente com
alguma ferramenta de segurança corporativa (EDR) fora do alcance de diagnóstico do Fábio ou
do Claude. **A decisão tomada em 2026-08-20 foi migrar a operação inteira pra fora dessa
máquina** — primeiro pro computador pessoal do Fábio, e agora (esta missão) pra hospedagem
em nuvem de verdade. Se a causa raiz nunca for confirmada, não é um problema — a nova
arquitetura elimina a superfície onde ela acontecia (arquivo SQLite local numa máquina sem
controle total).

Todas as restaurações seguiram o mesmo protocolo: preservar o estado quebrado como
evidência → achar o backup íntegro mais recente → validar contagem de linhas de todas as
tabelas → restaurar → religar. Evidências preservadas em `backups/` (pastas com prefixo
`incidente-`, `estado-vazio-`).

## 4. Missão em andamento (2026-08-20 em diante)

Decisão tomada pelo Fábio: sair de "roda no meu computador" para produção real, sempre
disponível, acessível por celular/tablet de qualquer rede (Wi-Fi ou 4G/5G), com endereço
HTTPS fixo, sem depender de nenhum computador ligado.

**Arquitetura escolhida:**
- **Hospedagem**: Vercel (mesmo time do Next.js; HTTPS/domínio automáticos; sem servidor
  pra manter vivo).
- **Banco**: migrar de `node:sqlite` para **Supabase (Postgres)** — decisão do Fábio em
  2026-08-20, escolhida sobre a alternativa mais rápida (Turso, mesmo dialeto SQL) porque
  Supabase resolve banco **e** armazenamento de fotos no mesmo serviço, e é mais padrão de
  mercado a longo prazo.
- **Fotos**: migrar de base64-inline-no-JSON para Supabase Storage (banco guarda só a URL).
- **PDF**: funcionalidade nova a construir (relatório final da inspeção).

**Limite inegociável, documentado para qualquer IA que continue este trabalho:** nenhuma IA
(Claude ou outra) cria contas em serviços externos, insere credenciais/senhas, ou contrata
serviço pago sozinha — mesmo com autorização ampla do Fábio. Essas etapas específicas
exigem o Fábio pessoalmente (criar a conta Supabase/Vercel, gerar a connection string). O
resto — código, schema, scripts de migração, configuração — é trabalho autônomo normal.

**Critérios de aceite definidos pelo Fábio** (10 testes — ver histórico de chat de
2026-08-20 pra descrição completa de cada um): funciona por endereço HTTPS fixo; celular
funciona fora da rede de casa (4G/5G); tablet completa o checklist; dado sobrevive a
reinício/logout; fotos permanecem vinculadas; PDF gerado corretamente; dois dispositivos
usam ao mesmo tempo sem corromper dado; desligar o notebook do Fábio NÃO derruba o sistema;
usuário não precisa descobrir IP nem configurar nada.

## 5. Regras fixas do projeto — não quebrar em nenhuma refatoração

- **Nunca excluir fisicamente um registro com histórico.** Status `INATIVO` existe pra isso.
- **Snapshot de inspeção é imutável.** Uma inspeção finalizada nunca é recalculada a partir
  dos cadastros atuais — guarda sua própria cópia de categoria/nome/criticidade do momento
  em que foi feita. Isso vale mesmo depois da migração de banco.
- **Nunca recriar dado fictício silenciosamente** se uma tabela que deveria ter dado real
  aparecer vazia/ausente — bloquear e avisar, nunca semear por cima de uma possível perda.
- **Backup + validação antes de qualquer alteração de banco**, sempre, sem exceção.
- **Rastreabilidade**: toda inspeção grava tanto o inspetor/encarregado escolhido quanto o
  usuário autenticado que registrou (`criadoPorUsuarioId`/`criadoPorNome`) — são dois
  registros distintos, não confundir.

## 6. Onde estão as coisas

- Código + histórico Git completo: pasta do projeto (transferida via HD em 2026-08-20 para
  `C:\Sistema_Limpeza_Frota` no computador pessoal do Fábio).
- Dados reais (banco SQLite atual, pré-migração): fora da pasta do projeto, em
  `%LOCALAPPDATA%\SistemaLimpezaFrota\` (copiado também para o computador pessoal).
- Backups e evidências de incidentes: `backups/` dentro da pasta do projeto (fora do Git,
  ver `.gitignore`).
- Guia de transferência original: `TRANSFERENCIA.md` na raiz do projeto.

## 7. Preferências de trabalho do Fábio (aplicam a qualquer IA)

- Responder em português do Brasil.
- Nunca afirmar como "pronto"/"resolvido" o que ainda está em rollout ou não confirmado —
  precisão importa mais que soar tranquilizador, especialmente depois da semana de
  incidentes.
- Sempre backup antes de alterar banco; sempre validar (contagem de linhas) antes de
  religar/prosseguir.
- Autonomia ampla para código/arquitetura; pausa obrigatória só para: apagar/substituir dado
  real, operação destrutiva sem rollback seguro, configuração de segurança do
  Windows/Defender/firewall, uso de privilégio administrativo, contratar serviço
  pago/cobrança, credenciais que o Fábio ainda precise fornecer.
