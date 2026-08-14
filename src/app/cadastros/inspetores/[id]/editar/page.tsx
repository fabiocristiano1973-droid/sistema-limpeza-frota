import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import InspetorForm from "@/components/cadastros/inspetores/InspetorForm";
import { garagensRepo, inspetoresRepo } from "@/lib/repository/cadastros";

export const dynamic = "force-dynamic";

export default async function EditarInspetorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [inspetor, garagens] = await Promise.all([inspetoresRepo.getById(id), garagensRepo.list()]);
  if (!inspetor) notFound();

  const selecionaveis = garagens.filter((g) => g.status === "ATIVO" || g.id === inspetor.garagemId);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo={`Editar ${inspetor.nomeCompleto}`} voltarPara="/cadastros/inspetores" largo />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <InspetorForm garagens={selecionaveis} inspetor={inspetor} />
        </div>
      </main>
    </div>
  );
}
