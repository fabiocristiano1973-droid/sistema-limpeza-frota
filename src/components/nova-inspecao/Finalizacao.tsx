"use client";

import StatCard from "@/components/StatCard";
import EvidenciaPreview from "@/components/EvidenciaPreview";
import { ItemEditState } from "@/lib/wizard";
import { calcularResumo } from "@/lib/calculations";
import { converterParaItemResultado } from "@/lib/wizard";
import { obterInfoCategoria } from "@/lib/checklist-catalog";

export default function Finalizacao({ itens }: { itens: ItemEditState[] }) {
  const itensResultado = itens.map(converterParaItemResultado);
  const resumo = calcularResumo(itensResultado);
  const naoConformes = itens.filter((i) => i.status === "NAO_CONFORME");

  return (
    <div className="flex flex-col gap-5">
      <div
        className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-6 text-center shadow-md ${
          resumo.resultado === "APROVADO"
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white"
        }`}
      >
        <span className="text-4xl">{resumo.resultado === "APROVADO" ? "✅" : "⛔"}</span>
        <span className="text-2xl font-extrabold tracking-wide">{resumo.resultado}</span>
        <span className="text-sm opacity-90">
          {resumo.resultado === "APROVADO"
            ? "Veículo liberado para operação"
            : "Veículo NÃO liberado — não conformidade crítica encontrada"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Itens avaliados" value={resumo.totalItens} />
        <StatCard label="% Conformidade" value={`${resumo.percentualConformidade}%`} tone="blue" />
        <StatCard label="Conformes" value={resumo.conformes} tone="green" />
        <StatCard label="Não Conformes" value={resumo.naoConformes} tone="red" />
        <StatCard label="N/A" value={resumo.naCount} tone="amber" />
        <StatCard label="NC Críticas" value={resumo.ncCriticas} tone="red" />
      </div>

      {naoConformes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Não conformidades registradas
          </h3>
          {naoConformes.map((item) => {
            const catInfo = obterInfoCategoria(item.categoria);
            return (
              <div
                key={item.itemId}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {catInfo.icone} {catInfo.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                      item.criticidade === "CRITICA" ? "bg-red-700" : "bg-amber-500"
                    }`}
                  >
                    {item.criticidade === "CRITICA" ? "CRÍTICA" : "NÃO CRÍTICA"}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="mt-1 text-sm text-slate-600">{item.observacao}</p>
                {item.fotoDataUrl && (
                  <EvidenciaPreview
                    url={item.fotoDataUrl}
                    tipo={item.evidenciaTipo}
                    className="mt-2 h-20 w-20 rounded-lg object-cover ring-1 ring-slate-300"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
