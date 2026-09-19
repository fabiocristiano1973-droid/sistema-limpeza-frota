// Domínio do "Governo Interior — Princípios em Ação".
// Tudo aqui é dado local (IndexedDB), privacy-first — nada é enviado a
// serviços externos.

export type StatusValor = "EM_VALIDACAO" | "CONSOLIDADO";

export interface Valor {
  id: string;
  nome: string;
  objetivo: string;
  status: StatusValor;
  comportamentosQueDemonstram: string[];
  comportamentosQueContradizem: string[];
  evidenciasIds: string[];
  conflitosComOutrosValores: string;
  aprendizados: string;
  criadoEm: string; // ISO
  atualizadoEm: string; // ISO
}

export type PilarCodigo =
  | "QUEM_EU_SOU"
  | "NO_QUE_EU_ACREDITO"
  | "O_QUE_NAO_NEGOCIO"
  | "QUE_AMBIENTE_EU_CONSTRUO"
  | "COMO_EU_ME_COMPORTO";

export const PILARES_CODIGO: { chave: PilarCodigo; titulo: string }[] = [
  { chave: "QUEM_EU_SOU", titulo: "Quem eu sou" },
  { chave: "NO_QUE_EU_ACREDITO", titulo: "No que eu acredito" },
  { chave: "O_QUE_NAO_NEGOCIO", titulo: "O que não negocio" },
  { chave: "QUE_AMBIENTE_EU_CONSTRUO", titulo: "Que ambiente eu construo" },
  { chave: "COMO_EU_ME_COMPORTO", titulo: "Como eu me comporto" },
];

export type EstagioMaturidade =
  | "DESCOBRIR"
  | "DEFINIR"
  | "TESTAR"
  | "PRATICAR"
  | "REVISAR"
  | "INCORPORAR";

export const CICLO_MATURIDADE: EstagioMaturidade[] = [
  "DESCOBRIR",
  "DEFINIR",
  "TESTAR",
  "PRATICAR",
  "REVISAR",
  "INCORPORAR",
];

export const LABEL_ESTAGIO: Record<EstagioMaturidade, string> = {
  DESCOBRIR: "Descobrir",
  DEFINIR: "Definir",
  TESTAR: "Testar",
  PRATICAR: "Praticar",
  REVISAR: "Revisar",
  INCORPORAR: "Incorporar",
};

export interface Principio {
  id: string;
  nome: string;
  fraseCentral: string;
  icone: string; // emoji simples usado como identidade visual
  cor: string; // classe/token de cor de identificação
  pilar: PilarCodigo;
  valorSustentaId: string | null;
  significado: string;
  comportamentosQueFortalecem: string[];
  comportamentosQueViolam: string[];
  ambienteQuePrecisoConstruir: string;
  limites: string;
  regraDecisao: string;
  acaoPratica: string;
  estagio: EstagioMaturidade;
  incorporadoEm: string | null; // ISO — só preenchido quando confirmado com evidências
  criadoEm: string;
  atualizadoEm: string;
}

export type ClassificacaoEvidencia =
  | "EVIDENCIA_VALOR"
  | "EVIDENCIA_PRINCIPIO"
  | "CONTRADICAO"
  | "PADRAO"
  | "EVOLUCAO";

export const LABEL_CLASSIFICACAO: Record<ClassificacaoEvidencia, string> = {
  EVIDENCIA_VALOR: "Evidência de valor",
  EVIDENCIA_PRINCIPIO: "Evidência de princípio",
  CONTRADICAO: "Contradição",
  PADRAO: "Padrão",
  EVOLUCAO: "Evolução",
};

export interface Situacao {
  id: string;
  data: string; // ISO — data do fato relatado
  fato: string;
  emocao: string;
  valorId: string | null;
  principioId: string | null;
  decisao: string;
  acao: string;
  resultado: string;
  aprendizado: string;
  correcao: string;
  ambiente: string;
  /** Autoavaliação: a decisão/ação foi coerente com o valor/princípio envolvido? */
  coerente: boolean | null;
  classificacoes: ClassificacaoEvidencia[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface RevisaoConflito {
  id: string;
  data: string;
  aindaConcordo: boolean;
  notas: string;
}

export interface ConflitoValores {
  id: string;
  data: string;
  valorAId: string;
  valorBId: string;
  oQueEstaEmJogo: string;
  ganhoA: string;
  percaA: string;
  ganhoB: string;
  percaB: string;
  principioQueDeveGovernar: string;
  custoAceito: string;
  decisaoFinal: string;
  revisoes: RevisaoConflito[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface SelecaoPrincipioSemanal {
  id: string;
  semanaInicio: string; // ISO da segunda-feira daquela semana (00:00)
  principioId: string;
  criadoEm: string;
}

export interface RevisaoSemanal {
  id: string;
  semanaInicio: string;
  principioVividoMelhorId: string | null;
  situacaoContraCrencas: string;
  ambienteFortaleceu: string;
  ambienteFavoreceuNegativo: string;
  proximoPrincipioId: string | null;
  criadoEm: string;
}

export interface ConfiguracaoLembretes {
  manhaAtivo: boolean;
  manhaHorario: string; // HH:mm
  noiteAtivo: boolean;
  noiteHorario: string;
  semanalAtivo: boolean;
  semanalDiaSemana: number; // 0=domingo ... 6=sábado
  semanalHorario: string;
  notificacoesLocaisAtivas: boolean;
}

export const CONFIGURACAO_LEMBRETES_PADRAO: ConfiguracaoLembretes = {
  manhaAtivo: true,
  manhaHorario: "07:00",
  noiteAtivo: true,
  noiteHorario: "21:00",
  semanalAtivo: true,
  semanalDiaSemana: 0,
  semanalHorario: "19:00",
  notificacoesLocaisAtivas: false,
};

export interface DadosExportados {
  versao: 1;
  exportadoEm: string;
  valores: Valor[];
  principios: Principio[];
  situacoes: Situacao[];
  conflitos: ConflitoValores[];
  selecoesSemanais: SelecaoPrincipioSemanal[];
  revisoesSemanais: RevisaoSemanal[];
  configuracaoLembretes: ConfiguracaoLembretes;
}
