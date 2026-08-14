import { Garagem, ImportacaoLinhaVeiculo, Veiculo } from "@/types/cadastros";

export interface LinhaCsvBruta {
  linha: number;
  prefixo: string;
  placa: string;
  garagemNome: string;
  fabricante: string;
  modelo: string;
  ano: string;
  tipoVeiculo: string;
  observacao: string;
}

const ALIASES: Record<keyof Omit<LinhaCsvBruta, "linha">, string[]> = {
  prefixo: ["prefixo"],
  placa: ["placa"],
  garagemNome: ["garagem", "unidade", "garagemunidade", "garagem/unidade"],
  fabricante: ["fabricante"],
  modelo: ["modelo"],
  ano: ["ano"],
  tipoVeiculo: ["tipo", "tipoveiculo", "tipodeveiculo"],
  observacao: ["observacao", "observacoes", "obs"],
};

function normalizarChave(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Converte as linhas cruas do CSV (objetos com cabeçalhos livres) para o
 * formato canônico usado pela importação, casando cabeçalhos por nome
 * (case/acento-insensível). */
export function mapearLinhasCsv(linhasBrutas: Record<string, string>[]): LinhaCsvBruta[] {
  return linhasBrutas.map((row, idx) => {
    const porChaveNormalizada = new Map<string, string>();
    for (const [chave, valor] of Object.entries(row)) {
      porChaveNormalizada.set(normalizarChave(chave), (valor ?? "").toString().trim());
    }

    function buscar(campo: keyof Omit<LinhaCsvBruta, "linha">): string {
      for (const alias of ALIASES[campo]) {
        const valor = porChaveNormalizada.get(alias);
        if (valor) return valor;
      }
      return "";
    }

    return {
      linha: idx + 2, // +1 cabeçalho, +1 para base 1
      prefixo: buscar("prefixo"),
      placa: buscar("placa"),
      garagemNome: buscar("garagemNome"),
      fabricante: buscar("fabricante"),
      modelo: buscar("modelo"),
      ano: buscar("ano"),
      tipoVeiculo: buscar("tipoVeiculo"),
      observacao: buscar("observacao"),
    };
  });
}

/** Validação autoritativa (usada no servidor) das linhas de importação de
 * veículos: obrigatoriedade, duplicidade dentro do arquivo, duplicidade
 * contra o cadastro já existente e resolução da unidade informada. */
export function validarLinhasImportacaoVeiculos(
  linhas: LinhaCsvBruta[],
  veiculosExistentes: Veiculo[],
  garagens: Garagem[]
): ImportacaoLinhaVeiculo[] {
  const prefixosVistos = new Map<string, number>();
  const placasVistas = new Map<string, number>();

  for (const l of linhas) {
    const prefixoNorm = l.prefixo.toLowerCase();
    const placaNorm = l.placa.toLowerCase();
    if (prefixoNorm) prefixosVistos.set(prefixoNorm, (prefixosVistos.get(prefixoNorm) ?? 0) + 1);
    if (placaNorm) placasVistas.set(placaNorm, (placasVistas.get(placaNorm) ?? 0) + 1);
  }

  const prefixosExistentes = new Set(veiculosExistentes.map((v) => v.prefixo.toLowerCase()));
  const placasExistentes = new Set(veiculosExistentes.map((v) => v.placa.toLowerCase()));

  return linhas.map((l): ImportacaoLinhaVeiculo => {
    const erros: string[] = [];
    const prefixoNorm = l.prefixo.toLowerCase();
    const placaNorm = l.placa.toLowerCase();

    if (!l.prefixo) erros.push("Prefixo ausente.");
    if (!l.placa) erros.push("Placa ausente.");

    if (l.prefixo && (prefixosVistos.get(prefixoNorm) ?? 0) > 1) {
      erros.push("Prefixo duplicado dentro do arquivo.");
    }
    if (l.placa && (placasVistas.get(placaNorm) ?? 0) > 1) {
      erros.push("Placa duplicada dentro do arquivo.");
    }
    if (l.prefixo && prefixosExistentes.has(prefixoNorm)) {
      erros.push("Prefixo já cadastrado no sistema.");
    }
    if (l.placa && placasExistentes.has(placaNorm)) {
      erros.push("Placa já cadastrada no sistema.");
    }

    let garagemId: string | undefined;
    if (l.garagemNome) {
      const encontrada = garagens.find(
        (g) =>
          g.nome.toLowerCase() === l.garagemNome.toLowerCase() ||
          g.sigla.toLowerCase() === l.garagemNome.toLowerCase()
      );
      if (encontrada) {
        garagemId = encontrada.id;
      } else {
        erros.push(`Unidade "${l.garagemNome}" não encontrada. Cadastre a unidade antes de importar.`);
      }
    }

    const anoNum = l.ano ? Number(l.ano) : undefined;
    if (l.ano && (!Number.isFinite(anoNum) || anoNum! < 1950 || anoNum! > 2100)) {
      erros.push("Ano inválido.");
    }

    return {
      linha: l.linha,
      prefixo: l.prefixo,
      placa: l.placa.toUpperCase(),
      garagemNome: l.garagemNome || undefined,
      garagemId,
      fabricante: l.fabricante || undefined,
      modelo: l.modelo || undefined,
      ano: Number.isFinite(anoNum) ? anoNum : undefined,
      tipoVeiculo: l.tipoVeiculo || undefined,
      observacao: l.observacao || undefined,
      valido: erros.length === 0,
      erros,
    };
  });
}

export function gerarTemplateCsv(): string {
  const cabecalho = "prefixo,placa,garagem,fabricante,modelo,ano,tipo,observacao";
  const exemplo = "10234,ABC1D23,Garagem Central,Mercedes-Benz,O500,2022,Rodoviário,";
  return `${cabecalho}\n${exemplo}\n`;
}
