export type StatusCadastro = "ATIVO" | "INATIVO";

export type FuncaoInspetor = "Inspetor" | "Encarregado" | "Outros Autorizados";

export interface Garagem {
  id: string;
  nome: string;
  sigla: string;
  cidade: string;
  status: StatusCadastro;
  criadoEm: string;
  atualizadoEm: string;
}

export interface TipoLimpeza {
  id: string;
  nome: string;
  descricao: string;
  status: StatusCadastro;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Veiculo {
  id: string;
  prefixo: string;
  placa: string;
  garagemId?: string;
  status: StatusCadastro;
  fabricante?: string;
  modelo?: string;
  ano?: number;
  tipoVeiculo?: string;
  observacao?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Inspetor {
  id: string;
  nomeCompleto: string;
  matricula?: string;
  funcao: FuncaoInspetor;
  garagemId?: string;
  status: StatusCadastro;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Equipe {
  id: string;
  nome: string;
  garagemId?: string;
  turnoPadrao?: string;
  status: StatusCadastro;
  criadoEm: string;
  atualizadoEm: string;
}

export type AplicacaoItemChecklist = "TODOS" | "CLASSIFICACAO";

export type CriticidadePadrao = "NORMAL" | "CRITICO";

// "PADRAO" = os 3 botões de sempre (Conforme/Não Conforme/N/A). "SELECAO" =
// uma lista fixa de opções (ex.: aparência da água); a opção escolhida
// determina o status automaticamente (ver opcaoConforme). Campo ausente em
// itens antigos é tratado como "PADRAO" — não muda nada pra eles.
export type TipoRespostaItem = "PADRAO" | "SELECAO";

export interface ItemChecklistCadastro {
  id: string;
  // Categoria / Área da inspeção (ex: "externa", "salao", ou qualquer valor
  // novo digitado pelo usuário — não é mais uma lista fixa no código).
  categoria: string;
  nome: string;
  ordem: number;
  status: StatusCadastro;
  aplicacaoTipo: AplicacaoItemChecklist;
  // Usado quando aplicacaoTipo === "CLASSIFICACAO": comparado (sem diferenciar
  // maiúsculas/minúsculas) com Veiculo.tipoVeiculo. Ex: "DD".
  aplicacaoClassificacao?: string;
  criticidadePadrao: CriticidadePadrao;
  // Quando true, a etapa exige pelo menos 1 foto vinculada a este item para
  // ser considerada completa (sempre que o item não for marcado N/A) —
  // independente do status ser Conforme ou Não Conforme.
  exigeFoto?: boolean;
  tipoResposta?: TipoRespostaItem;
  // Usados apenas quando tipoResposta === "SELECAO".
  opcoesSelecao?: string[];
  // Qual opção de opcoesSelecao é tratada como Conforme — qualquer outra
  // opção escolhida vira Não Conforme automaticamente.
  opcaoConforme?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ImportacaoLinhaVeiculo {
  linha: number;
  prefixo: string;
  placa: string;
  garagemNome?: string;
  garagemId?: string;
  fabricante?: string;
  modelo?: string;
  ano?: number;
  tipoVeiculo?: string;
  observacao?: string;
  valido: boolean;
  erros: string[];
}
