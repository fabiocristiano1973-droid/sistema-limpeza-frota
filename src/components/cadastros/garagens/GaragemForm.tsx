"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/cadastros/FormField";
import ErrorBanner from "@/components/cadastros/ErrorBanner";
import { inputClass } from "@/components/cadastros/form-styles";
import { Garagem } from "@/types/cadastros";

export default function GaragemForm({ garagem }: { garagem?: Garagem }) {
  const router = useRouter();
  const editando = Boolean(garagem);

  const [nome, setNome] = useState(garagem?.nome ?? "");
  const [sigla, setSigla] = useState(garagem?.sigla ?? "");
  const [cidade, setCidade] = useState(garagem?.cidade ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !sigla.trim() || !cidade.trim()) {
      setErro("Nome, sigla e cidade são obrigatórios.");
      return;
    }
    setEnviando(true);
    setErro(null);

    try {
      const url = editando ? `/api/cadastros/garagens/${garagem!.id}` : "/api/cadastros/garagens";
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), sigla: sigla.trim().toUpperCase(), cidade: cidade.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Não foi possível salvar a unidade.");
      }
      router.push("/cadastros/garagens");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <ErrorBanner mensagem={erro} />

      <FormField label="Nome da unidade" required>
        <input className={inputClass} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Garagem Central" />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Sigla" required>
          <input
            className={inputClass}
            value={sigla}
            onChange={(e) => setSigla(e.target.value.toUpperCase())}
            placeholder="Ex: CTR"
            maxLength={10}
          />
        </FormField>
        <FormField label="Cidade" required>
          <input className={inputClass} value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Itabuna" />
        </FormField>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/cadastros/garagens")}
          className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-base font-semibold text-slate-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md disabled:opacity-50"
        >
          {enviando ? "Salvando..." : "Salvar Unidade"}
        </button>
      </div>
    </form>
  );
}
