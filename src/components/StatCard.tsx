export default function StatCard({
  label,
  value,
  tone = "default",
  emoji,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "green" | "red" | "amber" | "blue";
  emoji?: string;
}) {
  const toneClass = {
    default: "bg-white text-slate-900 ring-slate-200",
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    red: "bg-red-50 text-red-800 ring-red-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    blue: "bg-blue-50 text-blue-800 ring-blue-200",
  }[tone];

  return (
    <div className={`flex flex-col gap-1 rounded-2xl p-4 shadow-sm ring-1 ${toneClass}`}>
      <span className="text-xs font-medium opacity-70">
        {emoji ? `${emoji} ` : ""}
        {label}
      </span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}
