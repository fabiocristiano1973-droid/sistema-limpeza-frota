import { ItemChecklistCadastro, Veiculo } from "@/types/cadastros";

export interface InfoCategoria {
  label: string;
  icone: string;
}

// Ícones/rótulos conhecidos para as áreas do checklist. Qualquer nova
// categoria cadastrada pelo usuário (ver Cadastros → Itens do Checklist)
// funciona normalmente — apenas exibida com um ícone genérico (📋).
//
// Ordem e agrupamento seguem o fluxo físico de inspeção definido pela
// diretoria em 2026-08-14: Externo/Bagageiro → Entrada dianteira → Cabine →
// Acesso ao salão → Salão/Corredor → Bebedouro → Banheiro → Finalização
// (este último é uma etapa fixa do wizard, fora do catálogo de categorias).
const ICONES_CATEGORIA: Record<string, InfoCategoria> = {
  externa: { label: "Externo / Bagageiro", icone: "🚍" },
  entrada_dianteira: { label: "Entrada Dianteira", icone: "🚪" },
  cabine: { label: "Cabine do Motorista", icone: "👨‍✈️" },
  acesso_salao: { label: "Acesso ao Salão", icone: "🚪" },
  salao: { label: "Salão / Corredor", icone: "💺" },
  bebedouro: { label: "Bebedouro", icone: "🚰" },
  banheiro: { label: "Banheiro", icone: "🚻" },
  bagageiro: { label: "Bagageiro", icone: "🧳" },
  equipamentos: { label: "Equipamentos", icone: "🎒" },
  acabamento: { label: "Acabamento Final", icone: "✨" },
};

export function obterInfoCategoria(categoria: string): InfoCategoria {
  const conhecida = ICONES_CATEGORIA[categoria.trim().toLowerCase()];
  return conhecida ?? { label: categoria, icone: "📋" };
}

/** Categorias conhecidas, na ordem em que aparecem no checklist padrão —
 * usado apenas para alimentar o seletor de categoria no cadastro de itens. */
export function categoriasConhecidas(): { valor: string; label: string; icone: string }[] {
  return Object.entries(ICONES_CATEGORIA).map(([valor, info]) => ({ valor, ...info }));
}

/**
 * Um item se aplica a um veículo quando é de aplicação "TODOS", ou quando é
 * de aplicação "CLASSIFICACAO" e a classificação cadastrada bate (sem
 * diferenciar maiúsculas/minúsculas) com o campo Veiculo.tipoVeiculo.
 * Esta é a mesma regra usada no cliente (wizard) e no servidor (API de
 * criação de inspeção), para que o conjunto de itens exigido seja idêntico.
 */
export function itemAplicavelAoVeiculo(
  item: Pick<ItemChecklistCadastro, "aplicacaoTipo" | "aplicacaoClassificacao">,
  veiculo?: Pick<Veiculo, "tipoVeiculo"> | null
): boolean {
  if (item.aplicacaoTipo === "TODOS") return true;
  if (!veiculo?.tipoVeiculo) return false;
  return veiculo.tipoVeiculo.trim().toLowerCase() === (item.aplicacaoClassificacao ?? "").trim().toLowerCase();
}

/** Itens ativos e aplicáveis ao veículo informado, na ordem de exibição
 * cadastrada (campo `ordem`). */
export function catalogoAplicavel(
  itensAtivos: ItemChecklistCadastro[],
  veiculo?: Pick<Veiculo, "tipoVeiculo"> | null
): ItemChecklistCadastro[] {
  return itensAtivos
    .filter((item) => itemAplicavelAoVeiculo(item, veiculo))
    .sort((a, b) => a.ordem - b.ordem);
}

/** Deriva a lista de categorias/áreas (com ícone) a partir de uma lista de
 * itens já ordenada, preservando a ordem de primeira aparição. Funciona
 * tanto para o catálogo ativo (nova inspeção) quanto para o snapshot
 * congelado de uma inspeção já realizada — nunca depende de uma lista fixa
 * de categorias no código. */
export function categoriasDoCatalogo(
  itens: { categoria: string }[]
): { id: string; label: string; icone: string }[] {
  const vistas = new Set<string>();
  const resultado: { id: string; label: string; icone: string }[] = [];
  for (const item of itens) {
    if (vistas.has(item.categoria)) continue;
    vistas.add(item.categoria);
    resultado.push({ id: item.categoria, ...obterInfoCategoria(item.categoria) });
  }
  return resultado;
}
