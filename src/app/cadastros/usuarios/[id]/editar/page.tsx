import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import UsuarioForm from "@/components/cadastros/usuarios/UsuarioForm";
import { usuariosRepo } from "@/lib/repository/usuarios";
import { paraUsuarioPublico } from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await usuariosRepo.getById(id);
  if (!usuario) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo={`Editar ${usuario.nome}`} voltarPara="/cadastros/usuarios" largo />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <UsuarioForm usuario={paraUsuarioPublico(usuario)} />
        </div>
      </main>
    </div>
  );
}
