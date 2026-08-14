export type StatusItem = "CONFORME" | "NAO_CONFORME" | "NA";

export type Criticidade = "CRITICA" | "NAO_CRITICA";

export type Turno = "Manhã" | "Tarde" | "Noite";

export type ResultadoInspecao = "APROVADO" | "REPROVADO";

export type TipoEvidencia = "FOTO" | "VIDEO";

// Categoria/área do item do checklist. Deixou de ser uma lista fixa: agora
// vem do cadastro "Itens do Checklist" (ver src/types/cadastros.ts), então
// qualquer string cadastrada pelo usuário é válida.
export type CategoriaChecklist = string;

export interface ItemResultado {
  itemId: string;
  categoria: CategoriaChecklist;
  label: string;
  status: StatusItem;
  observacao?: string;
  fotoDataUrl?: string;
  evidenciaTipo?: TipoEvidencia;
  criticidade?: Criticidade;
}

export interface ResumoInspecao {
  totalItens: number;
  conformes: number;
  naoConformes: number;
  naCount: number;
  percentualConformidade: number;
  ncCriticas: number;
  resultado: ResultadoInspecao;
}

export interface Inspecao {
  id: string;
  criadoEm: string;
  finalizadoEm: string;
  // Snapshot imutável (texto) capturado no momento da finalização — nunca
  // recalculado a partir dos cadastros depois de salvo.
  prefixo: string;
  placa: string;
  garagem: string;
  turno: Turno;
  tipoLimpeza: string;
  inspetor: string;
  equipe: string;
  // Referências aos cadastros de origem, mantidas apenas para
  // rastreabilidade/consulta futura. Nunca usadas para "atualizar" o
  // snapshot acima — registros antigos podem não ter esses campos.
  veiculoId?: string;
  garagemId?: string;
  tipoLimpezaId?: string;
  inspetorId?: string;
  equipeId?: string;
  // Quem estava logado no app ao registrar (rastreabilidade de acesso —
  // distinto de `inspetor`/`inspetorId`, que é o cadastro selecionado no
  // formulário e pode não ser a mesma pessoa logada, ex: encarregado
  // registrando por um inspetor). Ausente em inspeções anteriores à
  // autenticação.
  criadoPorUsuarioId?: string;
  criadoPorNome?: string;
  itens: ItemResultado[];
  resumo: ResumoInspecao;
}

export interface NovaInspecaoPayload {
  veiculoId: string;
  garagemId?: string;
  tipoLimpezaId: string;
  inspetorId: string;
  equipeId: string;
  turno: Turno;
  criadoEm: string;
  itens: ItemResultado[];
}

export interface InspectionFilter {
  from?: string;
  to?: string;
  prefixo?: string;
  garagem?: string;
  turno?: string;
  inspetor?: string;
  equipe?: string;
  tipoLimpeza?: string;
  resultado?: ResultadoInspecao;
  q?: string;
}
