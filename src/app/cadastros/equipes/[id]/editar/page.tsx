import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import EquipeForm from "@/components/cadastros/equipes/EquipeForm";
import { equipesRepo, garagensRepo } from "@/lib/repository/cadastros";

export const dynamic = "force-dynamic";

export default async function EditarEquipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [equipe, garagens] = await Promise.all([equipesRepo.getById(id), garagensRepo.list()]);
  if (!equipe) notFound();

  const selecionaveis = garagens.filter((g) => g.status === "ATIVO" || g.id === equipe.garagemId);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo={`Editar ${equipe.nome}`} voltarPara="/cadastros/equipes" largo />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <EquipeForm garagens={selecionaveis} equipe={equipe} />
        </div>
      </main>
    </div>
  );
}
