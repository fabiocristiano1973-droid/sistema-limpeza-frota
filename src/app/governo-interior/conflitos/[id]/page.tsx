"use client";

import { use, useEffect, useState } from "react";
import { obterConflito, listarValores, salvarConflito } from "@/lib/governo-interior/db";
import { gerarId } from "@/lib/governo-interior/ids";
import { formatarDataBR, formatarDataHoraBR } from "@/lib/governo-interior/date";
import type { ConflitoValores, Valor } from "@/lib/governo-interior/types";
import {
  AreaTexto,
  BotaoPrimario,
  BotaoSecundario,
  Cabecalho,
  Cartao,
  Carregando,
  Chip,
  Rotulo,
} from "@/components/governo-interior/ui";

export default function DetalheConflitoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [conflito, setConflito] = useState<ConflitoValores | null | undefined>(undefined);
  const [valores, setValores] = useState<Valor[]>([]);
  const [mostrarRevisao, setMostrarRevisao] = useState(false);
  const [aindaConcordo, setAindaConcordo] = useState<boolean>(true);
  const [notasRevisao, setNotasRevisao] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, v] = await Promise.all([obterConflito(id), listarValores()]);
      setConflito(c ?? null);
      setValores(v);
    })();
  }, [id]);

  if (conflito === undefined) return <Carregando />;
  if (conflito === null) {
    return <div className="px-4 py-10 text-center text-sm text-[#8892a8]">Conflito não encontrado.</div>;
  }

  const nomeValor = (vid: string) => valores.find((v) => v.id === vid)?.nome ?? "—";

  async function salvarRevisao() {
    if (!conflito) return;
    setSalvando(true);
    try {
      const atualizado: ConflitoValores = {
        ...conflito,
        revisoes: [...conflito.revisoes, { id: gerarId(), data: new Date().toISOString(), aindaConcordo, notas: notasRevisao }],
      };
      await salvarConflito(atualizado);
      setConflito(atualizado);
      setMostrarRevisao(false);
      setNotasRevisao("");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho
        titulo={`${nomeValor(conflito.valorAId)} vs. ${nomeValor(conflito.valorBId)}`}
        subtitulo={formatarDataBR(conflito.data)}
        voltarPara="/governo-interior/conflitos"
      />

      <div className="mt-4 space-y-3 text-sm">
        {conflito.oQueEstaEmJogo && (
          <Cartao>
            <Rotulo>O que estava em jogo</Rotulo>
            <p className="text-[#cdd5e3]">{conflito.oQueEstaEmJogo}</p>
          </Cartao>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Cartao>
            <p className="mb-1 text-xs font-semibold uppercase text-[#9aa6bd]">{nomeValor(conflito.valorAId)}</p>
            <p className="text-xs text-[#8892a8]">Ganho</p>
            <p className="mb-2 text-[#cdd5e3]">{conflito.ganhoA || "—"}</p>
            <p className="text-xs text-[#8892a8]">Perda</p>
            <p className="text-[#cdd5e3]">{conflito.percaA || "—"}</p>
          </Cartao>
          <Cartao>
            <p className="mb-1 text-xs font-semibold uppercase text-[#9aa6bd]">{nomeValor(conflito.valorBId)}</p>
            <p className="text-xs text-[#8892a8]">Ganho</p>
            <p className="mb-2 text-[#cdd5e3]">{conflito.ganhoB || "—"}</p>
            <p className="text-xs text-[#8892a8]">Perda</p>
            <p className="text-[#cdd5e3]">{conflito.percaB || "—"}</p>
          </Cartao>
        </div>
        {conflito.principioQueDeveGovernar && (
          <Cartao>
            <Rotulo>Princípio que deve governar</Rotulo>
            <p className="text-[#cdd5e3]">{conflito.principioQueDeveGovernar}</p>
          </Cartao>
        )}
        {conflito.custoAceito && (
          <Cartao>
            <Rotulo>Custo aceito para permanecer coerente</Rotulo>
            <p className="text-[#cdd5e3]">{conflito.custoAceito}</p>
          </Cartao>
        )}
        <Cartao className="border-[#c8a24d]/30">
          <Rotulo>Decisão final</Rotulo>
          <p className="text-[#f4ede0]">{conflito.decisaoFinal || "—"}</p>
        </Cartao>
      </div>

      <section className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#f4ede0]">Revisões</h3>
          {!mostrarRevisao && (
            <button onClick={() => setMostrarRevisao(true)} className="text-xs font-semibold text-[#e8c877]">
              + Revisar agora
            </button>
          )}
        </div>

        {mostrarRevisao && (
          <Cartao className="mb-3 space-y-3">
            <p className="text-sm font-medium text-[#f4ede0]">Você ainda concorda com esta decisão?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setAindaConcordo(true)}
                className={`min-h-11 flex-1 rounded-xl border text-sm font-medium ${aindaConcordo ? "border-[#7a8c5f] bg-[#7a8c5f]/15 text-[#b7c79c]" : "border-white/15 text-[#cdd5e3]"}`}
              >
                Sim, ainda concordo
              </button>
              <button
                onClick={() => setAindaConcordo(false)}
                className={`min-h-11 flex-1 rounded-xl border text-sm font-medium ${!aindaConcordo ? "border-[#c17a5a] bg-[#c17a5a]/15 text-[#e0a98a]" : "border-white/15 text-[#cdd5e3]"}`}
              >
                Não, decidiria diferente
              </button>
            </div>
            <AreaTexto rows={2} placeholder="Notas (opcional)" value={notasRevisao} onChange={(e) => setNotasRevisao(e.target.value)} />
            <div className="flex gap-2">
              <BotaoSecundario onClick={() => setMostrarRevisao(false)}>Cancelar</BotaoSecundario>
              <BotaoPrimario onClick={salvarRevisao} disabled={salvando}>
                {salvando ? "Salvando…" : "Salvar revisão"}
              </BotaoPrimario>
            </div>
          </Cartao>
        )}

        {conflito.revisoes.length === 0 ? (
          <p className="text-xs text-[#8892a8]">Nenhuma revisão ainda.</p>
        ) : (
          <ul className="space-y-2">
            {[...conflito.revisoes].reverse().map((r) => (
              <li key={r.id}>
                <Cartao>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8892a8]">{formatarDataHoraBR(r.data)}</span>
                    <Chip tom={r.aindaConcordo ? "verde" : "terracota"}>
                      {r.aindaConcordo ? "Ainda concordo" : "Revisaria diferente"}
                    </Chip>
                  </div>
                  {r.notas && <p className="mt-1.5 text-sm text-[#cdd5e3]">{r.notas}</p>}
                </Cartao>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
