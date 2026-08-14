"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/cadastros/FormField";
import ErrorBanner from "@/components/cadastros/ErrorBanner";
import { inputClass, selectClass } from "@/components/cadastros/form-styles";
import { FuncaoInspetor, Garagem, Inspetor } from "@/types/cadastros";

const FUNCOES: FuncaoInspetor[] = ["Inspetor", "Encarregado", "Outros Autorizados"];

export default function InspetorForm({
  garagens,
  inspetor,
}: {
  garagens: Garagem[];
  inspetor?: Inspetor;
}) {
  const router = useRouter();
  const editando = Boolean(inspetor);

  const [nomeCompleto, setNomeCompleto] = useState(inspetor?.nomeCompleto ?? "");
  const [matricula, setMatricula] = useState(inspetor?.matricula ?? "");
  const [funcao, setFuncao] = useState<FuncaoInspetor>(inspetor?.funcao ?? "Inspetor");
  const [garagemId, setGaragemId] = useState(inspetor?.garagemId ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeCompleto.trim()) {
      setErro("Nome completo é obrigatório.");
      return;
    }
    setEnviando(true);
    setErro(null);

    try {
      const url = editando ? `/api/cadastros/inspetores/${inspetor!.id}` : "/api/cadastros/inspetores";
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeCompleto: nomeCompleto.trim(),
          matricula: matricula.trim() || undefined,
          funcao,
          garagemId: garagemId || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Não foi possível salvar o inspetor.");
      }
      router.push("/cadastros/inspetores");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <ErrorBanner mensagem={erro} />

      <FormField label="Nome completo" required>
        <input className={inputClass} value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Matrícula" hint="Se utilizada pela empresa">
          <input className={inputClass} value={matricula} onChange={(e) => setMatricula(e.target.value)} />
        </FormField>

        <FormField label="Função" required>
          <select className={selectClass} value={funcao} onChange={(e) => setFuncao(e.target.value as FuncaoInspetor)}>
            {FUNCOES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </FormField>
      </div>

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

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/cadastros/inspetores")}
          className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-base font-semibold text-slate-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md disabled:opacity-50"
        >
          {enviando ? "Salvando..." : "Salvar Inspetor"}
        </button>
      </div>
    </form>
  );
}
