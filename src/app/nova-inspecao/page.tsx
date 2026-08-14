import Link from "next/link";
import NovaInspecaoWizard from "@/components/nova-inspecao/NovaInspecaoWizard";
import {
  equipesRepo,
  garagensRepo,
  inspetoresRepo,
  itensChecklistRepo,
  tiposLimpezaRepo,
  veiculosRepo,
} from "@/lib/repository/cadastros";

export const dynamic = "force-dynamic";

export default async function NovaInspecaoPage() {
  const [veiculos, garagens, tiposLimpeza, inspetores, equipes, itensChecklist] = await Promise.all([
    veiculosRepo.list(),
    garagensRepo.list(),
    tiposLimpezaRepo.list(),
    inspetoresRepo.list(),
    equipesRepo.list(),
    itensChecklistRepo.list(),
  ]);

  const veiculosAtivos = veiculos.filter((v) => v.status === "ATIVO");
  const garagensAtivas = garagens.filter((g) => g.status === "ATIVO");
  const tiposAtivos = tiposLimpeza.filter((t) => t.status === "ATIVO");
  const inspetoresAtivos = inspetores.filter((i) => i.status === "ATIVO");
  const equipesAtivas = equipes.filter((e) => e.status === "ATIVO");
  const itensChecklistAtivos = itensChecklist.filter((i) => i.status === "ATIVO");

  const cadastroFaltando =
    veiculosAtivos.length === 0 ||
    garagensAtivas.length === 0 ||
    tiposAtivos.length === 0 ||
    inspetoresAtivos.length === 0 ||
    equipesAtivas.length === 0 ||
    itensChecklistAtivos.length === 0;

  if (cadastroFaltando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-3xl">🗂️</p>
          <h1 className="mt-2 text-lg font-bold text-slate-900">
            Cadastros incompletos
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Para iniciar uma inspeção é preciso ter pelo menos um registro ativo em cada cadastro:
            veículo, garagem/unidade, tipo de limpeza, inspetor/encarregado e equipe.
          </p>
          <ul className="mt-4 flex flex-col gap-1 text-left text-sm text-slate-600">
            <li>{veiculosAtivos.length > 0 ? "✅" : "⚠️"} Veículos ativos: {veiculosAtivos.length}</li>
            <li>{garagensAtivas.length > 0 ? "✅" : "⚠️"} Garagens/Unidades ativas: {garagensAtivas.length}</li>
            <li>{tiposAtivos.length > 0 ? "✅" : "⚠️"} Tipos de limpeza ativos: {tiposAtivos.length}</li>
            <li>{inspetoresAtivos.length > 0 ? "✅" : "⚠️"} Inspetores/Encarregados ativos: {inspetoresAtivos.length}</li>
            <li>{equipesAtivas.length > 0 ? "✅" : "⚠️"} Equipes ativas: {equipesAtivas.length}</li>
            <li>
              {itensChecklistAtivos.length > 0 ? "✅" : "⚠️"} Itens do checklist ativos:{" "}
              {itensChecklistAtivos.length}
            </li>
          </ul>
          <Link
            href="/cadastros"
            className="mt-5 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md"
          >
            Ir para Cadastros
          </Link>
        </div>
      </div>
    );
  }

  return (
    <NovaInspecaoWizard
      veiculos={veiculosAtivos}
      garagens={garagensAtivas}
      tiposLimpeza={tiposAtivos}
      inspetores={inspetoresAtivos}
      equipes={equipesAtivas}
      catalogoChecklist={itensChecklistAtivos}
    />
  );
}
