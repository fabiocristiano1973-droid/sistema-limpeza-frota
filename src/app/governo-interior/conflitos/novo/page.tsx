"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { criarConflito, listarValores } from "@/lib/governo-interior/db";
import type { Valor } from "@/lib/governo-interior/types";
import { AreaTexto, BotaoPrimario, Cabecalho, Cartao, Carregando, EstadoVazio, LinkBotao, Rotulo, Selecao } from "@/components/governo-interior/ui";

export default function NovoConflitoPage() {
  const router = useRouter();
  const [valores, setValores] = useState<Valor[] | null>(null);
  const [valorAId, setValorAId] = useState("");
  const [valorBId, setValorBId] = useState("");
  const [oQueEstaEmJogo, setOQueEstaEmJogo] = useState("");
  const [ganhoA, setGanhoA] = useState("");
  const [percaA, setPercaA] = useState("");
  const [ganhoB, setGanhoB] = useState("");
  const [percaB, setPercaB] = useState("");
  const [principioQueDeveGovernar, setPrincipioQueDeveGovernar] = useState("");
  const [custoAceito, setCustoAceito] = useState("");
  const [decisaoFinal, setDecisaoFinal] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarValores().then(setValores);
  }, []);

  if (valores === null) return <Carregando />;

  if (valores.length < 2) {
    return (
      <div className="px-4 pb-10 pt-4">
        <Cabecalho titulo="Testar conflito" voltarPara="/governo-interior/conflitos" />
        <div className="mt-4">
          <EstadoVazio
            titulo="Você precisa de pelo menos 2 valores cadastrados"
            descricao="Cadastre os valores em conflito antes de testar."
            acao={<LinkBotao href="/governo-interior/valores/novo">Cadastrar valor</LinkBotao>}
          />
        </div>
      </div>
    );
  }

  const podeSalvar = valorAId && valorBId && valorAId !== valorBId;

  async function salvar() {
    if (!podeSalvar) return;
    setSalvando(true);
    try {
      const novo = await criarConflito({
        data: new Date().toISOString(),
        valorAId,
        valorBId,
        oQueEstaEmJogo,
        ganhoA,
        percaA,
        ganhoB,
        percaB,
        principioQueDeveGovernar,
        custoAceito,
        decisaoFinal,
      });
      router.push(`/governo-interior/conflitos/${novo.id}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo="Testar conflito" subtitulo="Dois valores, uma decisão" voltarPara="/governo-interior/conflitos" />

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Rotulo>Valor A</Rotulo>
            <Selecao value={valorAId} onChange={(e) => setValorAId(e.target.value)}>
              <option value="">Selecionar…</option>
              {valores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </Selecao>
          </div>
          <div>
            <Rotulo>Valor B</Rotulo>
            <Selecao value={valorBId} onChange={(e) => setValorBId(e.target.value)}>
              <option value="">Selecionar…</option>
              {valores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </Selecao>
          </div>
        </div>

        <div>
          <Rotulo>O que está em jogo?</Rotulo>
          <AreaTexto rows={2} value={oQueEstaEmJogo} onChange={(e) => setOQueEstaEmJogo(e.target.value)} />
        </div>

        <Cartao className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa6bd]">Escolhendo A</p>
          <div>
            <Rotulo>O que ganho escolhendo A?</Rotulo>
            <AreaTexto rows={2} value={ganhoA} onChange={(e) => setGanhoA(e.target.value)} />
          </div>
          <div>
            <Rotulo>O que perco escolhendo A?</Rotulo>
            <AreaTexto rows={2} value={percaA} onChange={(e) => setPercaA(e.target.value)} />
          </div>
        </Cartao>

        <Cartao className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa6bd]">Escolhendo B</p>
          <div>
            <Rotulo>O que ganho escolhendo B?</Rotulo>
            <AreaTexto rows={2} value={ganhoB} onChange={(e) => setGanhoB(e.target.value)} />
          </div>
          <div>
            <Rotulo>O que perco escolhendo B?</Rotulo>
            <AreaTexto rows={2} value={percaB} onChange={(e) => setPercaB(e.target.value)} />
          </div>
        </Cartao>

        <div>
          <Rotulo>Qual princípio deve governar esta decisão?</Rotulo>
          <AreaTexto rows={2} value={principioQueDeveGovernar} onChange={(e) => setPrincipioQueDeveGovernar(e.target.value)} />
        </div>

        <div>
          <Rotulo>Que custo estou disposto a aceitar para permanecer coerente?</Rotulo>
          <AreaTexto rows={2} value={custoAceito} onChange={(e) => setCustoAceito(e.target.value)} />
        </div>

        <div>
          <Rotulo>Decisão final</Rotulo>
          <AreaTexto rows={3} value={decisaoFinal} onChange={(e) => setDecisaoFinal(e.target.value)} />
        </div>
      </div>

      <div className="mt-6">
        <BotaoPrimario onClick={salvar} disabled={!podeSalvar || salvando}>
          {salvando ? "Salvando…" : "Salvar decisão"}
        </BotaoPrimario>
      </div>
    </div>
  );
}
