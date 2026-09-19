"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  excluirPrincipio,
  listarSituacoesPorPrincipio,
  listarValores,
  obterPrincipio,
  salvarPrincipio,
} from "@/lib/governo-interior/db";
import { calcularEstatisticas } from "@/lib/governo-interior/maturidade";
import { formatarDataBR } from "@/lib/governo-interior/date";
import { PALETA_PRINCIPIOS } from "@/lib/governo-interior/tema";
import { PILARES_CODIGO, type EstagioMaturidade, type PilarCodigo, type Principio, type Situacao, type Valor } from "@/lib/governo-interior/types";
import CicloMaturidade from "@/components/governo-interior/CicloMaturidade";
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
  Selecao,
} from "@/components/governo-interior/ui";

export default function DetalhePrincipioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [principio, setPrincipio] = useState<Principio | null | undefined>(undefined);
  const [situacoes, setSituacoes] = useState<Situacao[]>([]);
  const [valores, setValores] = useState<Valor[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, s, v] = await Promise.all([obterPrincipio(id), listarSituacoesPorPrincipio(id), listarValores()]);
      setPrincipio(p ?? null);
      setSituacoes(s);
      setValores(v);
    })();
  }, [id]);

  if (principio === undefined) return <Carregando />;
  if (principio === null) {
    return <div className="px-4 py-10 text-center text-sm text-[#8892a8]">Princípio não encontrado.</div>;
  }

  const estatisticas = calcularEstatisticas(situacoes);

  function atualizar<K extends keyof Principio>(chave: K, valor: Principio[K]) {
    setPrincipio((p) => (p ? { ...p, [chave]: valor } : p));
  }

  async function mudarEstagio(novoEstagio: EstagioMaturidade) {
    if (!principio) return;
    const atualizado: Principio = {
      ...principio,
      estagio: novoEstagio,
      incorporadoEm: novoEstagio === "INCORPORAR" ? new Date().toISOString() : principio.incorporadoEm,
    };
    setPrincipio(atualizado);
    await salvarPrincipio(atualizado);
  }

  async function salvar() {
    if (!principio) return;
    setSalvando(true);
    try {
      await salvarPrincipio(principio);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!principio) return;
    if (!confirm(`Excluir o princípio "${principio.nome}"?`)) return;
    await excluirPrincipio(principio.id);
    router.push("/governo-interior/principios");
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo={principio.nome} voltarPara="/governo-interior/principios" />

      <Cartao className="mt-4 border-l-4" style={{ borderLeftColor: principio.cor || "#c8a24d" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa6bd]">Ciclo de maturidade</p>
        <div className="mt-3">
          <CicloMaturidade estagioAtual={principio.estagio} estatisticas={estatisticas} onMudar={mudarEstagio} />
        </div>
      </Cartao>

      <Cartao className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa6bd]">Evidências</p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-lg font-semibold text-[#f4ede0]">{estatisticas.totalSituacoes}</p>
            <p className="text-xs text-[#9aa6bd]">situações testaram</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#b7c79c]">{estatisticas.coerentes}</p>
            <p className="text-xs text-[#9aa6bd]">coerentes</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#e0a98a]">{estatisticas.contradicoes}</p>
            <p className="text-xs text-[#9aa6bd]">contradições</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#e8c877]">{estatisticas.padroes}</p>
            <p className="text-xs text-[#9aa6bd]">padrões repetidos</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-[#8892a8]">
          Última situação testada: {estatisticas.ultimaSituacaoData ? formatarDataBR(estatisticas.ultimaSituacaoData) : "nenhuma ainda"}
        </p>
      </Cartao>

      <div className="mt-4 space-y-4">
        <div>
          <Rotulo>Princípio</Rotulo>
          <Campo value={principio.nome} onChange={(e) => atualizar("nome", e.target.value)} />
        </div>
        <div>
          <Rotulo>Frase central</Rotulo>
          <Campo value={principio.fraseCentral} onChange={(e) => atualizar("fraseCentral", e.target.value)} />
        </div>
        <div>
          <Rotulo>Cor de identificação</Rotulo>
          <div className="flex flex-wrap gap-2">
            {PALETA_PRINCIPIOS.map((p) => (
              <button
                key={p.valor}
                onClick={() => atualizar("cor", p.valor)}
                title={p.nome}
                className={`h-9 w-9 rounded-full border-2 ${principio.cor === p.valor ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: p.valor }}
              />
            ))}
          </div>
        </div>
        <div>
          <Rotulo>Pilar do código pessoal</Rotulo>
          <Selecao value={principio.pilar} onChange={(e) => atualizar("pilar", e.target.value as PilarCodigo)}>
            {PILARES_CODIGO.map((p) => (
              <option key={p.chave} value={p.chave}>
                {p.titulo}
              </option>
            ))}
          </Selecao>
        </div>
        <div>
          <Rotulo>Valor que sustenta</Rotulo>
          <Selecao value={principio.valorSustentaId ?? ""} onChange={(e) => atualizar("valorSustentaId", e.target.value || null)}>
            <option value="">Nenhum / não se aplica</option>
            {valores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </Selecao>
        </div>
        <div>
          <Rotulo>O que significa para mim</Rotulo>
          <AreaTexto rows={2} value={principio.significado} onChange={(e) => atualizar("significado", e.target.value)} />
        </div>
        <div>
          <Rotulo>Comportamentos que fortalecem</Rotulo>
          <ListaEditavel itens={principio.comportamentosQueFortalecem} onChange={(itens) => atualizar("comportamentosQueFortalecem", itens)} />
        </div>
        <div>
          <Rotulo>Comportamentos que violam</Rotulo>
          <ListaEditavel itens={principio.comportamentosQueViolam} onChange={(itens) => atualizar("comportamentosQueViolam", itens)} />
        </div>
        <div>
          <Rotulo>Ambiente que preciso construir</Rotulo>
          <AreaTexto rows={2} value={principio.ambienteQuePrecisoConstruir} onChange={(e) => atualizar("ambienteQuePrecisoConstruir", e.target.value)} />
        </div>
        <div>
          <Rotulo>Limites</Rotulo>
          <AreaTexto rows={2} value={principio.limites} onChange={(e) => atualizar("limites", e.target.value)} />
        </div>
        <div>
          <Rotulo>Regra de decisão</Rotulo>
          <AreaTexto rows={2} value={principio.regraDecisao} onChange={(e) => atualizar("regraDecisao", e.target.value)} />
        </div>
        <div>
          <Rotulo>Ação prática</Rotulo>
          <AreaTexto rows={2} value={principio.acaoPratica} onChange={(e) => atualizar("acaoPratica", e.target.value)} />
        </div>
      </div>

      <div className="mt-6">
        <BotaoPrimario onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar alterações"}
        </BotaoPrimario>
      </div>

      <section className="mt-8">
        <h3 className="mb-2 text-sm font-semibold text-[#f4ede0]">Linha do tempo de situações</h3>
        {situacoes.length === 0 ? (
          <EstadoVazio titulo="Nenhuma situação testou este princípio ainda" />
        ) : (
          <ul className="space-y-2 border-l border-white/10 pl-3">
            {situacoes.map((s) => (
              <li key={s.id} className="relative">
                <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-[#c8a24d]" />
                <Link href={`/governo-interior/registrar/${s.id}`}>
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
          Excluir princípio
        </BotaoSecundario>
      </div>
    </div>
  );
}
