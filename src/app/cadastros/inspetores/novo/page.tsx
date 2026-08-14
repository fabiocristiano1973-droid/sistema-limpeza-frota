import PageHeader from "@/components/PageHeader";
import InspetorForm from "@/components/cadastros/inspetores/InspetorForm";
import { garagensRepo } from "@/lib/repository/cadastros";

export const dynamic = "force-dynamic";

export default async function NovoInspetorPage() {
  const garagens = await garagensRepo.list();
  const ativas = garagens.filter((g) => g.status === "ATIVO");

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo="Novo Inspetor/Encarregado" voltarPara="/cadastros/inspetores" largo />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <InspetorForm garagens={ativas} />
        </div>
      </main>
    </div>
  );
}
