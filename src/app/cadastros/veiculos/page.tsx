import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/cadastros/StatusBadge";
import ToggleStatusButton from "@/components/cadastros/ToggleStatusButton";
import FiltroBar from "@/components/cadastros/FiltroBar";
import { selectClass, labelClass } from "@/components/cadastros/form-styles";
import { garagensRepo, veiculosRepo } from "@/lib/repository/cadastros";
import { filtrarRegistros } from "@/lib/filtro-cadastro";

export const dynamic = "force-dynamic";

export default async function VeiculosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v ?? "";
  };

  const [veiculos, garagens] = await Promise.all([veiculosRepo.list(), garagensRepo.list()]);
  const garagemPorId = new Map(garagens.map((g) => [g.id, g]));

  let filtrados = filtrarRegistros(veiculos, {
    q: get("q"),
    status: get("status"),
    camposBusca: ["prefixo", "placa"],
  });

  const garagemFiltro = get("garagemId");
  if (garagemFiltro) {
    filtrados = filtrados.filter((v) => v.garagemId === garagemFiltro);
  }

  filtrados = [...filtrados].sort((a, b) => a.prefixo.localeCompare(b.prefixo));

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader
        titulo="Frota"
        subtitulo={`${veiculos.length} veículo(s) cadastrado(s)`}
        voltarPara="/cadastros"
        largo
      />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-5xl">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/cadastros/veiculos/novo"
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md"
          >
            ➕ Novo Veículo
          </Link>
          <Link
            href="/cadastros/veiculos/importar"
            className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-300"
          >
            📥 Importar CSV/XLSX
          </Link>
        </div>

        <FiltroBar
          buscaPlaceholder="Prefixo ou placa"
          buscaValor={get("q")}
          statusValor={get("status")}
          limparHref="/cadastros/veiculos"
          filhosExtras={
            <div className="flex flex-col gap-1 md:w-48">
              <label className={labelClass}>Garagem/Unidade</label>
              <select name="garagemId" defaultValue={get("garagemId")} className={selectClass}>
                <option value="">Todas</option>
                {garagens.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        <p className="mb-2 text-sm text-slate-500">{filtrados.length} resultado(s)</p>

        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Prefixo</th>
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Garagem/Unidade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-900">{v.prefixo}</td>
                  <td className="px-4 py-3 text-slate-600">{v.placa}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {v.garagemId ? garagemPorId.get(v.garagemId)?.nome ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/cadastros/veiculos/${v.id}/editar`}
                        className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Editar
                      </Link>
                      <ToggleStatusButton
                        entidade="veiculos"
                        id={v.id}
                        status={v.status}
                        nomeRegistro={`veículo ${v.prefixo}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    Nenhum veículo encontrado com os filtros selecionados.
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
