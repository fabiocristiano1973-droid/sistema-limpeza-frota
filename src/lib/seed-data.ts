import { Equipe, Garagem, ItemChecklistCadastro, Inspetor, TipoLimpeza, Veiculo } from "@/types/cadastros";

// Dados fictícios de partida (equivalentes aos fixtures da V1), usados apenas
// na primeira execução para popular os cadastros. Depois disso, os arquivos
// data/*.json refletem exclusivamente o que for cadastrado/editado pelo
// usuário — este arquivo não é mais consultado.

export const SEED_GARAGENS: Omit<Garagem, "criadoEm" | "atualizadoEm">[] = [
  { id: "gar-central", nome: "Garagem Central", sigla: "CTR", cidade: "Itabuna", status: "ATIVO" },
  { id: "gar-norte", nome: "Garagem Norte", sigla: "NRT", cidade: "Ilhéus", status: "ATIVO" },
  { id: "gar-sul", nome: "Garagem Sul", sigla: "SUL", cidade: "Itabuna", status: "ATIVO" },
  { id: "gar-leste", nome: "Garagem Leste", sigla: "LST", cidade: "Ilhéus", status: "ATIVO" },
];

export const SEED_TIPOS_LIMPEZA: Omit<TipoLimpeza, "criadoEm" | "atualizadoEm">[] = [
  {
    id: "tl-simples",
    nome: "Limpeza Simples",
    descricao: "Varrição e organização básica entre viagens.",
    status: "ATIVO",
  },
  {
    id: "tl-geral",
    nome: "Limpeza Geral",
    descricao: "Limpeza completa do salão, cabine e área externa.",
    status: "ATIVO",
  },
  {
    id: "tl-fina",
    nome: "Limpeza Fina",
    descricao: "Higienização detalhada, incluindo bagageiro e banheiro.",
    status: "ATIVO",
  },
  {
    id: "tl-pos-manutencao",
    nome: "Pós-manutenção",
    descricao: "Limpeza após serviços de manutenção/oficina.",
    status: "ATIVO",
  },
];

export const SEED_VEICULOS: Omit<Veiculo, "criadoEm" | "atualizadoEm">[] = [
  { id: "vei-10234", prefixo: "10234", placa: "ABC1D23", garagemId: "gar-central", status: "ATIVO" },
  { id: "vei-10457", prefixo: "10457", placa: "BRA2E19", garagemId: "gar-norte", status: "ATIVO" },
  { id: "vei-10611", prefixo: "10611", placa: "CDX3F45", garagemId: "gar-sul", status: "ATIVO" },
  { id: "vei-10789", prefixo: "10789", placa: "DFT4G67", garagemId: "gar-leste", status: "ATIVO" },
  { id: "vei-10920", prefixo: "10920", placa: "EGH5I89", garagemId: "gar-central", status: "ATIVO" },
  { id: "vei-11045", prefixo: "11045", placa: "FHK6J01", garagemId: "gar-norte", status: "ATIVO" },
];

export const SEED_INSPETORES: Omit<Inspetor, "criadoEm" | "atualizadoEm">[] = [
  { id: "ins-carlos", nomeCompleto: "Carlos Andrade", funcao: "Inspetor", garagemId: "gar-central", status: "ATIVO" },
  { id: "ins-fernanda", nomeCompleto: "Fernanda Souza", funcao: "Encarregado", garagemId: "gar-norte", status: "ATIVO" },
  { id: "ins-joao", nomeCompleto: "João Pereira", funcao: "Inspetor", garagemId: "gar-central", status: "ATIVO" },
  { id: "ins-marcos", nomeCompleto: "Marcos Lima", funcao: "Encarregado", garagemId: "gar-sul", status: "ATIVO" },
  { id: "ins-patricia", nomeCompleto: "Patrícia Gomes", funcao: "Inspetor", garagemId: "gar-leste", status: "ATIVO" },
];

export const SEED_EQUIPES: Omit<Equipe, "criadoEm" | "atualizadoEm">[] = [
  { id: "equ-alfa", nome: "Equipe Alfa", garagemId: "gar-central", turnoPadrao: "Manhã", status: "ATIVO" },
  { id: "equ-bravo", nome: "Equipe Bravo", garagemId: "gar-norte", turnoPadrao: "Tarde", status: "ATIVO" },
  { id: "equ-charlie", nome: "Equipe Charlie", garagemId: "gar-sul", turnoPadrao: "Noite", status: "ATIVO" },
  { id: "equ-delta", nome: "Equipe Delta", garagemId: "gar-leste", status: "ATIVO" },
];

// Catálogo inicial do checklist (equivalente ao antigo CHECKLIST_CATALOG
// estático), agora como cadastro editável. Os IDs e categorias dos 30 itens
// originais foram preservados para manter continuidade com inspeções já
// realizadas. Números de ordem usam espaçamento (100, 110, 120...) para
// permitir inserir novos itens no meio de uma categoria sem renumerar tudo.
const NORMAL = "NORMAL" as const;
const TODOS = "TODOS" as const;

