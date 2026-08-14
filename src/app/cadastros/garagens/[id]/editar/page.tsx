import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import GaragemForm from "@/components/cadastros/garagens/GaragemForm";
import { garagensRepo } from "@/lib/repository/cadastros";

export const dynamic = "force-dynamic";

export default async function EditarGaragemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const garagem = await garagensRepo.getById(id);
  if (!garagem) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo={`Editar ${garagem.nome}`} voltarPara="/cadastros/garagens" largo />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <GaragemForm garagem={garagem} />
        </div>
      </main>
    </div>
  );
}
