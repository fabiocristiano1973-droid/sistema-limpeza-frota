"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/cadastros/FormField";
import ErrorBanner from "@/components/cadastros/ErrorBanner";
import { inputClass, textareaClass } from "@/components/cadastros/form-styles";
import { TipoLimpeza } from "@/types/cadastros";

export default function TipoLimpezaForm({ tipo }: { tipo?: TipoLimpeza }) {
  const router = useRouter();
  const editando = Boolean(tipo);

  const [nome, setNome] = useState(tipo?.nome ?? "");
  const [descricao, setDescricao] = useState(tipo?.descricao ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }
    setEnviando(true);
    setErro(null);

    try {
      const url = editando ? `/api/cadastros/tipos-limpeza/${tipo!.id}` : "/api/cadastros/tipos-limpeza";
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), descricao: descricao.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Não foi possível salvar o tipo de limpeza.");
      }
      router.push("/cadastros/tipos-limpeza");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <ErrorBanner mensagem={erro} />

      <FormField label="Nome do tipo de limpeza" required>
        <input className={inputClass} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Limpeza Geral" />
      </FormField>

      <FormField label="Descrição">
        <textarea className={textareaClass} rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </FormField>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/cadastros/tipos-limpeza")}
          className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-base font-semibold text-slate-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md disabled:opacity-50"
        >
          {enviando ? "Salvando..." : "Salvar Tipo de Limpeza"}
        </button>
      </div>
    </form>
  );
}
