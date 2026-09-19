"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listarPrincipios } from "@/lib/db";
import { FRASE_CENTRAL } from "@/lib/tema";
import { PILARES_CODIGO, type Principio } from "@/lib/types";
import { Cabecalho, Cartao, Carregando, EstadoVazio } from "@/components/ui";

export default function MeuCodigoPage() {
  const [principios, setPrincipios] = useState<Principio[] | null>(null);

  useEffect(() => {
    listarPrincipios().then(setPrincipios);
  }, []);

  if (principios === null) return <Carregando />;

  const incorporados = principios.filter((p) => p.estagio === "INCORPORAR");

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo="Meu Código" subtitulo="Princípios incorporados com evidência real" voltarPara="/mais" />

      {incorporados.length === 0 ? (
        <div className="mt-5">
          <EstadoVazio
            titulo="Nenhum princípio incorporado ainda"
            descricao="Um princípio só entra aqui depois de passar por evidências reais suficientes no ciclo de maturidade — não basta declarar, é preciso viver."
          />
        </div>
      ) : (
        <p className="mt-4 text-center text-xs italic text-[#8892a8]">{`"${FRASE_CENTRAL}"`}</p>
      )}

      <div className="mt-5 space-y-6">
        {PILARES_CODIGO.map((pilar) => {
          const doPilar = incorporados.filter((p) => p.pilar === pilar.chave);
          if (doPilar.length === 0) return null;
          return (
            <section key={pilar.chave}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#e8c877]">{pilar.titulo}</h2>
              <div className="space-y-3">
                {doPilar.map((p) => (
                  <Link key={p.id} href={`/principios/${p.id}`}>
                    <Cartao className="border-l-4" style={{ borderLeftColor: p.cor || "#c8a24d" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden>
                          {p.icone}
                        </span>
                        <h3 className="text-base font-semibold text-[#f4ede0]">{p.nome}</h3>
                      </div>
                      {p.fraseCentral && (
                        <p className="mt-1 text-sm italic text-[#9aa6bd]">{`"${p.fraseCentral}"`}</p>
                      )}
                      {p.regraDecisao && (
                        <p className="mt-2 text-xs text-[#8892a8]">
                          <span className="font-semibold text-[#cdd5e3]">Regra de decisão: </span>
                          {p.regraDecisao}
                        </p>
                      )}
                    </Cartao>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
