import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-slate-100 px-4 pb-10 pt-8">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl shadow-md shadow-blue-900/20">
            🚌
          </div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900">
            Inspeção e Liberação da Limpeza da Frota
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Controle rápido da qualidade de limpeza dos ônibus
          </p>
        </header>

        <nav className="flex flex-col gap-4">
          <Link
            href="/nova-inspecao"
            className="flex items-center gap-4 rounded-2xl bg-blue-600 px-5 py-6 text-white shadow-lg shadow-blue-900/20 active:scale-[0.98] transition"
          >
            <span className="text-3xl">➕</span>
            <span className="flex flex-col text-left">
              <span className="text-lg font-semibold">Nova Inspeção</span>
              <span className="text-sm text-blue-100">
                Iniciar checklist de liberação de um ônibus
              </span>
            </span>
          </Link>

          <Link
            href="/inspecoes"
            className="flex items-center gap-4 rounded-2xl bg-white px-5 py-6 shadow-md shadow-slate-300/40 ring-1 ring-slate-200 active:scale-[0.98] transition"
          >
            <span className="text-3xl">📋</span>
            <span className="flex flex-col text-left">
              <span className="text-lg font-semibold text-slate-900">
                Inspeções Realizadas
              </span>
              <span className="text-sm text-slate-500">
                Histórico, filtros e detalhes de cada vistoria
              </span>
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-4 rounded-2xl bg-white px-5 py-6 shadow-md shadow-slate-300/40 ring-1 ring-slate-200 active:scale-[0.98] transition"
          >
            <span className="text-3xl">📊</span>
            <span className="flex flex-col text-left">
              <span className="text-lg font-semibold text-slate-900">Dashboard</span>
              <span className="text-sm text-slate-500">
                Indicadores, reincidências e evolução por período
              </span>
            </span>
          </Link>

          <Link
            href="/cadastros"
            className="flex items-center gap-4 rounded-2xl bg-white px-5 py-6 shadow-md shadow-slate-300/40 ring-1 ring-slate-200 active:scale-[0.98] transition"
          >
            <span className="text-3xl">🗂️</span>
            <span className="flex flex-col text-left">
              <span className="text-lg font-semibold text-slate-900">Cadastros</span>
              <span className="text-sm text-slate-500">
                Frota, unidades, tipos de limpeza, pessoas e equipes
              </span>
            </span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
