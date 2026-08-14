import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import VeiculoForm from "@/components/cadastros/veiculos/VeiculoForm";
import { garagensRepo, veiculosRepo } from "@/lib/repository/cadastros";

export const dynamic = "force-dynamic";

export default async function EditarVeiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [veiculo, garagens] = await Promise.all([veiculosRepo.getById(id), garagensRepo.list()]);
  if (!veiculo) notFound();

  const selecionaveis = garagens.filter(
    (g) => g.status === "ATIVO" || g.id === veiculo.garagemId
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader
        titulo={`Editar Veículo ${veiculo.prefixo}`}
        voltarPara="/cadastros/veiculos"
        largo
      />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <VeiculoForm garagens={selecionaveis} veiculo={veiculo} />
        </div>
      </main>
    </div>
  );
}
