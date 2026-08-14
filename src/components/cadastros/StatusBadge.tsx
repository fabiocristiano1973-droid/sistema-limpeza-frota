import { StatusCadastro } from "@/types/cadastros";

export default function StatusBadge({ status }: { status: StatusCadastro }) {
  const ativo = status === "ATIVO";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
      }`}
    >
      {ativo ? "🟢 Ativo" : "⚫ Inativo"}
    </span>
  );
}
