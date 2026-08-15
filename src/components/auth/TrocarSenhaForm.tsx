"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "@/components/cadastros/form-styles";
import ErrorBanner from "@/components/cadastros/ErrorBanner";

export default function TrocarSenhaForm({ obrigatoria }: { obrigatoria: boolean }) {
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      setErro("A nova senha e a confirmação não coincidem.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/auth/trocar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Não foi possível trocar a senha.");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <ErrorBanner mensagem={erro} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">
          {obrigatoria ? "Senha provisória" : "Senha atual"}
        </label>
        <input
          className={inputClass}
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          placeholder="••••••••"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Nova senha</label>
        <input
          className={inputClass}
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          placeholder="Mínimo de 8 caracteres"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Confirmar nova senha</label>
        <input
          className={inputClass}
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          placeholder="Repita a nova senha"
        />
      </div>

      <button
        type="submit"
        disabled={enviando || !senhaAtual || novaSenha.length < 8 || !confirmarSenha}
        className="mt-2 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md disabled:opacity-50"
      >
        {enviando ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
