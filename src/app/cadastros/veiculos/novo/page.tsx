import PageHeader from "@/components/PageHeader";
import VeiculoForm from "@/components/cadastros/veiculos/VeiculoForm";
import { garagensRepo } from "@/lib/repository/cadastros";

export const dynamic = "force-dynamic";

export default async function NovoVeiculoPage() {
  const garagens = await garagensRepo.list();
  const ativas = garagens.filter((g) => g.status === "ATIVO");

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo="Novo Veículo" voltarPara="/cadastros/veiculos" largo />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <VeiculoForm garagens={ativas} />
        </div>
      </main>
    </div>
  );
}
