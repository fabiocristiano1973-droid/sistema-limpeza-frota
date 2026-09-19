"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listarConflitos, listarPrincipios, listarSituacoes } from "@/lib/governo-interior/db";
import { formatarDataBR } from "@/lib/governo-interior/date";
import type { ConflitoValores, Principio, Situacao } from "@/lib/governo-interior/types";
import { LABEL_CLASSIFICACAO } from "@/lib/governo-interior/types";
import { Cabecalho, Cartao, Chip, Carregando, EstadoVazio } from "@/components/governo-interior/ui";

export default function PainelEvolucaoPage() {
  const [situacoes, setSituacoes] = useState<Situacao[] | null>(null);
  const [principios, setPrincipios] = useState<Principio[]>([]);
  const [conflitos, setConflitos] = useState<ConflitoValores[]>([]);

  useEffect(() => {
    Promise.all([listarSituacoes(), listarPrincipios(), listarConflitos()]).then(([s, p, c]) => {
      setSituacoes(s);
      setPrincipios(p);
      setConflitos(c);
    });
  }, []);

  const dados = useMemo(() => {
    if (!situacoes) return null;
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();

    const evolucoes = situacoes.filter((s) => s.classificacoes.includes("EVOLUCAO")).length;
    const padroes = situacoes.filter((s) => s.classificacoes.includes("PADRAO")).length;
    const contradicoes = situacoes.filter((s) => s.classificacoes.includes("CONTRADICAO")).length;

    const decisoesDificeis = conflitos.length;
    const decisoesCoerentes = conflitos.filter((c) => {
      const ultima = c.revisoes[c.revisoes.length - 1];
      return !ultima || ultima.aindaConcordo;
    }).length;

    const situacoesDoMes = situacoes.filter((s) => s.data >= inicioMes);
    const contagemPorPrincipio = new Map<string, number>();
    for (const s of situacoesDoMes) {
      if (!s.principioId) continue;
      contagemPorPrincipio.set(s.principioId, (contagemPorPrincipio.get(s.principioId) ?? 0) + 1);
    }
    let principioMaisTestadoId: string | null = null;
    let maiorContagem = 0;
    for (const [id, qtd] of contagemPorPrincipio) {
      if (qtd > maiorContagem) {
        maiorContagem = qtd;
        principioMaisTestadoId = id;
      }
    }

    const ambientePositivo = new Map<string, number>();
    const ambienteNegativo = new Map<string, number>();
    for (const s of situacoes) {
      if (!s.ambiente) continue;
      if (s.coerente === true) ambientePositivo.set(s.ambiente, (ambientePositivo.get(s.ambiente) ?? 0) + 1);
      if (s.coerente === false) ambienteNegativo.set(s.ambiente, (ambienteNegativo.get(s.ambiente) ?? 0) + 1);
    }
    const maiorEntrada = (mapa: Map<string, number>) => {
      let melhor: [string, number] | null = null;
      for (const entrada of mapa) {
        if (!melhor || entrada[1] > melhor[1]) melhor = entrada;
      }
      return melhor;
    };

    return {
      total: situacoes.length,
      evolucoes,
      padroes,
      contradicoes,
      decisoesDificeis,
      decisoesCoerentes,
      principioMaisTestadoId,
      ambienteFavoravel: maiorEntrada(ambientePositivo),
      ambienteDesfavoravel: maiorEntrada(ambienteNegativo),
    };
  }, [situacoes, conflitos]);

  if (situacoes === null || dados === null) return <Carregando />;

  const principioMaisTestado = principios.find((p) => p.id === dados.principioMaisTestadoId);

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo="Painel de evolução" subtitulo="Evidências, não notas" voltarPara="/governo-interior" />

      {situacoes.length === 0 ? (
        <div className="mt-5">
          <EstadoVazio titulo="Ainda não há situações registradas" descricao="A evolução aparece aqui conforme você registra o que realmente aconteceu." />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Cartao>
              <p className="text-2xl font-semibold text-[#f4ede0]">{dados.total}</p>
              <p className="text-xs text-[#9aa6bd]">situações reais registradas</p>
            </Cartao>
            <Cartao>
              <p className="text-2xl font-semibold text-[#b7c79c]">{dados.evolucoes}</p>
              <p className="text-xs text-[#9aa6bd]">evidências de evolução</p>
            </Cartao>
            <Cartao>
              <p className="text-2xl font-semibold text-[#e8c877]">{dados.padroes}</p>
              <p className="text-xs text-[#9aa6bd]">padrões identificados</p>
            </Cartao>
            <Cartao>
              <p className="text-2xl font-semibold text-[#e0a98a]">{dados.contradicoes}</p>
              <p className="text-xs text-[#9aa6bd]">contradições que exigiram correção</p>
            </Cartao>
            <Cartao className="col-span-2">
              <p className="text-2xl font-semibold text-[#f4ede0]">
                {dados.decisoesCoerentes}
                <span className="text-base text-[#9aa6bd]"> / {dados.decisoesDificeis}</span>
              </p>
              <p className="text-xs text-[#9aa6bd]">decisões difíceis com as quais você ainda concorda</p>
            </Cartao>
          </div>

          <div className="mt-4 space-y-3">
            {principioMaisTestado && (
              <Cartao>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa6bd]">Princípio mais testado neste mês</p>
                <p className="mt-1 text-sm font-medium text-[#f4ede0]">
                  {principioMaisTestado.icone} {principioMaisTestado.nome}
                </p>
              </Cartao>
            )}
            {dados.ambienteFavoravel && (
              <Cartao className="border-[#7a8c5f]/30">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa6bd]">
                  Ambiente que mais favoreceu bons comportamentos
                </p>
                <p className="mt-1 text-sm font-medium text-[#b7c79c]">
                  {dados.ambienteFavoravel[0]} ({dados.ambienteFavoravel[1]} situações coerentes)
                </p>
              </Cartao>
            )}
            {dados.ambienteDesfavoravel && (
              <Cartao className="border-[#c17a5a]/30">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa6bd]">
                  Ambiente associado ao maior número de contradições
                </p>
                <p className="mt-1 text-sm font-medium text-[#e0a98a]">
                  {dados.ambienteDesfavoravel[0]} ({dados.ambienteDesfavoravel[1]} contradições)
                </p>
              </Cartao>
            )}
          </div>

          <section className="mt-8">
            <h3 className="mb-2 text-sm font-semibold text-[#f4ede0]">Linha do tempo</h3>
            <ul className="space-y-2 border-l border-white/10 pl-3">
              {situacoes.map((s) => (
                <li key={s.id} className="relative">
                  <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-[#c8a24d]" />
                  <Link href={`/governo-interior/registrar/${s.id}`}>
                    <Cartao>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-[#8892a8]">{formatarDataBR(s.data)}</span>
                        <div className="flex flex-wrap justify-end gap-1">
                          {s.classificacoes.map((c) => (
                            <Chip key={c} tom={c === "CONTRADICAO" ? "terracota" : c === "EVOLUCAO" ? "verde" : "ouro"}>
                              {LABEL_CLASSIFICACAO[c]}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-[#cdd5e3]">{s.fato}</p>
                    </Cartao>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
