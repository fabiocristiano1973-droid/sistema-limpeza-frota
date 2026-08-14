"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/cadastros/FormField";
import ErrorBanner from "@/components/cadastros/ErrorBanner";
import { inputClass, selectClass } from "@/components/cadastros/form-styles";
import { PerfilUsuario, UsuarioPublico } from "@/types/auth";

const PERFIS: { value: PerfilUsuario; label: string }[] = [
  { value: "INSPETOR", label: "Inspetor/Encarregado" },
  { value: "GESTOR", label: "Gestor" },
  { value: "ADMIN", label: "Administrador" },
];

export default function UsuarioForm({ usuario }: { usuario?: UsuarioPublico }) {
  const router = useRouter();
  const editando = Boolean(usuario);

  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [login, setLogin] = useState(usuario?.login ?? "");
  const [perfil, setPerfil] = useState<PerfilUsuario>(usuario?.perfil ?? "INSPETOR");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !login.trim()) {
      setErro("Nome e login são obrigatórios.");
      return;
    }
    if (!editando && !senha) {
      setErro("Defina uma senha inicial.");
      return;
    }
    setEnviando(true);
    setErro(null);

    try {
      const url = editando ? `/api/usuarios/${usuario!.id}` : "/api/usuarios";
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          login: login.trim(),
          perfil,
          senha: senha || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Não foi possível salvar o usuário.");
      }
      router.push("/cadastros/usuarios");
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
        <input className={inputClass} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João da Silva" />
      </FormField>

      <FormField label="Login" required hint="Usado para entrar no sistema">
        <input
          className={inputClass}
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="joao.silva"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </FormField>

      <FormField label="Perfil" required>
        <select className={selectClass} value={perfil} onChange={(e) => setPerfil(e.target.value as PerfilUsuario)}>
          {PERFIS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label={editando ? "Nova senha" : "Senha inicial"}
        required={!editando}
        hint={editando ? "Deixe em branco para manter a senha atual" : "Mínimo de 8 caracteres — o usuário deverá trocá-la no primeiro acesso"}
      >
        <input
          className={inputClass}
          type="text"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder={editando ? "••••••••" : "Defina uma senha temporária"}
        />
      </FormField>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/cadastros/usuarios")}
          className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-base font-semibold text-slate-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md disabled:opacity-50"
        >
          {enviando ? "Salvando..." : "Salvar Usuário"}
        </button>
      </div>
    </form>
  );
}
