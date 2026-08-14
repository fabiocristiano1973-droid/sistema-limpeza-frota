import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { calcularDashboard } from "@/lib/dashboard";
import StatCard from "@/components/StatCard";
import HorizontalBarList from "@/components/dashboard/HorizontalBarList";
import GrupoResultadoList from "@/components/dashboard/GrupoResultadoList";
import ParetoChart from "@/components/dashboard/ParetoChart";
import EvolucaoChart from "@/components/dashboard/EvolucaoChart";

export const dynamic = "force-dynamic";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const repo = getRepository();
  const inspecoes = await repo.list();
  const stats = calcularDashboard(inspecoes);

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
          <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
        <Link
          href="/dashboard/por-unidade"
          className="mb-4 flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-4 text-white shadow-md active:scale-[0.99] transition"
        >
          <span className="text-2xl">🏢</span>
          <span className="flex-1">
            <span className="block text-sm font-bold">Desempenho por Garagem/Unidade</span>
            <span className="block text-xs text-slate-300">
              Reprovações, causas e evolução por local, com filtros
            </span>
          </span>
          <span className="text-lg">→</span>
        </Link>

        {stats.totalInspecoes === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Nenhuma inspeção registrada ainda. Os indicadores aparecerão aqui após a primeira
            inspeção finalizada.
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <StatCard label="Total de inspeções" value={stats.totalInspecoes} emoji="📋" />
              <StatCard label="% de aprovação" value={`${stats.percentualAprovacao}%`} tone="blue" emoji="📈" />
              <StatCard label="Aprovados" value={stats.aprovados} tone="green" emoji="✅" />
              <StatCard label="Reprovados" value={stats.reprovados} tone="red" emoji="⛔" />
              <StatCard label="Total de NC" value={stats.totalNC} tone="amber" emoji="⚠️" />
              <StatCard label="NC Críticas" value={stats.ncCriticas} tone="red" emoji="🔴" />
            </div>

            <Secao titulo="Top Não Conformidades">
              <HorizontalBarList
                items={stats.topNaoConformidades.map((n) => ({ label: n.label, valor: n.ocorrencias }))}
                corBarra="bg-red-500"
              />
            </Secao>

            <Secao titulo="Pareto de Não Conformidades">
              <ParetoChart dados={stats.topNaoConformidades} />
              <p className="mt-2 text-[11px] text-slate-400">
                Barras: ocorrências por item · Linha: % acumulado
              </p>
            </Secao>

            <Secao titulo="Reincidências (mesmo veículo + mesmo item)">
              {stats.reincidencias.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma reincidência identificada ainda.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {stats.reincidencias.map((r) => (
                    <div
                      key={`${r.prefixo}-${r.itemLabel}`}
                      className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-xs ring-1 ring-amber-200"
                    >
                      <span className="text-slate-700">
                        <span className="font-bold">{r.prefixo}</span> — {r.itemLabel}
                      </span>
                      <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 font-bold text-white">
                        {r.ocorrencias}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Secao>

            <Secao titulo="Resultado por Veículo">
              <GrupoResultadoList grupos={stats.resultadoPorVeiculo} />
            </Secao>

            <Secao titulo="Resultado por Equipe">
              <GrupoResultadoList grupos={stats.resultadoPorEquipe} />
            </Secao>

            <Secao titulo="Resultado por Turno">
              <GrupoResultadoList grupos={stats.resultadoPorTurno} />
            </Secao>

            <Secao titulo="Evolução por Período (% aprovação)">
              <EvolucaoChart dados={stats.evolucaoPorPeriodo} />
            </Secao>
          </>
        )}

        <Link
          href="/nova-inspecao"
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md"
        >
          ➕ Nova Inspeção
        </Link>
      </main>
    </div>
  );
}
