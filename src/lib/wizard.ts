import { ItemChecklistCadastro, CriticidadePadrao } from "@/types/cadastros";
import { CategoriaChecklist, Criticidade, ItemResultado, StatusItem, TipoEvidencia } from "@/types/inspection";

export interface ItemEditState {
  itemId: string;
  categoria: CategoriaChecklist;
  label: string;
  status: StatusItem | null;
  observacao: string;
  fotoDataUrl?: string;
  evidenciaTipo?: TipoEvidencia;
  criticidade: Criticidade | null;
  // Sugestão vinda do cadastro do item — usada para pré-selecionar a
  // criticidade quando o item é marcado Não Conforme (o inspetor ainda pode
  // trocar). Não altera a regra de reprovação, que continua olhando apenas
  // para a criticidade efetivamente registrada na ocorrência.
  criticidadePadrao: CriticidadePadrao;
}

export function criarItensIniciais(catalogo: ItemChecklistCadastro[]): ItemEditState[] {
  return catalogo.map((c) => ({
    itemId: c.id,
    categoria: c.categoria,
    label: c.nome,
    status: null,
    observacao: "",
    fotoDataUrl: undefined,
    evidenciaTipo: undefined,
    criticidade: null,
    criticidadePadrao: c.criticidadePadrao,
  }));
}

/** Reconcilia o estado de edição atual com um novo catálogo aplicável
 * (ex.: após trocar o veículo selecionado, que pode mudar quais itens
 * condicionais — como "Mantas presentes" em veículos DD — entram no
 * checklist). Respostas já preenchidas para itens que continuam aplicáveis
 * são preservadas; itens que deixaram de se aplicar são removidos; itens
 * novos entram em branco. */
export function reconciliarItens(
  itensAtuais: ItemEditState[],
  catalogo: ItemChecklistCadastro[]
): ItemEditState[] {
  const atuaisPorId = new Map(itensAtuais.map((i) => [i.itemId, i]));
  return catalogo.map((c) => {
    const existente = atuaisPorId.get(c.id);
    if (existente) return existente;
    return {
      itemId: c.id,
      categoria: c.categoria,
      label: c.nome,
      status: null,
      observacao: "",
      fotoDataUrl: undefined,
      evidenciaTipo: undefined,
      criticidade: null,
      criticidadePadrao: c.criticidadePadrao,
    };
  });
}

export function itemEstaCompleto(item: ItemEditState): boolean {
  if (!item.status) return false;
  if (item.status === "NAO_CONFORME") {
    return item.observacao.trim().length > 0 && item.criticidade !== null;
  }
  return true;
}

export function categoriaEstaCompleta(itens: ItemEditState[], categoria: CategoriaChecklist): boolean {
  return itens.filter((i) => i.categoria === categoria).every(itemEstaCompleto);
}

export function todosItensCompletos(itens: ItemEditState[]): boolean {
  return itens.every(itemEstaCompleto);
}

export function converterParaItemResultado(item: ItemEditState): ItemResultado {
  return {
    itemId: item.itemId,
    categoria: item.categoria,
    label: item.label,
    status: item.status as StatusItem,
    observacao: item.status === "NAO_CONFORME" ? item.observacao.trim() : undefined,
    fotoDataUrl: item.status === "NAO_CONFORME" ? item.fotoDataUrl : undefined,
    evidenciaTipo: item.status === "NAO_CONFORME" ? item.evidenciaTipo : undefined,
    criticidade: item.status === "NAO_CONFORME" ? (item.criticidade ?? undefined) : undefined,
  };
}
