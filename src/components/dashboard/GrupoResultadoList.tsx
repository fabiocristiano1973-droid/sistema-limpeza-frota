import { GrupoResultado } from "@/lib/dashboard";

export default function GrupoResultadoList({ grupos }: { grupos: GrupoResultado[] }) {
  if (grupos.length === 0) {
    return <p className="text-sm text-slate-400">Sem dados suficientes ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {grupos.map((g) => (
        <div key={g.chave} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate pr-2 font-medium text-slate-700">{g.chave}</span>
            <span className="shrink-0 font-bold text-slate-900">
              {g.percentualAprovacao}% ({g.total})
            </span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${(g.aprovados / g.total) * 100}%` }}
            />
            <div
              className="h-full bg-red-500"
              style={{ width: `${(g.reprovados / g.total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
