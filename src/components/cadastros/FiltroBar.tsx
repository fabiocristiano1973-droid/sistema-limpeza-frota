import Link from "next/link";
import { ReactNode } from "react";
import { inputClass, labelClass, selectClass } from "./form-styles";

export default function FiltroBar({
  buscaPlaceholder,
  buscaValor,
  statusValor,
  limparHref,
  filhosExtras,
}: {
  buscaPlaceholder: string;
  buscaValor: string;
  statusValor: string;
  limparHref: string;
  filhosExtras?: ReactNode;
}) {
  return (
    <details className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" open>
      <summary className="cursor-pointer text-sm font-semibold text-slate-700">
        🔎 Pesquisa e filtros
      </summary>
      <form method="get" className="mt-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
        <div className="flex flex-1 flex-col gap-1 md:min-w-[220px]">
          <label className={labelClass}>Buscar</label>
          <input name="q" defaultValue={buscaValor} className={inputClass} placeholder={buscaPlaceholder} />
        </div>

        <div className="flex flex-col gap-1 md:w-40">
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={statusValor} className={selectClass}>
            <option value="">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </div>

        {filhosExtras}

        <div className="flex gap-2">
          <button type="submit" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
            Aplicar
          </button>
          <Link
            href={limparHref}
            className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700"
          >
            Limpar
          </Link>
        </div>
      </form>
    </details>
  );
}
