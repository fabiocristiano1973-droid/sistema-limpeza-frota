"use client";

import { CICLO_MATURIDADE, LABEL_ESTAGIO, type EstagioMaturidade } from "@/lib/types";
import { avaliarAvancoParaEstagio, indiceEstagio, type EstatisticasPrincipio } from "@/lib/maturidade";

export default function CicloMaturidade({
  estagioAtual,
  estatisticas,
  onMudar,
}: {
  estagioAtual: EstagioMaturidade;
  estatisticas: EstatisticasPrincipio;
  onMudar: (novoEstagio: EstagioMaturidade) => void;
}) {
  const indiceAtual = indiceEstagio(estagioAtual);

  return (
    <div>
      <div className="flex items-center">
        {CICLO_MATURIDADE.map((estagio, i) => {
          const avaliacao = avaliarAvancoParaEstagio(estagio, estatisticas);
          const alcancado = i <= indiceAtual;
          const bloqueado = !avaliacao.podeAvancar && i > indiceAtual;
          return (
            <div key={estagio} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && <div className={`h-0.5 flex-1 ${i <= indiceAtual ? "bg-[#c8a24d]" : "bg-white/15"}`} />}
                <button
                  title={bloqueado ? avaliacao.motivo : undefined}
                  disabled={bloqueado}
                  onClick={() => onMudar(estagio)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                    alcancado
                      ? "border-[#c8a24d] bg-[#c8a24d] text-[#0b1220]"
                      : bloqueado
                        ? "border-white/10 bg-transparent text-[#4a5468]"
                        : "border-white/25 bg-transparent text-[#cdd5e3]"
                  }`}
                >
                  {i + 1}
                </button>
                {i < CICLO_MATURIDADE.length - 1 && (
                  <div className={`h-0.5 flex-1 ${i < indiceAtual ? "bg-[#c8a24d]" : "bg-white/15"}`} />
                )}
              </div>
              <span className={`mt-1.5 text-center text-[10px] leading-tight ${alcancado ? "text-[#e8c877]" : "text-[#8892a8]"}`}>
                {LABEL_ESTAGIO[estagio]}
              </span>
            </div>
          );
        })}
      </div>

      {(() => {
        const proximo = CICLO_MATURIDADE[indiceAtual + 1];
        if (!proximo) return null;
        const avaliacao = avaliarAvancoParaEstagio(proximo, estatisticas);
        if (avaliacao.podeAvancar || proximo !== "INCORPORAR") return null;
        return (
          <p className="mt-3 rounded-lg bg-[#c17a5a]/10 px-3 py-2 text-xs text-[#e0a98a]">{avaliacao.motivo}</p>
        );
      })()}
    </div>
  );
}
