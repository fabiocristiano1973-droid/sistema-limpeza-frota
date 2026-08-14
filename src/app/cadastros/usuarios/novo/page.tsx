import PageHeader from "@/components/PageHeader";
import UsuarioForm from "@/components/cadastros/usuarios/UsuarioForm";

export const dynamic = "force-dynamic";

export default function NovoUsuarioPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo="Novo Usuário" voltarPara="/cadastros/usuarios" largo />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <UsuarioForm />
        </div>
      </main>
    </div>
  );
}
