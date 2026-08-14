export default function HorizontalBarList({
  items,
  corBarra = "bg-blue-500",
}: {
  items: { label: string; valor: number; sufixo?: string }[];
  corBarra?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.valor));

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">Sem dados suficientes ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate pr-2 font-medium text-slate-700">{item.label}</span>
            <span className="shrink-0 font-bold text-slate-900">
              {item.valor}
              {item.sufixo ?? ""}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${corBarra}`}
              style={{ width: `${(item.valor / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
