import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ItemChecklistForm from "@/components/cadastros/itens-checklist/ItemChecklistForm";
import { itensChecklistRepo, veiculosRepo } from "@/lib/repository/cadastros";

export const dynamic = "force-dynamic";

export default async function EditarItemChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, itensExistentes, veiculos] = await Promise.all([
    itensChecklistRepo.getById(id),
    itensChecklistRepo.list(),
    veiculosRepo.list(),
  ]);
  if (!item) notFound();

  const classificacoesVeiculos = Array.from(
    new Set(veiculos.map((v) => v.tipoVeiculo).filter((t): t is string => Boolean(t && t.trim())))
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo={`Editar "${item.nome}"`} voltarPara="/cadastros/itens-checklist" largo />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <ItemChecklistForm
            item={item}
            itensExistentes={itensExistentes.filter((i) => i.id !== item.id)}
            classificacoesVeiculos={classificacoesVeiculos}
          />
        </div>
      </main>
    </div>
  );
}
