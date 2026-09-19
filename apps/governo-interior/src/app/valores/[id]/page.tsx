"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { excluirValor, listarSituacoesPorValor, obterValor, salvarValor } from "@/lib/db";
import { formatarDataBR } from "@/lib/date";
import type { Situacao, Valor } from "@/lib/types";
import {
  AreaTexto,
  BotaoPrimario,
  BotaoSecundario,
  Cabecalho,
  Campo,
  Cartao,
  Carregando,
  EstadoVazio,
  ListaEditavel,
  Rotulo,
} from "@/components/ui";

export default function DetalheValorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [valor, setValor] = useState<Valor | null | undefined>(undefined);
  const [evidencias, setEvidencias] = useState<Situacao[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const [v, ev] = await Promise.all([obterValor(id), listarSituacoesPorValor(id)]);
      setValor(v ?? null);
      setEvidencias(ev);
    })();
  }, [id]);

  if (valor === undefined) return <Carregando />;
  if (valor === null) {
    return (
      <div className="px-4 py-10 text-center text-sm text-[#8892a8]">
        Valor não encontrado.
      </div>
    );
  }

  function atualizar<K extends keyof Valor>(chave: K, novoValor: Valor[K]) {
    setValor((v) => (v ? { ...v, [chave]: novoValor } : v));
  }

  async function salvar() {
    if (!valor) return;
    setSalvando(true);
    try {
      await salvarValor(valor);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!valor) return;
    if (!confirm(`Excluir o valor "${valor.nome}"? As situações registradas continuam existindo, só perdem essa referência.`)) return;
    await excluirValor(valor.id);
    router.push("/valores");
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo={valor.nome} voltarPara="/valores" />

      <div className="mt-4 space-y-4">
        <div>
          <Rotulo>Status</Rotulo>
          <div className="flex gap-2">
            <button
              onClick={() => atualizar("status", "EM_VALIDACAO")}
              className={`min-h-11 flex-1 rounded-xl border text-sm font-medium ${valor.status === "EM_VALIDACAO" ? "border-[#c8a24d] bg-[#c8a24d]/15 text-[#e8c877]" : "border-white/15 text-[#cdd5e3]"}`}
            >
              Em validação
            </button>
            <button
              onClick={() => atualizar("status", "CONSOLIDADO")}
              className={`min-h-11 flex-1 rounded-xl border text-sm font-medium ${valor.status === "CONSOLIDADO" ? "border-[#7a8c5f] bg-[#7a8c5f]/15 text-[#b7c79c]" : "border-white/15 text-[#cdd5e3]"}`}
            >
              Consolidado
            </button>
          </div>
        </div>

        <div>
          <Rotulo>Valor</Rotulo>
          <Campo value={valor.nome} onChange={(e) => atualizar("nome", e.target.value)} />
        </div>
        <div>
          <Rotulo>Objetivo</Rotulo>
          <AreaTexto rows={2} value={valor.objetivo} onChange={(e) => atualizar("objetivo", e.target.value)} />
        </div>
        <div>
          <Rotulo>Comportamentos que demonstram este valor</Rotulo>
          <ListaEditavel itens={valor.comportamentosQueDemonstram} onChange={(itens) => atualizar("comportamentosQueDemonstram", itens)} />
        </div>
        <div>
          <Rotulo>Comportamentos que contradizem este valor</Rotulo>
          <ListaEditavel itens={valor.comportamentosQueContradizem} onChange={(itens) => atualizar("comportamentosQueContradizem", itens)} />
        </div>
        <div>
          <Rotulo>Conflitos com outros valores</Rotulo>
          <AreaTexto rows={2} value={valor.conflitosComOutrosValores} onChange={(e) => atualizar("conflitosComOutrosValores", e.target.value)} />
        </div>
        <div>
          <Rotulo>Aprendizados</Rotulo>
          <AreaTexto rows={2} value={valor.aprendizados} onChange={(e) => atualizar("aprendizados", e.target.value)} />
        </div>
      </div>

      <div className="mt-6">
        <BotaoPrimario onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar alterações"}
        </BotaoPrimario>
      </div>

      <section className="mt-8">
        <h3 className="mb-2 text-sm font-semibold text-[#f4ede0]">Evidências reais ({evidencias.length})</h3>
        {evidencias.length === 0 ? (
          <EstadoVazio titulo="Nenhuma situação real ligada a este valor ainda" />
        ) : (
          <ul className="space-y-2">
            {evidencias.map((s) => (
              <li key={s.id}>
                <Link href={`/registrar/${s.id}`}>
                  <Cartao>
                    <span className="text-xs text-[#8892a8]">{formatarDataBR(s.data)}</span>
                    <p className="mt-1 line-clamp-2 text-sm text-[#cdd5e3]">{s.fato}</p>
                  </Cartao>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8">
        <BotaoSecundario onClick={excluir} className="border-[#c17a5a]/40 text-[#e0a98a]">
          Excluir valor
        </BotaoSecundario>
      </div>
    </div>
  );
}
