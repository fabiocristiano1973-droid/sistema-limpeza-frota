export interface RankingUnidadeItem {
  unidade: string;
  destaque: string;
  detalhe: string;
  valorBarra: number;
}

export default function RankingUnidadeList({
  itens,
  corBarra,
}: {
  itens: RankingUnidadeItem[];
  corBarra: string;
}) {
  const max = Math.max(1, ...itens.map((i) => i.valorBarra));

  if (itens.length === 0) {
    return <p className="text-sm text-slate-400">Sem dados suficientes ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {itens.map((item, idx) => (
        <div key={item.unidade} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-semibold text-slate-800">
              {idx + 1}. {item.unidade}
            </span>
            <span className="shrink-0 text-right">
              <span className="font-bold text-slate-900">{item.destaque}</span>{" "}
              <span className="text-xs text-slate-400">({item.detalhe})</span>
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${corBarra}`}
              style={{ width: `${(item.valorBarra / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
