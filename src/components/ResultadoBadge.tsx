import { ResultadoInspecao } from "@/types/inspection";

export default function ResultadoBadge({ resultado }: { resultado: ResultadoInspecao }) {
  const aprovado = resultado === "APROVADO";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        aprovado ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
      }`}
    >
      {aprovado ? "✅ APROVADO" : "⛔ REPROVADO"}
    </span>
  );
}
