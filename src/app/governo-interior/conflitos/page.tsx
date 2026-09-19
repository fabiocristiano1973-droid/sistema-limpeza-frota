"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listarConflitos, listarValores } from "@/lib/governo-interior/db";
import { formatarDataBR } from "@/lib/governo-interior/date";
import type { ConflitoValores, Valor } from "@/lib/governo-interior/types";
import { Cabecalho, Cartao, Chip, Carregando, EstadoVazio, LinkBotao } from "@/components/governo-interior/ui";

export default function ListaConflitosPage() {
  const [conflitos, setConflitos] = useState<ConflitoValores[] | null>(null);
  const [valores, setValores] = useState<Valor[]>([]);

  useEffect(() => {
    Promise.all([listarConflitos(), listarValores()]).then(([c, v]) => {
      setConflitos(c);
      setValores(v);
    });
  }, []);

  if (conflitos === null) return <Carregando />;
  const nomeValor = (id: string) => valores.find((v) => v.id === id)?.nome ?? "—";

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo="Conflitos de valores" subtitulo="Decisões difíceis, pensadas com clareza" voltarPara="/governo-interior/mais" />

      <div className="mt-4">
        <LinkBotao href="/governo-interior/conflitos/novo">+ Testar conflito</LinkBotao>
      </div>

      <div className="mt-5 space-y-3">
        {conflitos.length === 0 && (
          <EstadoVazio titulo="Nenhum conflito registrado" descricao="Use isto quando dois valores parecerem puxar em direções opostas." />
        )}
        {conflitos.map((c) => {
          const ultimaRevisao = c.revisoes[c.revisoes.length - 1];
          return (
            <Link key={c.id} href={`/governo-interior/conflitos/${c.id}`}>
              <Cartao>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#f4ede0]">
                    {nomeValor(c.valorAId)} <span className="text-[#8892a8]">vs.</span> {nomeValor(c.valorBId)}
                  </h3>
                  <span className="text-xs text-[#8892a8]">{formatarDataBR(c.data)}</span>
                </div>
                {c.decisaoFinal && <p className="mt-1.5 line-clamp-2 text-sm text-[#cdd5e3]">{c.decisaoFinal}</p>}
                {ultimaRevisao && (
                  <div className="mt-2">
                    <Chip tom={ultimaRevisao.aindaConcordo ? "verde" : "terracota"}>
                      {ultimaRevisao.aindaConcordo ? "Ainda concordo" : "Revisaria diferente"}
                    </Chip>
                  </div>
                )}
              </Cartao>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
