import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  equipesRepo,
  garagensRepo,
  inspetoresRepo,
  itensChecklistRepo,
  tiposLimpezaRepo,
  veiculosRepo,
} from "@/lib/repository/cadastros";
import { usuariosRepo } from "@/lib/repository/usuarios";

export const dynamic = "force-dynamic";

export default async function CadastrosPage() {
  const [veiculos, garagens, tiposLimpeza, inspetores, equipes, itensChecklist, usuarios] = await Promise.all([
    veiculosRepo.list(),
    garagensRepo.list(),
    tiposLimpezaRepo.list(),
    inspetoresRepo.list(),
    equipesRepo.list(),
    itensChecklistRepo.list(),
    usuariosRepo.list(),
  ]);

  const modulos = [
    {
      href: "/cadastros/veiculos",
      emoji: "🚌",
      titulo: "Frota",
      descricao: "Veículos, prefixo, placa e unidade",
      total: veiculos.length,
      ativos: veiculos.filter((v) => v.status === "ATIVO").length,
    },
    {
      href: "/cadastros/garagens",
      emoji: "🏢",
      titulo: "Garagens / Unidades",
      descricao: "Unidades operacionais da frota",
      total: garagens.length,
      ativos: garagens.filter((g) => g.status === "ATIVO").length,
    },
    {
      href: "/cadastros/tipos-limpeza",
      emoji: "🧽",
      titulo: "Tipos de Limpeza",
      descricao: "Categorias usadas na inspeção",
      total: tiposLimpeza.length,
      ativos: tiposLimpeza.filter((t) => t.status === "ATIVO").length,
    },
    {
      href: "/cadastros/inspetores",
      emoji: "🧑‍🔧",
      titulo: "Inspetores / Encarregados",
      descricao: "Pessoas autorizadas a inspecionar",
      total: inspetores.length,
      ativos: inspetores.filter((i) => i.status === "ATIVO").length,
    },
    {
      href: "/cadastros/equipes",
      emoji: "🧹",
      titulo: "Equipes de Limpeza",
      descricao: "Equipes responsáveis pela limpeza",
      total: equipes.length,
      ativos: equipes.filter((e) => e.status === "ATIVO").length,
    },
    {
      href: "/cadastros/itens-checklist",
      emoji: "📋",
      titulo: "Itens do Checklist",
      descricao: "Itens, categorias, ordem e aplicação por veículo",
      total: itensChecklist.length,
      ativos: itensChecklist.filter((i) => i.status === "ATIVO").length,
    },
    {
      href: "/cadastros/usuarios",
      emoji: "👤",
      titulo: "Usuários",
      descricao: "Login, perfis e acesso ao sistema",
      total: usuarios.length,
      ativos: usuarios.filter((u) => u.status === "ATIVO").length,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo="Cadastros" subtitulo="Dados usados nas inspeções" voltarPara="/" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-3xl">
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
          {modulos.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 active:scale-[0.99] transition"
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="flex-1">
                <span className="block text-base font-semibold text-slate-900">{m.titulo}</span>
                <span className="block text-xs text-slate-500">{m.descricao}</span>
              </span>
              <span className="flex flex-col items-end">
                <span className="text-lg font-bold text-slate-900">{m.ativos}</span>
                <span className="text-[10px] text-slate-400">de {m.total} ativos</span>
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
