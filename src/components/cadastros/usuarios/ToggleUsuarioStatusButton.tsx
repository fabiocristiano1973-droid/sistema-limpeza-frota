"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusCadastro } from "@/types/cadastros";

export default function ToggleUsuarioStatusButton({
  id,
  status,
  nomeRegistro,
}: {
  id: string;
  status: StatusCadastro;
  nomeRegistro: string;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const vaiInativar = status === "ATIVO";
  const novoStatus: StatusCadastro = vaiInativar ? "INATIVO" : "ATIVO";

  async function confirmar() {
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Não foi possível atualizar o status.");
      }
      setConfirmando(false);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  if (confirmando) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-1.5">
          <button
            onClick={confirmar}
            disabled={enviando}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50 ${
              vaiInativar ? "bg-red-600" : "bg-emerald-600"
            }`}
          >
            {enviando ? "..." : "Confirmar"}
          </button>
          <button
            onClick={() => setConfirmando(false)}
            disabled={enviando}
            className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
          >
            Cancelar
          </button>
        </div>
        {erro && <span className="max-w-[160px] text-right text-[11px] text-red-600">{erro}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      title={`${vaiInativar ? "Inativar" : "Ativar"} ${nomeRegistro}`}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 ${
        vaiInativar
          ? "text-red-700 ring-red-200 bg-red-50"
          : "text-emerald-700 ring-emerald-200 bg-emerald-50"
      }`}
    >
      {vaiInativar ? "Inativar" : "Ativar"}
    </button>
  );
}
