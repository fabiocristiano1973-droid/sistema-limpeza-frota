import PageHeader from "@/components/PageHeader";
import ItemChecklistForm from "@/components/cadastros/itens-checklist/ItemChecklistForm";
import { itensChecklistRepo, veiculosRepo } from "@/lib/repository/cadastros";

export const dynamic = "force-dynamic";

export default async function NovoItemChecklistPage() {
  const [itensExistentes, veiculos] = await Promise.all([
    itensChecklistRepo.list(),
    veiculosRepo.list(),
  ]);
  const classificacoesVeiculos = Array.from(
    new Set(veiculos.map((v) => v.tipoVeiculo).filter((t): t is string => Boolean(t && t.trim())))
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo="Novo Item do Checklist" voltarPara="/cadastros/itens-checklist" largo />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <ItemChecklistForm itensExistentes={itensExistentes} classificacoesVeiculos={classificacoesVeiculos} />
        </div>
      </main>
    </div>
  );
}
