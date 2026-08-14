import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/cadastros/StatusBadge";
import ToggleStatusButton from "@/components/cadastros/ToggleStatusButton";
import FiltroBar from "@/components/cadastros/FiltroBar";
import { tiposLimpezaRepo } from "@/lib/repository/cadastros";
import { filtrarRegistros } from "@/lib/filtro-cadastro";

export const dynamic = "force-dynamic";

export default async function TiposLimpezaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v ?? "";
  };

  const tipos = await tiposLimpezaRepo.list();
  const filtrados = filtrarRegistros(tipos, {
    q: get("q"),
    status: get("status"),
    camposBusca: ["nome", "descricao"],
  }).sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader
        titulo="Tipos de Limpeza"
        subtitulo={`${tipos.length} tipo(s) cadastrado(s)`}
        voltarPara="/cadastros"
        largo
      />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-4xl">
        <Link
          href="/cadastros/tipos-limpeza/novo"
          className="mb-4 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md"
        >
          ➕ Novo Tipo de Limpeza
        </Link>

        <FiltroBar
          buscaPlaceholder="Nome ou descrição"
          buscaValor={get("q")}
          statusValor={get("status")}
          limparHref="/cadastros/tipos-limpeza"
        />

        <p className="mb-2 text-sm text-slate-500">{filtrados.length} resultado(s)</p>

        <div className="flex flex-col gap-3">
          {filtrados.map((t) => (
            <div key={t.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{t.nome}</p>
                  {t.descricao && <p className="mt-1 text-sm text-slate-500">{t.descricao}</p>}
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Link
                  href={`/cadastros/tipos-limpeza/${t.id}/editar`}
                  className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Editar
                </Link>
                <ToggleStatusButton entidade="tipos-limpeza" id={t.id} status={t.status} nomeRegistro={t.nome} />
              </div>
            </div>
          ))}

          {filtrados.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
              Nenhum tipo de limpeza encontrado.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
