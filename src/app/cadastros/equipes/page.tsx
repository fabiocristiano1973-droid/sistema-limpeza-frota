import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/cadastros/StatusBadge";
import ToggleStatusButton from "@/components/cadastros/ToggleStatusButton";
import FiltroBar from "@/components/cadastros/FiltroBar";
import { equipesRepo, garagensRepo } from "@/lib/repository/cadastros";
import { filtrarRegistros } from "@/lib/filtro-cadastro";

export const dynamic = "force-dynamic";

export default async function EquipesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v ?? "";
  };

  const [equipes, garagens] = await Promise.all([equipesRepo.list(), garagensRepo.list()]);
  const garagemPorId = new Map(garagens.map((g) => [g.id, g]));

  const filtrados = filtrarRegistros(equipes, {
    q: get("q"),
    status: get("status"),
    camposBusca: ["nome"],
  }).sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader
        titulo="Equipes de Limpeza"
        subtitulo={`${equipes.length} equipe(s) cadastrada(s)`}
        voltarPara="/cadastros"
        largo
      />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-5xl">
        <Link
          href="/cadastros/equipes/novo"
          className="mb-4 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md"
        >
          ➕ Nova Equipe
        </Link>

        <FiltroBar
          buscaPlaceholder="Nome da equipe"
          buscaValor={get("q")}
          statusValor={get("status")}
          limparHref="/cadastros/equipes"
        />

        <p className="mb-2 text-sm text-slate-500">{filtrados.length} resultado(s)</p>

        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Unidade</th>
                <th className="px-4 py-3">Turno padrão</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-900">{e.nome}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {e.garagemId ? garagemPorId.get(e.garagemId)?.nome ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.turnoPadrao || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/cadastros/equipes/${e.id}/editar`}
                        className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Editar
                      </Link>
                      <ToggleStatusButton entidade="equipes" id={e.id} status={e.status} nomeRegistro={e.nome} />
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    Nenhuma equipe encontrada.
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
