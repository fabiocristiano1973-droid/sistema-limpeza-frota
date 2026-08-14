import {
  equipesRepo,
  garagensRepo,
  inspetoresRepo,
  itensChecklistRepo,
  tiposLimpezaRepo,
  validarPrefixoPlacaUnicos,
  veiculosRepo,
} from "./cadastros";
import { JsonCrudRepository } from "./json-crud-factory";

export type EntidadeSlug =
  | "veiculos"
  | "garagens"
  | "tipos-limpeza"
  | "inspetores"
  | "equipes"
  | "itens-checklist";

interface CadastroConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repo: JsonCrudRepository<any>;
  camposObrigatorios: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validarExtra?: (dados: any, idExcluir?: string) => Promise<string | null>;
}

export const CADASTROS: Record<EntidadeSlug, CadastroConfig> = {
  veiculos: {
    repo: veiculosRepo,
    camposObrigatorios: ["prefixo", "placa"],
    validarExtra: (dados, idExcluir) => validarPrefixoPlacaUnicos(dados.prefixo, dados.placa, idExcluir),
  },
  garagens: {
    repo: garagensRepo,
    camposObrigatorios: ["nome", "sigla", "cidade"],
  },
  "tipos-limpeza": {
    repo: tiposLimpezaRepo,
    camposObrigatorios: ["nome"],
  },
  inspetores: {
    repo: inspetoresRepo,
    camposObrigatorios: ["nomeCompleto", "funcao"],
  },
  equipes: {
    repo: equipesRepo,
    camposObrigatorios: ["nome"],
  },
  "itens-checklist": {
    repo: itensChecklistRepo,
    camposObrigatorios: ["categoria", "nome"],
    validarExtra: async (dados) => {
      if (dados.aplicacaoTipo === "CLASSIFICACAO" && !String(dados.aplicacaoClassificacao ?? "").trim()) {
        return 'Informe a classificação de veículo (ex: "DD") para esta aplicação.';
      }
      return null;
    },
  },
};

export function isEntidadeValida(valor: string): valor is EntidadeSlug {
  return valor in CADASTROS;
}
