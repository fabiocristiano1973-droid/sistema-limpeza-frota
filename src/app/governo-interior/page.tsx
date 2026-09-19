"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  definirPrincipioDaSemana,
  listarPrincipios,
  listarSituacoes,
  obterConfiguracaoLembretes,
  obterSelecaoSemanal,
} from "@/lib/governo-interior/db";
import { formatarDataBR, inicioDaSemana, nomeDiaSemana } from "@/lib/governo-interior/date";
import { PERGUNTA_CENTRAL } from "@/lib/governo-interior/tema";
import type { ConfiguracaoLembretes, Principio, Situacao } from "@/lib/governo-interior/types";
import { LABEL_CLASSIFICACAO } from "@/lib/governo-interior/types";
import { Cartao, Chip, Carregando, EstadoVazio, LinkBotao, Selecao } from "@/components/governo-interior/ui";

function proximaRevisaoSemanal(config: ConfiguracaoLembretes): Date {
  const [h, m] = config.semanalHorario.split(":").map(Number);
  const alvo = new Date();
  alvo.setHours(h ?? 19, m ?? 0, 0, 0);
  while (alvo.getDay() !== config.semanalDiaSemana || alvo <= new Date()) {
    alvo.setDate(alvo.getDate() + 1);
  }
  return alvo;
}

export default function GovernoInteriorHome() {
  const [carregando, setCarregando] = useState(true);
  const [principios, setPrincipios] = useState<Principio[]>([]);
  const [principioSemanaId, setPrincipioSemanaId] = useState<string | null>(null);
  const [situacoes, setSituacoes] = useState<Situacao[]>([]);
  const [config, setConfig] = useState<ConfiguracaoLembretes | null>(null);

  const semanaInicioIso = inicioDaSemana().toISOString();

  useEffect(() => {
    (async () => {
      const [listaPrincipios, selecao, listaSituacoes, configuracao] = await Promise.all([
        listarPrincipios(),
        obterSelecaoSemanal(semanaInicioIso),
        listarSituacoes(),
        obterConfiguracaoLembretes(),
      ]);
      setPrincipios(listaPrincipios);
      setPrincipioSemanaId(selecao?.principioId ?? null);
      setSituacoes(listaSituacoes);
      setConfig(configuracao);
      setCarregando(false);
    })();
  }, [semanaInicioIso]);

  async function escolherPrincipioDaSemana(id: string) {
    if (!id) return;
    await definirPrincipioDaSemana(semanaInicioIso, id);
    setPrincipioSemanaId(id);
  }

  if (carregando) return <Carregando />;

  const principioSemana = principios.find((p) => p.id === principioSemanaId) ?? null;
  const recentes = situacoes.slice(0, 3);
  const contradicoes = situacoes.filter((s) => s.classificacoes.includes("CONTRADICAO")).slice(0, 3);
  const evolucoes = situacoes.filter((s) => s.classificacoes.includes("EVOLUCAO")).slice(0, 3);
  const proximaRevisao = config ? proximaRevisaoSemanal(config) : null;

  return (
    <div className="px-4 pb-8 pt-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#9aa6bd]">Governo Interior</p>

      <Cartao className="mt-3 border-[#c8a24d]/30 bg-gradient-to-br from-[#1a2438] to-[#121b2c]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#e8c877]">Princípio da semana</p>
        {principioSemana ? (
          <>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl" aria-hidden>
                {principioSemana.icone || "🧭"}
              </span>
              <h2 className="text-xl font-semibold text-[#f4ede0]">{principioSemana.nome}</h2>
            </div>
            {principioSemana.fraseCentral && (
              <p className="mt-1.5 text-sm italic text-[#cdd5e3]">{`"${principioSemana.fraseCentral}"`}</p>
            )}
            <Link
              href={`/governo-interior/principios/${principioSemana.id}`}
              className="mt-3 inline-block text-xs font-semibold text-[#e8c877]"
            >
              Ver estrutura completa →
            </Link>
          </>
        ) : principios.length > 0 ? (
          <div className="mt-2">
            <p className="mb-2 text-sm text-[#cdd5e3]">Escolha o princípio prioritário desta semana:</p>
            <Selecao defaultValue="" onChange={(e) => escolherPrincipioDaSemana(e.target.value)}>
              <option value="" disabled>
                Selecionar princípio…
              </option>
              {principios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Selecao>
          </div>
        ) : (
          <div className="mt-2">
            <p className="mb-2 text-sm text-[#cdd5e3]">
              Você ainda não tem princípios cadastrados. Comece descobrindo o primeiro.
            </p>
            <LinkBotao href="/governo-interior/principios/novo">Criar primeiro princípio</LinkBotao>
          </div>
        )}
      </Cartao>

      <p className="mt-4 px-1 text-center text-sm font-medium italic text-[#cdd5e3]">{`"${PERGUNTA_CENTRAL}"`}</p>

      {principioSemana?.acaoPratica && (
        <Cartao className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa6bd]">Ação de hoje</p>
          <p className="mt-1.5 text-[15px] text-[#f4ede0]">{principioSemana.acaoPratica}</p>
        </Cartao>
      )}

      <div className="mt-5">
        <LinkBotao href="/governo-interior/registrar" className="min-h-14 text-base">
          + Registrar situação
        </LinkBotao>
      </div>

      <section className="mt-7">
        <h3 className="mb-2 text-sm font-semibold text-[#f4ede0]">Evidências recentes</h3>
        {recentes.length === 0 ? (
          <EstadoVazio titulo="Nenhuma situação registrada ainda" descricao="Toque em “Registrar situação” para começar." />
        ) : (
          <ul className="space-y-2">
            {recentes.map((s) => (
              <li key={s.id}>
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
                    <p className="mt-1.5 line-clamp-2 text-sm text-[#cdd5e3]">{s.fato}</p>
                  </Cartao>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {contradicoes.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-[#f4ede0]">Contradições para revisar</h3>
          <ul className="space-y-2">
            {contradicoes.map((s) => (
              <li key={s.id}>
                <Link href={`/governo-interior/registrar/${s.id}`}>
                  <Cartao className="border-[#c17a5a]/30">
                    <span className="text-xs text-[#8892a8]">{formatarDataBR(s.data)}</span>
                    <p className="mt-1 line-clamp-2 text-sm text-[#cdd5e3]">{s.fato}</p>
                  </Cartao>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {evolucoes.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-[#f4ede0]">Evoluções percebidas</h3>
          <ul className="space-y-2">
            {evolucoes.map((s) => (
              <li key={s.id}>
                <Link href={`/governo-interior/registrar/${s.id}`}>
                  <Cartao className="border-[#7a8c5f]/30">
                    <span className="text-xs text-[#8892a8]">{formatarDataBR(s.data)}</span>
                    <p className="mt-1 line-clamp-2 text-sm text-[#cdd5e3]">{s.fato}</p>
                  </Cartao>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {proximaRevisao && (
        <Cartao className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa6bd]">Próxima revisão semanal</p>
          <p className="mt-1 text-sm text-[#f4ede0]">
            {nomeDiaSemana(proximaRevisao.getDay())}, {formatarDataBR(proximaRevisao)}
          </p>
          <Link href="/governo-interior/revisao-semanal" className="mt-2 inline-block text-xs font-semibold text-[#e8c877]">
            Iniciar revisão agora →
          </Link>
        </Cartao>
      )}
    </div>
  );
}
