import { createCrudRepository } from "./crud-repository";
import {
  SEED_EQUIPES,
  SEED_GARAGENS,
  SEED_INSPETORES,
  SEED_ITENS_CHECKLIST,
  SEED_TIPOS_LIMPEZA,
  SEED_VEICULOS,
} from "@/lib/seed-data";
import { Equipe, Garagem, Inspetor, ItemChecklistCadastro, TipoLimpeza, Veiculo } from "@/types/cadastros";

export const garagensRepo = createCrudRepository<Garagem>("garagens", () => SEED_GARAGENS);

export const tiposLimpezaRepo = createCrudRepository<TipoLimpeza>(
  "tipos_limpeza",
  () => SEED_TIPOS_LIMPEZA
);

export const veiculosRepo = createCrudRepository<Veiculo>("veiculos", () => SEED_VEICULOS);

export const inspetoresRepo = createCrudRepository<Inspetor>(
  "inspetores",
  () => SEED_INSPETORES
);

export const equipesRepo = createCrudRepository<Equipe>("equipes", () => SEED_EQUIPES);

export const itensChecklistRepo = createCrudRepository<ItemChecklistCadastro>(
  "itens_checklist",
  () => SEED_ITENS_CHECKLIST
);

function normalizar(valor: string): string {
  return valor.trim().toLowerCase();
}

export async function validarPrefixoPlacaUnicos(
  prefixo: string,
  placa: string,
  idExcluir?: string
): Promise<string | null> {
  const todos = await veiculosRepo.list();
  const prefixoNorm = normalizar(prefixo);
  const placaNorm = normalizar(placa);

  const prefixoDuplicado = todos.some(
    (v) => v.id !== idExcluir && normalizar(v.prefixo) === prefixoNorm
  );
  if (prefixoDuplicado) return `Já existe um veículo cadastrado com o prefixo "${prefixo}".`;

  const placaDuplicada = todos.some((v) => v.id !== idExcluir && normalizar(v.placa) === placaNorm);
  if (placaDuplicada) return `Já existe um veículo cadastrado com a placa "${placa.toUpperCase()}".`;

  return null;
}
