import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/cadastros/StatusBadge";
import ToggleUsuarioStatusButton from "@/components/cadastros/usuarios/ToggleUsuarioStatusButton";
import { usuariosRepo } from "@/lib/repository/usuarios";

export const dynamic = "force-dynamic";

const LABEL_PERFIL: Record<string, string> = {
  INSPETOR: "Inspetor/Encarregado",
  GESTOR: "Gestor",
  ADMIN: "Administrador",
};

export default async function UsuariosPage() {
  const usuarios = (await usuariosRepo.list()).sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader
        titulo="Usuários"
        subtitulo={`${usuarios.length} usuário(s) cadastrado(s)`}
        voltarPara="/cadastros"
        largo
      />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-5xl">
        <Link
          href="/cadastros/usuarios/novo"
          className="mb-4 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md"
        >
          ➕ Novo Usuário
        </Link>

        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Login</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{u.login}</td>
                  <td className="px-4 py-3 text-slate-600">{LABEL_PERFIL[u.perfil] ?? u.perfil}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/cadastros/usuarios/${u.id}/editar`}
                        className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Editar
                      </Link>
                      <ToggleUsuarioStatusButton id={u.id} status={u.status} nomeRegistro={u.nome} />
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
