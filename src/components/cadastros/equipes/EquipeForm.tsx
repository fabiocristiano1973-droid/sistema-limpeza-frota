"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/cadastros/FormField";
import ErrorBanner from "@/components/cadastros/ErrorBanner";
import { inputClass, selectClass } from "@/components/cadastros/form-styles";
import { Equipe, Garagem } from "@/types/cadastros";
import { TURNOS } from "@/lib/fixtures";

export default function EquipeForm({ garagens, equipe }: { garagens: Garagem[]; equipe?: Equipe }) {
  const router = useRouter();
  const editando = Boolean(equipe);

  const [nome, setNome] = useState(equipe?.nome ?? "");
  const [garagemId, setGaragemId] = useState(equipe?.garagemId ?? "");
  const [turnoPadrao, setTurnoPadrao] = useState(equipe?.turnoPadrao ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("Nome da equipe é obrigatório.");
      return;
    }
    setEnviando(true);
    setErro(null);

    try {
      const url = editando ? `/api/cadastros/equipes/${equipe!.id}` : "/api/cadastros/equipes";
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          garagemId: garagemId || undefined,
          turnoPadrao: turnoPadrao || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Não foi possível salvar a equipe.");
      }
      router.push("/cadastros/equipes");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <ErrorBanner mensagem={erro} />

      <FormField label="Nome da equipe" required>
        <input className={inputClass} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Equipe Alfa" />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Unidade">
          <select className={selectClass} value={garagemId} onChange={(e) => setGaragemId(e.target.value)}>
            <option value="">Sem unidade definida</option>
            {garagens.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Turno padrão" hint="Usado para sugerir o turno na inspeção">
          <select className={selectClass} value={turnoPadrao} onChange={(e) => setTurnoPadrao(e.target.value)}>
            <option value="">Não se aplica</option>
            {TURNOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/cadastros/equipes")}
          className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-base font-semibold text-slate-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md disabled:opacity-50"
        >
          {enviando ? "Salvando..." : "Salvar Equipe"}
        </button>
      </div>
    </form>
  );
}
