"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listarValores } from "@/lib/governo-interior/db";
import type { Valor } from "@/lib/governo-interior/types";
import { Cabecalho, Cartao, Chip, Carregando, EstadoVazio, LinkBotao } from "@/components/governo-interior/ui";

export default function ListaValoresPage() {
  const [valores, setValores] = useState<Valor[] | null>(null);

  useEffect(() => {
    listarValores().then(setValores);
  }, []);

  if (valores === null) return <Carregando />;

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo="Meus valores" subtitulo="Ainda em validação até virarem prática consistente" voltarPara="/governo-interior/mais" />

      <div className="mt-4">
        <LinkBotao href="/governo-interior/valores/novo">+ Novo valor</LinkBotao>
      </div>

      <div className="mt-5 space-y-3">
        {valores.length === 0 && <EstadoVazio titulo="Nenhum valor cadastrado" />}
        {valores.map((v) => (
          <Link key={v.id} href={`/governo-interior/valores/${v.id}`}>
            <Cartao>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[#f4ede0]">{v.nome}</h3>
                <Chip tom={v.status === "CONSOLIDADO" ? "verde" : "ouro"}>
                  {v.status === "CONSOLIDADO" ? "Consolidado" : "Em validação"}
                </Chip>
              </div>
              {v.objetivo && <p className="mt-1.5 line-clamp-2 text-sm text-[#9aa6bd]">{v.objetivo}</p>}
            </Cartao>
          </Link>
        ))}
      </div>
    </div>
  );
}
