"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listarPrincipios } from "@/lib/governo-interior/db";
import type { Principio } from "@/lib/governo-interior/types";
import { LABEL_ESTAGIO } from "@/lib/governo-interior/types";
import { Cabecalho, Cartao, Chip, Carregando, EstadoVazio, LinkBotao } from "@/components/governo-interior/ui";

export default function ListaPrincipiosPage() {
  const [principios, setPrincipios] = useState<Principio[] | null>(null);

  useEffect(() => {
    listarPrincipios().then(setPrincipios);
  }, []);

  if (principios === null) return <Carregando />;

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo="Princípios" subtitulo="Do descobrir ao incorporar" voltarPara="/governo-interior" />

      <div className="mt-4">
        <LinkBotao href="/governo-interior/principios/novo">+ Novo princípio</LinkBotao>
      </div>

      <div className="mt-5 space-y-3">
        {principios.length === 0 && (
          <EstadoVazio titulo="Nenhum princípio cadastrado" descricao="Comece descobrindo o primeiro princípio que quer testar." />
        )}
        {principios.map((p) => (
          <Link key={p.id} href={`/governo-interior/principios/${p.id}`}>
            <Cartao className="border-l-4" style={{ borderLeftColor: p.cor || "#c8a24d" }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl" aria-hidden>
                    {p.icone || "🧭"}
                  </span>
                  <h3 className="text-base font-semibold text-[#f4ede0]">{p.nome}</h3>
                </div>
                <Chip tom={p.estagio === "INCORPORAR" ? "verde" : "ouro"}>{LABEL_ESTAGIO[p.estagio]}</Chip>
              </div>
              {p.fraseCentral && (
                <p className="mt-1.5 line-clamp-2 text-sm italic text-[#9aa6bd]">{`"${p.fraseCentral}"`}</p>
              )}
            </Cartao>
          </Link>
        ))}
      </div>
    </div>
  );
}