export const SEED_ITENS_CHECKLIST: Omit<ItemChecklistCadastro, "criadoEm" | "atualizadoEm">[] = [
  // Área externa
  { id: "ext-1", categoria: "externa", nome: "Lataria e carroceria lavadas", ordem: 100, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "ext-2", categoria: "externa", nome: "Vidros e para-brisas limpos", ordem: 110, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "ext-3", categoria: "externa", nome: "Retrovisores limpos e íntegros", ordem: 120, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "ext-4", categoria: "externa", nome: "Rodas e paralamas limpos", ordem: 130, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "ext-5", categoria: "externa", nome: "Faróis e lanternas limpos", ordem: 140, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "ext-6", categoria: "externa", nome: "Portas externas limpas e funcionando", ordem: 150, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },

  // Salão de passageiros (itens originais)
  { id: "sal-1", categoria: "salao", nome: "Piso do salão varrido e lavado", ordem: 200, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-2", categoria: "salao", nome: "Bancos limpos e sem resíduos", ordem: 210, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-3", categoria: "salao", nome: "Janelas internas limpas", ordem: 220, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-4", categoria: "salao", nome: "Corrimãos e barras de apoio limpos", ordem: 230, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-5", categoria: "salao", nome: "Teto e forração limpos", ordem: 240, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-6", categoria: "salao", nome: "Lixeiras esvaziadas e limpas", ordem: 250, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-7", categoria: "salao", nome: "Sistema de ventilação/ar-condicionado limpo", ordem: 260, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-8", categoria: "salao", nome: "Ausência de objetos esquecidos", ordem: 270, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },

  // Salão de passageiros (itens novos — checklist interno completo)
  { id: "sal-9", categoria: "salao", nome: "Capas presentes", ordem: 280, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-10", categoria: "salao", nome: "Capas limpas", ordem: 290, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-11", categoria: "salao", nome: "Cintos de segurança limpos", ordem: 300, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-12", categoria: "salao", nome: "Cintos de segurança afivelados/organizados", ordem: 310, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-13", categoria: "salao", nome: "Descansos dos pés limpos", ordem: 320, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-14", categoria: "salao", nome: "Porta-copos limpos", ordem: 330, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-15", categoria: "salao", nome: "Porta-copos secos", ordem: 340, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-16", categoria: "salao", nome: "Bebedouro abastecido com água", ordem: 350, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-17", categoria: "salao", nome: "Copos disponíveis", ordem: 360, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-18", categoria: "salao", nome: "Bebedouro corretamente fixado", ordem: 370, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "sal-19", categoria: "salao", nome: "Bebedouro limpo", ordem: 380, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },

  // Cabine do motorista
  { id: "cab-1", categoria: "cabine", nome: "Painel e volante limpos", ordem: 400, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "cab-2", categoria: "cabine", nome: "Banco do motorista limpo", ordem: 410, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "cab-3", categoria: "cabine", nome: "Piso da cabine limpo", ordem: 420, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "cab-4", categoria: "cabine", nome: "Retrovisores internos limpos", ordem: 430, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "cab-5", categoria: "cabine", nome: "Ausência de resíduos e lixo", ordem: 440, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },

  // Banheiro
  { id: "ban-1", categoria: "banheiro", nome: "Vaso sanitário higienizado", ordem: 500, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "ban-2", categoria: "banheiro", nome: "Piso do banheiro limpo", ordem: 510, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "ban-3", categoria: "banheiro", nome: "Espelho limpo", ordem: 520, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "ban-4", categoria: "banheiro", nome: "Insumos repostos (papel, sabonete)", ordem: 530, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "ban-5", categoria: "banheiro", nome: "Ausência de odores", ordem: 540, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },

  // Bagageiro
  { id: "bag-1", categoria: "bagageiro", nome: "Piso do bagageiro limpo", ordem: 600, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "bag-2", categoria: "bagageiro", nome: "Ausência de resíduos e objetos estranhos", ordem: 610, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "bag-3", categoria: "bagageiro", nome: "Portas do bagageiro limpas e funcionando", ordem: 620, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },

  // Equipamentos — item condicional, aparece somente para veículos DD
  // (Double Decker). Demonstra a aplicação por classificação do veículo.
  {
    id: "equip-1",
    categoria: "equipamentos",
    nome: "Mantas presentes",
    ordem: 650,
    status: "ATIVO",
    aplicacaoTipo: "CLASSIFICACAO",
    aplicacaoClassificacao: "DD",
    criticidadePadrao: NORMAL,
  },

  // Acabamento final
  { id: "aca-1", categoria: "acabamento", nome: "Cheiro agradável em todo o veículo", ordem: 700, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "aca-2", categoria: "acabamento", nome: "Inspeção visual final aprovada", ordem: 710, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
  { id: "aca-3", categoria: "acabamento", nome: "Veículo pronto para operação", ordem: 720, status: "ATIVO", aplicacaoTipo: TODOS, criticidadePadrao: NORMAL },
];
