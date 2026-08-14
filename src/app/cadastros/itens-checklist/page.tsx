import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/cadastros/StatusBadge";
import ToggleStatusButton from "@/components/cadastros/ToggleStatusButton";
import FiltroBar from "@/components/cadastros/FiltroBar";
import { selectClass, labelClass } from "@/components/cadastros/form-styles";
import { itensChecklistRepo } from "@/lib/repository/cadastros";
import { filtrarRegistros } from "@/lib/filtro-cadastro";
import { obterInfoCategoria } from "@/lib/checklist-catalog";

export const dynamic = "force-dynamic";

export default async function ItensChecklistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v ?? "";
  };

  const itens = await itensChecklistRepo.list();
  const categoriasExistentes = Array.from(new Set(itens.map((i) => i.categoria))).sort();

  let filtrados = filtrarRegistros(itens, {
    q: get("q"),
    status: get("status"),
    camposBusca: ["nome"],
  });

  const categoriaFiltro = get("categoria");
  if (categoriaFiltro) {
    filtrados = filtrados.filter((i) => i.categoria === categoriaFiltro);
  }

  filtrados = [...filtrados].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader
        titulo="Itens do Checklist"
        subtitulo={`${itens.length} item(ns) cadastrado(s)`}
        voltarPara="/cadastros"
        largo
      />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-5xl">
        <Link
          href="/cadastros/itens-checklist/novo"
          className="mb-4 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md"
        >
          ➕ Novo Item do Checklist
        </Link>

        <FiltroBar
          buscaPlaceholder="Nome do item"
          buscaValor={get("q")}
          statusValor={get("status")}
          limparHref="/cadastros/itens-checklist"
          filhosExtras={
            <div className="flex flex-col gap-1 md:w-52">
              <label className={labelClass}>Categoria / Área</label>
              <select name="categoria" defaultValue={get("categoria")} className={selectClass}>
                <option value="">Todas</option>
                {categoriasExistentes.map((c) => (
                  <option key={c} value={c}>
                    {obterInfoCategoria(c).icone} {obterInfoCategoria(c).label}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        <p className="mb-2 text-sm text-slate-500">{filtrados.length} resultado(s)</p>

        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Ordem</th>
                <th className="px-4 py-3">Categoria/Área</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Aplicação</th>
                <th className="px-4 py-3">Criticidade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((item) => {
                const info = obterInfoCategoria(item.categoria);
                return (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 text-slate-400">{item.ordem}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {info.icone} {info.label}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.nome}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.aplicacaoTipo === "TODOS" ? (
                        "Todos os veículos"
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                          Somente {item.aplicacaoClassificacao}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.criticidadePadrao === "CRITICO" ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                          🔴 Crítico
                        </span>
                      ) : (
                        <span className="text-slate-500">⚪ Normal</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/cadastros/itens-checklist/${item.id}/editar`}
                          className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Editar
                        </Link>
                        <ToggleStatusButton
                          entidade="itens-checklist"
                          id={item.id}
                          status={item.status}
                          nomeRegistro={item.nome}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                    Nenhum item encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
