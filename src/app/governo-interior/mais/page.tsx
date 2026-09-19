"use client";

import Link from "next/link";
import { Cabecalho, Cartao } from "@/components/governo-interior/ui";

const ITENS = [
  { href: "/governo-interior/valores", icone: "🌱", titulo: "Meus valores", descricao: "Candidatos até virarem prática consistente" },
  { href: "/governo-interior/codigo", icone: "📜", titulo: "Meu Código", descricao: "Princípios incorporados, organizados em 5 pilares" },
  { href: "/governo-interior/conflitos", icone: "⚖️", titulo: "Testar conflito", descricao: "Quando dois valores parecem se opor" },
  { href: "/governo-interior/revisao-semanal", icone: "🗓️", titulo: "Revisão semanal", descricao: "5 perguntas guiadas, toda semana" },
  { href: "/governo-interior/configuracoes", icone: "⚙️", titulo: "Configurações", descricao: "Lembretes, backup e exportação" },
];

export default function MaisPage() {
  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo="Mais" voltarPara="/governo-interior" />
      <div className="mt-4 space-y-2.5">
        {ITENS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Cartao className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {item.icone}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#f4ede0]">{item.titulo}</p>
                <p className="truncate text-xs text-[#9aa6bd]">{item.descricao}</p>
              </div>
            </Cartao>
          </Link>
        ))}
      </div>
    </div>
  );
}
