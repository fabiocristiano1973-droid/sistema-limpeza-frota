import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import TipoLimpezaForm from "@/components/cadastros/tipos-limpeza/TipoLimpezaForm";
import { tiposLimpezaRepo } from "@/lib/repository/cadastros";

export const dynamic = "force-dynamic";

export default async function EditarTipoLimpezaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tipo = await tiposLimpezaRepo.getById(id);
  if (!tipo) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo={`Editar ${tipo.nome}`} voltarPara="/cadastros/tipos-limpeza" largo />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <TipoLimpezaForm tipo={tipo} />
        </div>
      </main>
    </div>
  );
}
