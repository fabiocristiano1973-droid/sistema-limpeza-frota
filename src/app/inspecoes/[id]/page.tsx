import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repository";
import { categoriasDoCatalogo } from "@/lib/checklist-catalog";
import StatCard from "@/components/StatCard";
import EvidenciaPreview from "@/components/EvidenciaPreview";
import { ItemResultado, StatusItem } from "@/types/inspection";

const STATUS_INFO: Record<StatusItem, { label: string; emoji: string; classe: string }> = {
  CONFORME: { label: "Conforme", emoji: "✅", classe: "bg-emerald-100 text-emerald-800" },
  NAO_CONFORME: { label: "Não Conforme", emoji: "⚠️", classe: "bg-red-100 text-red-800" },
  NA: { label: "N/A", emoji: "➖", classe: "bg-slate-200 text-slate-600" },
};

export default async function DetalheInspecaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const ehNova = sp.nova === "1";

  const repo = getRepository();
  const inspecao = await repo.getById(id);
  if (!inspecao) notFound();

  const itensPorCategoria = (categoria: string): ItemResultado[] =>
    inspecao.itens.filter((i) => i.categoria === categoria);

  // Deriva as categorias diretamente do snapshot desta inspeção (nunca do
  // cadastro atual de itens do checklist) — assim, alterações futuras no
  // cadastro não mudam a forma como inspeções antigas são exibidas.
  const categoriasDaInspecao = categoriasDoCatalogo(inspecao.itens);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-10 bg-white px-4 pb-3 pt-4 shadow-sm">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <Link
            href="/inspecoes"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600"
          >
            ←
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Inspeção #{inspecao.id.slice(0, 8)}
            </p>
            <h1 className="text-lg font-bold text-slate-900">
              {inspecao.prefixo} · {inspecao.placa}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
        {ehNova && (
          <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
            🎉 Inspeção salva com sucesso! Este é o registro permanente.
          </div>
        )}

        <div
          className={`mb-4 flex flex-col items-center gap-1 rounded-2xl px-4 py-6 text-center shadow-md ${
            inspecao.resumo.resultado === "APROVADO"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span className="text-4xl">{inspecao.resumo.resultado === "APROVADO" ? "✅" : "⛔"}</span>
          <span className="text-2xl font-extrabold tracking-wide">{inspecao.resumo.resultado}</span>
        </div>

        <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
          <Row label="Data/Hora" value={new Date(inspecao.criadoEm).toLocaleString("pt-BR")} />
          <Row label="Garagem/Unidade" value={inspecao.garagem} />
          <Row label="Turno" value={inspecao.turno} />
          <Row label="Tipo de limpeza" value={inspecao.tipoLimpeza} />
          <Row label="Inspetor" value={inspecao.inspetor} />
          <Row label="Equipe" value={inspecao.equipe} />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <StatCard label="Itens avaliados" value={inspecao.resumo.totalItens} />
          <StatCard
            label="% Conformidade"
            value={`${inspecao.resumo.percentualConformidade}%`}
            tone="blue"
          />
          <StatCard label="Conformes" value={inspecao.resumo.conformes} tone="green" />
          <StatCard label="Não Conformes" value={inspecao.resumo.naoConformes} tone="red" />
          <StatCard label="N/A" value={inspecao.resumo.naCount} tone="amber" />
          <StatCard label="NC Críticas" value={inspecao.resumo.ncCriticas} tone="red" />
        </div>

        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          Checklist completo
        </h2>
        <div className="flex flex-col gap-4">
          {categoriasDaInspecao.map((cat) => {
            const itensCat = itensPorCategoria(cat.id);
            if (itensCat.length === 0) return null;
            return (
              <div
                key={cat.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span className="text-lg">{cat.icone}</span> {cat.label}
                </h3>
                <div className="flex flex-col gap-3">
                  {itensCat.map((item) => {
                    const info = STATUS_INFO[item.status];
                    return (
                      <div key={item.itemId} className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-slate-800">{item.label}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${info.classe}`}
                          >
                            {info.emoji} {info.label}
                          </span>
                        </div>
                        {item.status === "NAO_CONFORME" && (
                          <div className="mt-2 rounded-xl bg-red-50 p-3 text-xs">
                            <span
                              className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                                item.criticidade === "CRITICA" ? "bg-red-700" : "bg-amber-500"
                              }`}
                            >
                              {item.criticidade === "CRITICA" ? "CRÍTICA" : "NÃO CRÍTICA"}
                            </span>
                            <p className="text-slate-700">{item.observacao}</p>
                            {item.fotoDataUrl && (
                              <EvidenciaPreview
                                url={item.fotoDataUrl}
                                tipo={item.evidenciaTipo}
                                className="mt-2 h-20 w-20 rounded-lg object-cover ring-1 ring-slate-300"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/inspecoes"
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-center text-sm font-semibold text-slate-700"
          >
            Ver histórico
          </Link>
          <Link
            href="/nova-inspecao"
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-center text-sm font-semibold text-white"
          >
            Nova Inspeção
          </Link>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
