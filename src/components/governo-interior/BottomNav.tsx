"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/governo-interior", rotulo: "Início", icone: "🏠", exato: true },
  { href: "/governo-interior/principios", rotulo: "Princípios", icone: "🧭", exato: false },
  { href: "/governo-interior/registrar", rotulo: "Registrar", icone: "＋", exato: false, destaque: true },
  { href: "/governo-interior/evolucao", rotulo: "Evolução", icone: "📈", exato: false },
  { href: "/governo-interior/mais", rotulo: "Mais", icone: "☰", exato: false },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-20 border-t border-white/10 bg-[#0b1220]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0b1220]/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegação principal"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-1">
        {ITENS.map((item) => {
          const ativo = item.exato ? pathname === item.href : pathname.startsWith(item.href);
          if ("destaque" in item && item.destaque) {
            return (
              <li key={item.href} className="flex flex-1 items-center justify-center py-1.5">
                <Link
                  href={item.href}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#c8a24d] text-2xl font-bold text-[#0b1220] shadow-lg shadow-black/40 active:scale-95"
                  aria-label="Registrar situação"
                >
                  {item.icone}
                </Link>
              </li>
            );
          }
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  ativo ? "text-[#e8c877]" : "text-[#9aa6bd]"
                }`}
                aria-current={ativo ? "page" : undefined}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {item.icone}
                </span>
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
