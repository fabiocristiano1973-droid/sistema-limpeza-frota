import { ItemChecklistCadastro, CriticidadePadrao, TipoRespostaItem } from "@/types/cadastros";
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
  // Ver ItemChecklistCadastro — mesma semântica, copiada do catálogo no
  // início da inspeção (não muda depois, mesmo que o cadastro mude).
  exigeFoto: boolean;
  tipoResposta: TipoRespostaItem;
  opcoesSelecao?: string[];
  opcaoConforme?: string;
  respostaSelecao?: string;
}

function itemEditInicial(c: ItemChecklistCadastro): ItemEditState {
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
    exigeFoto: c.exigeFoto ?? false,
    tipoResposta: c.tipoResposta ?? "PADRAO",
    opcoesSelecao: c.opcoesSelecao,
    opcaoConforme: c.opcaoConforme,
    respostaSelecao: undefined,
  };
}

export function criarItensIniciais(catalogo: ItemChecklistCadastro[]): ItemEditState[] {
  return catalogo.map(itemEditInicial);
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
  return catalogo.map((c) => atuaisPorId.get(c.id) ?? itemEditInicial(c));
}

/** Item exige foto só quando de fato se aplica (N/A dispensa a evidência). */
function precisaDeFoto(item: ItemEditState): boolean {
  return item.exigeFoto && item.status !== null && item.status !== "NA";
}

export function itemEstaCompleto(item: ItemEditState): boolean {
  if (item.tipoResposta === "SELECAO") {
    if (!item.respostaSelecao) return false;
    if (item.status === "NAO_CONFORME") {
      return item.observacao.trim().length > 0 && item.criticidade !== null;
    }
    return true;
  }

  if (!item.status) return false;
  if (precisaDeFoto(item) && !item.fotoDataUrl) return false;
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
  const naoConforme = item.status === "NAO_CONFORME";
  // Evidência é preservada sempre que existir — não só em Não Conforme —
  // porque itens com exigeFoto precisam da foto mesmo quando Conforme.
  return {
    itemId: item.itemId,
    categoria: item.categoria,
    label: item.label,
    status: item.status as StatusItem,
    observacao: naoConforme ? item.observacao.trim() : undefined,
    fotoDataUrl: item.fotoDataUrl,
    evidenciaTipo: item.fotoDataUrl ? item.evidenciaTipo : undefined,
    criticidade: naoConforme ? (item.criticidade ?? undefined) : undefined,
    respostaSelecao: item.tipoResposta === "SELECAO" ? item.respostaSelecao : undefined,
  };
}
