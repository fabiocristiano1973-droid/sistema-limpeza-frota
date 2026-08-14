import PageHeader from "@/components/PageHeader";
import TipoLimpezaForm from "@/components/cadastros/tipos-limpeza/TipoLimpezaForm";

export default function NovoTipoLimpezaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo="Novo Tipo de Limpeza" voltarPara="/cadastros/tipos-limpeza" largo />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
          <TipoLimpezaForm />
        </div>
      </main>
    </div>
  );
}
