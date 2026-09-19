import type {
  ConfiguracaoLembretes,
  ConflitoValores,
  DadosExportados,
  Principio,
  RevisaoSemanal,
  SelecaoPrincipioSemanal,
  Situacao,
  Valor,
} from "./types";

export function montarPayloadExportacao(dados: {
  valores: Valor[];
  principios: Principio[];
  situacoes: Situacao[];
  conflitos: ConflitoValores[];
  selecoesSemanais: SelecaoPrincipioSemanal[];
  revisoesSemanais: RevisaoSemanal[];
  configuracaoLembretes: ConfiguracaoLembretes;
}): DadosExportados {
  return {
    versao: 1,
    exportadoEm: new Date().toISOString(),
    ...dados,
  };
}

export class ArquivoImportacaoInvalido extends Error {}

/** Valida a forma mínima esperada de um arquivo importado. Lança erro claro se algo essencial faltar. */
export function validarPayloadImportacao(json: unknown): DadosExportados {
  if (!json || typeof json !== "object") {
    throw new ArquivoImportacaoInvalido("Arquivo não é um JSON válido de backup do Governo Interior.");
  }
  const obj = json as Record<string, unknown>;
  const camposObrigatorios = [
    "valores",
    "principios",
    "situacoes",
    "conflitos",
    "selecoesSemanais",
    "revisoesSemanais",
    "configuracaoLembretes",
  ];
  for (const campo of camposObrigatorios) {
    if (!(campo in obj)) {
      throw new ArquivoImportacaoInvalido(`Arquivo de backup inválido: falta o campo "${campo}".`);
    }
  }
  for (const campoLista of ["valores", "principios", "situacoes", "conflitos", "selecoesSemanais", "revisoesSemanais"]) {
    if (!Array.isArray(obj[campoLista])) {
      throw new ArquivoImportacaoInvalido(`Arquivo de backup inválido: "${campoLista}" deveria ser uma lista.`);
    }
  }
  return obj as unknown as DadosExportados;
}

export function nomeArquivoExportacao(data: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `governo-interior-backup-${data.getFullYear()}${pad(data.getMonth() + 1)}${pad(data.getDate())}.json`;
}
