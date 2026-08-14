import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { TURNOS } from "@/lib/fixtures";
import { equipesRepo, garagensRepo } from "@/lib/repository/cadastros";
import ResultadoBadge from "@/components/ResultadoBadge";
import { InspectionFilter } from "@/types/inspection";

const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";
const labelClass = "text-xs font-medium text-slate-600";

export default async function InspecoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v ?? "";
  };

  const filter: InspectionFilter = {
    from: get("from") || undefined,
    to: get("to") ? `${get("to")}T23:59:59.999Z` : undefined,
    q: get("q") || undefined,
    garagem: get("garagem") || undefined,
    turno: get("turno") || undefined,
    equipe: get("equipe") || undefined,
    resultado: (get("resultado") as "APROVADO" | "REPROVADO") || undefined,
  };

  const repo = getRepository();
  const [inspecoes, garagens, equipes] = await Promise.all([
    repo.list(filter),
    garagensRepo.list(),
    equipesRepo.list(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-10 bg-white px-4 pb-3 pt-4 shadow-sm">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600"
          >
            ←
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Inspeções Realizadas</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
        <details className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            🔎 Filtros de pesquisa
          </summary>
          <form method="get" className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Buscar (prefixo, placa, inspetor...)</label>
              <input
                name="q"
                defaultValue={get("q")}
                className={selectClass}
                placeholder="Ex: 10234 ou Carlos"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>De</label>
                <input type="date" name="from" defaultValue={get("from").slice(0, 10)} className={selectClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Até</label>
                <input type="date" name="to" defaultValue={get("to").slice(0, 10)} className={selectClass} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>Garagem / Unidade</label>
              <select name="garagem" defaultValue={get("garagem")} className={selectClass}>
                <option value="">Todas</option>
                {garagens.map((g) => (
                  <option key={g.id} value={g.nome}>
                    {g.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>Turno</label>
              <select name="turno" defaultValue={get("turno")} className={selectClass}>
                <option value="">Todos</option>
                {TURNOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>Equipe</label>
              <select name="equipe" defaultValue={get("equipe")} className={selectClass}>
                <option value="">Todas</option>
                {equipes.map((e) => (
                  <option key={e.id} value={e.nome}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>Resultado</label>
              <select name="resultado" defaultValue={get("resultado")} className={selectClass}>
                <option value="">Todos</option>
                <option value="APROVADO">Aprovado</option>
                <option value="REPROVADO">Reprovado</option>
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white"
              >
                Aplicar filtros
              </button>
              <Link
                href="/inspecoes"
                className="flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-center text-sm font-semibold text-slate-700"
              >
                Limpar
              </Link>
            </div>
          </form>
        </details>

        <p className="mb-3 text-sm text-slate-500">
          {inspecoes.length} inspeção(ões) encontrada(s)
        </p>

        <div className="flex flex-col gap-3">
          {inspecoes.map((insp) => (
            <Link
              key={insp.id}
              href={`/inspecoes/${insp.id}`}
              className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 active:scale-[0.99] transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">
                  {insp.prefixo} <span className="font-normal text-slate-400">· {insp.placa}</span>
                </span>
                <ResultadoBadge resultado={insp.resumo.resultado} />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>
                  📅 {new Date(insp.criadoEm).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(insp.criadoEm).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>🏢 {insp.garagem}</span>
                <span>🕐 {insp.turno}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>👤 {insp.inspetor}</span>
                <span>🧹 {insp.equipe}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                <span className="text-slate-500">
                  {insp.resumo.conformes} conformes · {insp.resumo.naoConformes} não conformes
                  {insp.resumo.ncCriticas > 0 && (
                    <span className="font-semibold text-red-600">
                      {" "}
                      · {insp.resumo.ncCriticas} crítica(s)
                    </span>
                  )}
                </span>
                <span className="font-bold text-slate-700">
                  {insp.resumo.percentualConformidade}%
                </span>
              </div>
            </Link>
          ))}

          {inspecoes.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
              Nenhuma inspeção encontrada com os filtros selecionados.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
