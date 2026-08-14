import Link from "next/link";
import { ReactNode } from "react";

export default function PageHeader({
  titulo,
  subtitulo,
  voltarPara,
  acao,
  largo = false,
}: {
  titulo: string;
  subtitulo?: string;
  voltarPara: string;
  acao?: ReactNode;
  largo?: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 bg-white px-4 pb-3 pt-4 shadow-sm">
      <div className={`mx-auto flex w-full items-center gap-3 ${largo ? "max-w-4xl" : "max-w-md"}`}>
        <Link
          href={voltarPara}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-slate-900">{titulo}</h1>
          {subtitulo && <p className="truncate text-xs text-slate-500">{subtitulo}</p>}
        </div>
        {acao}
      </div>
    </header>
  );
}
