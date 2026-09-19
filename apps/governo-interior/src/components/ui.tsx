"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function Cartao({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#121b2c] p-4 shadow-sm shadow-black/20 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function Cabecalho({
  titulo,
  subtitulo,
  voltarPara,
}: {
  titulo: string;
  subtitulo?: string;
  voltarPara?: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b1220]/95 px-4 pb-3 pt-5 backdrop-blur">
      <div className="flex items-center gap-2">
        {voltarPara && (
          <Link
            href={voltarPara}
            className="-ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-[#9aa6bd] active:bg-white/10"
            aria-label="Voltar"
          >
            ←
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-[#f4ede0]">{titulo}</h1>
          {subtitulo && <p className="truncate text-xs text-[#9aa6bd]">{subtitulo}</p>}
        </div>
      </div>
    </header>
  );
}

export function BotaoPrimario({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`flex min-h-12 w-full items-center justify-center rounded-xl bg-[#c8a24d] px-4 text-sm font-semibold text-[#0b1220] active:scale-[0.98] disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BotaoSecundario({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`flex min-h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-transparent px-4 text-sm font-medium text-[#f4ede0] active:bg-white/5 disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkBotao({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-12 w-full items-center justify-center rounded-xl bg-[#c8a24d] px-4 text-center text-sm font-semibold text-[#0b1220] active:scale-[0.98] ${className}`}
    >
      {children}
    </Link>
  );
}

export function Chip({
  children,
  tom = "neutro",
}: {
  children: ReactNode;
  tom?: "neutro" | "ouro" | "verde" | "terracota" | "azul";
}) {
  const tons: Record<string, string> = {
    neutro: "bg-white/10 text-[#cdd5e3]",
    ouro: "bg-[#c8a24d]/20 text-[#e8c877]",
    verde: "bg-[#7a8c5f]/25 text-[#b7c79c]",
    terracota: "bg-[#c17a5a]/25 text-[#e0a98a]",
    azul: "bg-[#4f7c8c]/25 text-[#9cc6d4]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${tons[tom]}`}>
      {children}
    </span>
  );
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-[#cdd5e3]">{children}</label>;
}

export function Campo(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-12 w-full rounded-xl border border-white/15 bg-[#0f1826] px-3.5 text-[15px] text-[#f4ede0] placeholder:text-[#6b7690] focus:border-[#c8a24d] focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export function AreaTexto(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-white/15 bg-[#0f1826] px-3.5 py-3 text-[15px] text-[#f4ede0] placeholder:text-[#6b7690] focus:border-[#c8a24d] focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export function Selecao({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className={`min-h-12 w-full rounded-xl border border-white/15 bg-[#0f1826] px-3.5 text-[15px] text-[#f4ede0] focus:border-[#c8a24d] focus:outline-none ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

export function EstadoVazio({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center">
      <p className="text-sm font-medium text-[#cdd5e3]">{titulo}</p>
      {descricao && <p className="text-xs text-[#8892a8]">{descricao}</p>}
      {acao}
    </div>
  );
}

export function Carregando() {
  return <div className="px-4 py-10 text-center text-sm text-[#8892a8]">Carregando…</div>;
}

export function ListaEditavel({
  itens,
  onChange,
  placeholder,
}: {
  itens: string[];
  onChange: (itens: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {itens.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-3 pr-1.5 text-xs text-[#cdd5e3]">
            {item}
            <button
              type="button"
              onClick={() => onChange(itens.filter((_, idx) => idx !== i))}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[#9aa6bd] active:bg-white/10"
              aria-label={`Remover ${item}`}
            >
              ×
            </button>
          </span>
        ))}
        {itens.length === 0 && <span className="text-xs text-[#6b7690]">Nenhum item adicionado.</span>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const input = form.elements.namedItem("novoItem") as HTMLInputElement;
          const valor = input.value.trim();
          if (valor) {
            onChange([...itens, valor]);
            input.value = "";
          }
        }}
        className="flex gap-2"
      >
        <input
          name="novoItem"
          placeholder={placeholder ?? "Adicionar…"}
          className="min-h-11 flex-1 rounded-xl border border-white/15 bg-[#0f1826] px-3.5 text-sm text-[#f4ede0] placeholder:text-[#6b7690] focus:border-[#c8a24d] focus:outline-none"
        />
        <button type="submit" className="min-h-11 rounded-xl bg-white/10 px-4 text-sm font-medium text-[#f4ede0] active:bg-white/20">
          + Adicionar
        </button>
      </form>
    </div>
  );
}

export function PontosProgresso({ total, atual }: { total: number; atual: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" role="progressbar" aria-valuenow={atual + 1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === atual ? "w-6 bg-[#c8a24d]" : i < atual ? "w-1.5 bg-[#c8a24d]/50" : "w-1.5 bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}
