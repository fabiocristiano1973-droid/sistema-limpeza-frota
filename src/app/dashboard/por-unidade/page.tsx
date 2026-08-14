import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import ParetoChart from "@/components/dashboard/ParetoChart";
import EvolucaoChart from "@/components/dashboard/EvolucaoChart";
import RankingUnidadeList from "@/components/dashboard/RankingUnidadeList";
import { getRepository } from "@/lib/repository";
import { calcularDesempenhoPorUnidade } from "@/lib/dashboard-unidade";
import { equipesRepo, garagensRepo, inspetoresRepo, tiposLimpezaRepo, veiculosRepo } from "@/lib/repository/cadastros";
import { TURNOS } from "@/lib/fixtures";
import { InspectionFilter } from "@/types/inspection";

export const dynamic = "force-dynamic";

const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";
const labelClass = "text-xs font-medium text-slate-600";

function Secao({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{titulo}</h2>
      {subtitulo && <p className="mb-3 mt-0.5 text-xs text-slate-400">{subtitulo}</p>}
      {!subtitulo && <div className="mb-3" />}
      {children}
    </section>
  );
}

export default async function DesempenhoPorUnidadePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v ?? "";
  };

  const [garagens, veiculos, equipes, inspetores, tiposLimpeza] = await Promise.all([
    garagensRepo.list(),
    veiculosRepo.list(),
    equipesRepo.list(),
    inspetoresRepo.list(),
    tiposLimpezaRepo.list(),
  ]);

  const filter: InspectionFilter = {
    from: get("from") || undefined,
    to: get("to") ? `${get("to")}T23:59:59.999Z` : undefined,
    garagem: get("garagem") || undefined,
    prefixo: get("prefixo") || undefined,
    turno: get("turno") || undefined,
    equipe: get("equipe") || undefined,
    inspetor: get("inspetor") || undefined,
    tipoLimpeza: get("tipoLimpeza") || undefined,
    resultado: (get("resultado") as "APROVADO" | "REPROVADO") || undefined,
  };

  const repo = getRepository();
  const inspecoes = await repo.list(filter);
  const desempenho = calcularDesempenhoPorUnidade(inspecoes);

  const porVolume = [...desempenho].sort((a, b) => b.reprovadas - a.reprovadas).slice(0, 8);
  const porTaxa = [...desempenho]
    .filter((d) => d.totalInspecoes > 0)
    .sort((a, b) => b.taxaReprovacao - a.taxaReprovacao)
    .slice(0, 8);
  const porNome = [...desempenho].sort((a, b) => a.unidade.localeCompare(b.unidade));

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader
        titulo="Desempenho por Garagem/Unidade"
        subtitulo="Reprovações, causas e evolução por local"
        voltarPara="/dashboard"
        largo
      />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-4xl">
        <details className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            🔎 Filtros da análise
          </summary>
          <form method="get" className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>De</label>
              <input type="date" name="from" defaultValue={get("from").slice(0, 10)} className={selectClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Até</label>
              <input type="date" name="to" defaultValue={get("to").slice(0, 10)} className={selectClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>Garagem/Unidade</label>
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
              <label className={labelClass}>Veículo (prefixo)</label>
              <select name="prefixo" defaultValue={get("prefixo")} className={selectClass}>
                <option value="">Todos</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.prefixo}>
                    {v.prefixo}
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
              <label className={labelClass}>Inspetor/Encarregado</label>
              <select name="inspetor" defaultValue={get("inspetor")} className={selectClass}>
                <option value="">Todos</option>
                {inspetores.map((i) => (
                  <option key={i.id} value={i.nomeCompleto}>
                    {i.nomeCompleto}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>Tipo de limpeza</label>
              <select name="tipoLimpeza" defaultValue={get("tipoLimpeza")} className={selectClass}>
                <option value="">Todos</option>
                {tiposLimpeza.map((t) => (
                  <option key={t.id} value={t.nome}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
              <label className={labelClass}>Resultado</label>
              <select name="resultado" defaultValue={get("resultado")} className={selectClass}>
                <option value="">Todos</option>
                <option value="APROVADO">Aprovado</option>
                <option value="REPROVADO">Reprovado</option>
              </select>
            </div>

            <div className="col-span-2 flex gap-2 md:col-span-1 md:items-end">
              <button type="submit" className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white">
                Aplicar
              </button>
              <Link
                href="/dashboard/por-unidade"
                className="flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-center text-sm font-semibold text-slate-700"
              >
                Limpar
              </Link>
            </div>
          </form>
        </details>

        {inspecoes.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Nenhuma inspeção encontrada com os filtros selecionados.
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-800 ring-1 ring-blue-100">
              ⚠️ <strong>Volume</strong> (quantidade de reprovações) e <strong>Taxa</strong> (% de
              reprovações sobre o total de inspeções daquele local) são medidas diferentes — um local
              com poucas inspeções pode ter taxa alta mesmo com volume baixo, e vice-versa. Os dois
              rankings abaixo mostram sempre as duas informações lado a lado.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Secao titulo="Locais com Maior Número de Reprovações" subtitulo="Ordenado por volume (quantidade)">
                <RankingUnidadeList
                  corBarra="bg-red-500"
                  itens={porVolume.map((d) => ({
                    unidade: d.unidade,
                    destaque: `${d.reprovadas} reprovações`,
                    detalhe: `${d.taxaReprovacao}% de ${d.totalInspecoes}`,
                    valorBarra: d.reprovadas,
                  }))}
                />
              </Secao>

              <Secao titulo="Locais com Maior Taxa de Reprovação" subtitulo="Ordenado por percentual (%)">
                <RankingUnidadeList
                  corBarra="bg-orange-500"
                  itens={porTaxa.map((d) => ({
                    unidade: d.unidade,
                    destaque: `${d.taxaReprovacao}%`,
                    detalhe: `${d.reprovadas} de ${d.totalInspecoes}`,
                    valorBarra: d.taxaReprovacao,
                  }))}
                />
              </Secao>
            </div>

            <Secao titulo="Desempenho por Garagem/Unidade">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 uppercase tracking-wide text-slate-400">
                      <th className="px-2 py-2">Unidade</th>
                      <th className="px-2 py-2 text-right">Inspeções</th>
                      <th className="px-2 py-2 text-right">Aprovadas</th>
                      <th className="px-2 py-2 text-right">Reprovadas</th>
                      <th className="px-2 py-2 text-right">Taxa Aprov.</th>
                      <th className="px-2 py-2 text-right">Taxa Reprov.</th>
                      <th className="px-2 py-2 text-right">Total NC</th>
                      <th className="px-2 py-2 text-right">NC Críticas</th>
                      <th className="px-2 py-2 text-right">Média NC/Insp.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porNome.map((d) => (
                      <tr key={d.unidade} className="border-b border-slate-50 last:border-0">
                        <td className="px-2 py-2 font-semibold text-slate-900">{d.unidade}</td>
                        <td className="px-2 py-2 text-right">{d.totalInspecoes}</td>
                        <td className="px-2 py-2 text-right text-emerald-700">{d.aprovadas}</td>
                        <td className="px-2 py-2 text-right text-red-700">{d.reprovadas}</td>
                        <td className="px-2 py-2 text-right">{d.taxaAprovacao}%</td>
                        <td className="px-2 py-2 text-right font-bold text-red-700">{d.taxaReprovacao}%</td>
                        <td className="px-2 py-2 text-right">{d.totalNC}</td>
                        <td className="px-2 py-2 text-right">{d.ncCriticas}</td>
                        <td className="px-2 py-2 text-right">{d.mediaNcPorInspecao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Secao>

            <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">
              Análise de causa por unidade
            </h2>
            <div className="flex flex-col gap-4">
              {porNome.map((d) => (
                <section key={d.unidade} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">{d.unidade}</h3>
                    <span className="text-xs text-slate-400">
                      {d.totalInspecoes} inspeção(ões) · {d.reprovadas} reprovada(s)
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                    <StatCard label="Taxa de reprovação" value={`${d.taxaReprovacao}%`} tone="red" />
                    <StatCard label="Total de NC" value={d.totalNC} tone="amber" />
                    <StatCard label="NC críticas" value={d.ncCriticas} tone="red" />
                    <StatCard label="Média NC/inspeção" value={d.mediaNcPorInspecao} tone="blue" />
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <p className="rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-slate-400">Área ofensora: </span>
                      <span className="font-semibold text-slate-800">
                        {d.principalArea ? `${d.principalArea.label} (${d.principalArea.ocorrencias})` : "—"}
                      </span>
                    </p>
                    <p className="rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-slate-400">Principal item/causa: </span>
                      <span className="font-semibold text-slate-800">
                        {d.principalItem ? `${d.principalItem.label} (${d.principalItem.ocorrencias})` : "—"}
                      </span>
                    </p>
                    <p className="rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-slate-400">Turno mais crítico: </span>
                      <span className="font-semibold text-slate-800">
                        {d.turnoMaisCritico
                          ? `${d.turnoMaisCritico.turno} (${d.turnoMaisCritico.taxaReprovacao}% de ${d.turnoMaisCritico.totalInspecoes})`
                          : "—"}
                      </span>
                    </p>
                    <p className="rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-slate-400">Equipe mais relacionada: </span>
                      <span className="font-semibold text-slate-800">
                        {d.equipeMaisRelacionada
                          ? `${d.equipeMaisRelacionada.equipe} (${d.equipeMaisRelacionada.reprovadas} reprovações)`
                          : "—"}
                      </span>
                    </p>
                    <p className="rounded-xl bg-slate-50 px-3 py-2 sm:col-span-2">
                      <span className="text-slate-400">Reincidências (mesmo veículo + mesmo item ≥ 2x): </span>
                      <span className="font-semibold text-slate-800">{d.reincidencias}</span>
                    </p>
                  </div>

                  {d.topNaoConformidades.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Pareto de NC — {d.unidade}
                      </p>
                      <ParetoChart dados={d.topNaoConformidades} />
                    </div>
                  )}

                  {d.evolucaoPorPeriodo.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Evolução — {d.unidade}
                      </p>
                      <EvolucaoChart dados={d.evolucaoPorPeriodo} />
                    </div>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
