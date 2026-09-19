"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  criarRevisaoSemanal,
  definirPrincipioDaSemana,
  listarPrincipios,
  listarRevisoesSemanais,
  listarSituacoes,
} from "@/lib/governo-interior/db";
import { calcularEstatisticas } from "@/lib/governo-interior/maturidade";
import { formatarIntervaloSemana, inicioDaSemana } from "@/lib/governo-interior/date";
import type { Principio, RevisaoSemanal, Situacao } from "@/lib/governo-interior/types";
import {
  AreaTexto,
  BotaoPrimario,
  BotaoSecundario,
  Cabecalho,
  Cartao,
  Carregando,
  EstadoVazio,
  PontosProgresso,
  Selecao,
} from "@/components/governo-interior/ui";

const PERGUNTAS = [
  "Qual princípio vivi melhor nesta semana?",
  "Em qual situação agi contra aquilo em que acredito?",
  "Que ambiente fortaleceu meus bons comportamentos?",
  "Que ambiente favoreceu comportamentos que quero abandonar?",
  "Qual será meu único princípio prioritário na próxima semana?",
];

export default function RevisaoSemanalPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [principios, setPrincipios] = useState<Principio[]>([]);
  const [situacoes, setSituacoes] = useState<Situacao[]>([]);
  const [historico, setHistorico] = useState<RevisaoSemanal[]>([]);
  const [passo, setPasso] = useState(0);
  const [concluida, setConcluida] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [principioVividoMelhorId, setPrincipioVividoMelhorId] = useState("");
  const [situacaoContraCrencas, setSituacaoContraCrencas] = useState("");
  const [ambienteFortaleceu, setAmbienteFortaleceu] = useState("");
  const [ambienteFavoreceuNegativo, setAmbienteFavoreceuNegativo] = useState("");
  const [proximoPrincipioId, setProximoPrincipioId] = useState("");

  const semanaAtualInicio = inicioDaSemana();
  const semanaAtualIso = semanaAtualInicio.toISOString();
  const proximaSemana = new Date(semanaAtualInicio);
  proximaSemana.setDate(proximaSemana.getDate() + 7);
  const proximaSemanaIso = proximaSemana.toISOString();

  useEffect(() => {
    (async () => {
      const [p, s, h] = await Promise.all([listarPrincipios(), listarSituacoes(), listarRevisoesSemanais()]);
      setPrincipios(p);
      setSituacoes(s);
      setHistorico(h);
      setCarregando(false);
    })();
  }, []);

  if (carregando) return <Carregando />;

  const situacoesDaSemana = situacoes.filter((s) => s.data >= semanaAtualIso);
  const estatisticasSemana = calcularEstatisticas(situacoesDaSemana);

  async function salvar() {
    setSalvando(true);
    try {
      await criarRevisaoSemanal({
        semanaInicio: semanaAtualIso,
        principioVividoMelhorId: principioVividoMelhorId || null,
        situacaoContraCrencas,
        ambienteFortaleceu,
        ambienteFavoreceuNegativo,
        proximoPrincipioId: proximoPrincipioId || null,
      });
      if (proximoPrincipioId) {
        await definirPrincipioDaSemana(proximaSemanaIso, proximoPrincipioId);
      }
      setConcluida(true);
    } finally {
      setSalvando(false);
    }
  }

  if (concluida) {
    return (
      <div className="px-4 pb-10 pt-4">
        <Cabecalho titulo="Revisão semanal" voltarPara="/governo-interior" />
        <Cartao className="mt-4 border-[#7a8c5f]/40">
          <p className="text-sm font-semibold text-[#b7c79c]">Revisão salva ✓</p>
          <p className="mt-1 text-sm text-[#cdd5e3]">Resumo de {formatarIntervaloSemana(semanaAtualIso)}:</p>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold text-[#f4ede0]">{estatisticasSemana.totalSituacoes}</p>
              <p className="text-[10px] text-[#9aa6bd]">situações</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-[#b7c79c]">{estatisticasSemana.coerentes}</p>
              <p className="text-[10px] text-[#9aa6bd]">coerentes</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-[#e0a98a]">{estatisticasSemana.contradicoes}</p>
              <p className="text-[10px] text-[#9aa6bd]">contradições</p>
            </div>
          </div>
        </Cartao>
        <div className="mt-4">
          <BotaoSecundario onClick={() => router.push("/governo-interior")}>Voltar ao início</BotaoSecundario>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-4 pb-8 pt-4">
      <Cabecalho titulo="Revisão semanal" subtitulo={formatarIntervaloSemana(semanaAtualIso)} voltarPara="/governo-interior" />

      <div className="mt-4 mb-4">
        <PontosProgresso total={PERGUNTAS.length} atual={passo} />
      </div>

      <div className="flex-1">
        <h2 className="mb-3 text-lg font-semibold text-[#f4ede0]">{PERGUNTAS[passo]}</h2>

        {passo === 0 && (
          <Selecao value={principioVividoMelhorId} onChange={(e) => setPrincipioVividoMelhorId(e.target.value)}>
            <option value="">Selecionar princípio…</option>
            {principios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icone} {p.nome}
              </option>
            ))}
          </Selecao>
        )}
        {passo === 1 && (
          <AreaTexto autoFocus rows={4} value={situacaoContraCrencas} onChange={(e) => setSituacaoContraCrencas(e.target.value)} />
        )}
        {passo === 2 && (
          <AreaTexto autoFocus rows={4} value={ambienteFortaleceu} onChange={(e) => setAmbienteFortaleceu(e.target.value)} />
        )}
        {passo === 3 && (
          <AreaTexto autoFocus rows={4} value={ambienteFavoreceuNegativo} onChange={(e) => setAmbienteFavoreceuNegativo(e.target.value)} />
        )}
        {passo === 4 &&
          (principios.length === 0 ? (
            <EstadoVazio titulo="Cadastre ao menos um princípio para escolher o da próxima semana" />
          ) : (
            <Selecao value={proximoPrincipioId} onChange={(e) => setProximoPrincipioId(e.target.value)}>
              <option value="">Selecionar princípio…</option>
              {principios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icone} {p.nome}
                </option>
              ))}
            </Selecao>
          ))}
      </div>

      <div className="mt-6 flex gap-3">
        {passo > 0 && <BotaoSecundario onClick={() => setPasso((i) => i - 1)}>Voltar</BotaoSecundario>}
        {passo < PERGUNTAS.length - 1 ? (
          <BotaoPrimario onClick={() => setPasso((i) => i + 1)}>Continuar</BotaoPrimario>
        ) : (
          <BotaoPrimario onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Concluir revisão"}
          </BotaoPrimario>
        )}
      </div>

      {historico.length > 0 && (
        <section className="mt-10">
          <h3 className="mb-2 text-sm font-semibold text-[#f4ede0]">Revisões anteriores</h3>
          <ul className="space-y-2">
            {historico
              .filter((r) => r.semanaInicio !== semanaAtualIso)
              .map((r) => (
                <li key={r.id}>
                  <Cartao>
                    <span className="text-xs text-[#8892a8]">{formatarIntervaloSemana(r.semanaInicio)}</span>
                    {r.situacaoContraCrencas && <p className="mt-1 line-clamp-2 text-sm text-[#cdd5e3]">{r.situacaoContraCrencas}</p>}
                  </Cartao>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
