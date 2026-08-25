"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import DadosForm, { DadosInspecao, dadosEstaoCompletos } from "@/components/nova-inspecao/DadosForm";
import ChecklistCategoryStep from "@/components/nova-inspecao/ChecklistCategoryStep";
import Finalizacao from "@/components/nova-inspecao/Finalizacao";
import { catalogoAplicavel, categoriasDoCatalogo } from "@/lib/checklist-catalog";
import {
  categoriaEstaCompleta,
  criarItensIniciais,
  converterParaItemResultado,
  itemEstaCompleto,
  ItemEditState,
  reconciliarItens,
  todosItensCompletos,
} from "@/lib/wizard";
import { carregarRascunho, salvarRascunho, limparRascunho } from "@/lib/wizard-draft";
import { NovaInspecaoPayload, Turno } from "@/types/inspection";
import { Equipe, Garagem, Inspetor, ItemChecklistCadastro, TipoLimpeza, Veiculo } from "@/types/cadastros";

export default function NovaInspecaoWizard({
  veiculos,
  garagens,
  tiposLimpeza,
  inspetores,
  equipes,
  catalogoChecklist,
}: {
  veiculos: Veiculo[];
  garagens: Garagem[];
  tiposLimpeza: TipoLimpeza[];
  inspetores: Inspetor[];
  equipes: Equipe[];
  catalogoChecklist: ItemChecklistCadastro[];
}) {
  const router = useRouter();
  const [agora] = useState(() => new Date());

  // Rascunho recuperado do localStorage (se existir) — protege contra perda
  // de dados quando a página recarrega sozinha no meio da inspeção (F5,
  // gesto de "puxar para atualizar" no celular, app reiniciado). Lido uma
  // única vez, no primeiro render.
  const [rascunhoInicial] = useState(() => carregarRascunho());
  const [rascunhoRecuperado, setRascunhoRecuperado] = useState(rascunhoInicial !== null);

  const [step, setStep] = useState(rascunhoInicial?.step ?? 0);
  const [dados, setDados] = useState<DadosInspecao>(
    rascunhoInicial?.dados ?? {
      veiculoId: "",
      garagemId: "",
      turno: "",
      tipoLimpezaId: "",
      inspetorId: "",
      equipeId: "",
    }
  );

  const veiculoSelecionado = veiculos.find((v) => v.id === dados.veiculoId) ?? null;

  // O conjunto de itens aplicável depende do veículo selecionado (itens
  // condicionais, como "Mantas presentes" em veículos DD, só entram quando
  // aplicáveis). Recalculado sempre que o veículo muda.
  const itensAplicaveis = useMemo(
    () => catalogoAplicavel(catalogoChecklist, veiculoSelecionado),
    [catalogoChecklist, veiculoSelecionado]
  );
  const categorias = useMemo(() => categoriasDoCatalogo(itensAplicaveis), [itensAplicaveis]);
  const TOTAL_STEPS = 1 + categorias.length + 1; // dados + categorias + finalização

  const [itens, setItens] = useState<ItemEditState[]>(
    () => rascunhoInicial?.itens ?? criarItensIniciais(itensAplicaveis)
  );

  // Reconcilia as respostas já preenchidas sempre que o conjunto aplicável
  // muda (ex.: troca de veículo ainda na etapa de dados). Ajuste de estado
  // durante a renderização (não em um efeito) — padrão recomendado pelo
  // React para "adaptar estado quando uma prop/derivado muda", evitando um
  // re-render extra: https://react.dev/learn/you-might-not-need-an-effect
  const [itensAplicaveisAnterior, setItensAplicaveisAnterior] = useState(itensAplicaveis);
  if (itensAplicaveis !== itensAplicaveisAnterior) {
    setItensAplicaveisAnterior(itensAplicaveis);
    setItens((prev) => reconciliarItens(prev, itensAplicaveis));
  }

  const [tentouAvancar, setTentouAvancar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  // Salva o rascunho a cada mudança relevante — é a proteção contra a
  // inspeção inteira sumir se a página recarregar sozinha no meio do
  // trabalho. Não salva enquanto está enviando/já enviou (nesse ponto o
  // rascunho já foi limpo por salvarInspecao()).
  useEffect(() => {
    if (enviando) return;
    salvarRascunho({ dados, itens, step });
  }, [dados, itens, step, enviando]);

  function descartarRascunho() {
    limparRascunho();
    setRascunhoRecuperado(false);
    setDados({ veiculoId: "", garagemId: "", turno: "", tipoLimpezaId: "", inspetorId: "", equipeId: "" });
    setStep(0);
    setItens(criarItensIniciais(itensAplicaveis));
  }

  const isDadosStep = step === 0;
  const isFinalStep = step === TOTAL_STEPS - 1;
  const categoriaAtual = !isDadosStep && !isFinalStep ? categorias[step - 1] : null;

  const tituloEtapa = isDadosStep
    ? "Dados da Inspeção"
    : isFinalStep
    ? "Finalização"
    : categoriaAtual!.label;

  function atualizarItem(itemAtualizado: ItemEditState) {
    setItens((prev) => prev.map((i) => (i.itemId === itemAtualizado.itemId ? itemAtualizado : i)));
  }

  function irParaProximo() {
    if (isDadosStep) {
      if (!dadosEstaoCompletos(dados)) return;
      setStep((s) => s + 1);
      setTentouAvancar(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (categoriaAtual) {
      if (!categoriaEstaCompleta(itens, categoriaAtual.id)) {
        setTentouAvancar(true);
        const primeiroIncompleto = itens.find(
          (i) => i.categoria === categoriaAtual.id && !itemEstaCompleto(i)
        );
        if (primeiroIncompleto) {
          document
            .getElementById(`item-${primeiroIncompleto.itemId}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      setStep((s) => s + 1);
      setTentouAvancar(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function voltar() {
    if (step === 0) return;
    setStep((s) => s - 1);
    setTentouAvancar(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const podeSalvar = useMemo(
    () => itens.length > 0 && todosItensCompletos(itens),
    [itens]
  );

  async function salvarInspecao() {
    if (!podeSalvar || enviando) return;
    setEnviando(true);
    setErroEnvio(null);

    const payload: NovaInspecaoPayload = {
      veiculoId: dados.veiculoId,
      garagemId: dados.garagemId,
      tipoLimpezaId: dados.tipoLimpezaId,
      inspetorId: dados.inspetorId,
      equipeId: dados.equipeId,
      turno: dados.turno as Turno,
      criadoEm: agora.toISOString(),
      itens: itens.map(converterParaItemResultado),
    };

    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Não foi possível salvar a inspeção.");
      }
      const criada = await res.json();
      limparRascunho();
      router.push(`/inspecoes/${criada.id}?nova=1`);
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : "Erro inesperado ao salvar.");
      setEnviando(false);
    }
  }

  const progresso = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-10 bg-white px-4 pb-3 pt-4 shadow-sm">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          {step === 0 ? (
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600"
            >
              ✕
            </Link>
          ) : (
            <button
              onClick={voltar}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600"
            >
              ←
            </button>
          )}
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Etapa {step + 1} de {TOTAL_STEPS}
            </p>
            <h1 className="text-base font-bold text-slate-900">{tituloEtapa}</h1>
          </div>
        </div>
        <div className="mx-auto mt-3 w-full max-w-md">
          <ProgressBar percent={progresso} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 pb-28">
        {rascunhoRecuperado && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
            <span>📝 Rascunho recuperado — a página deve ter recarregado antes de você salvar.</span>
            <button
              type="button"
              onClick={descartarRascunho}
              className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-300"
            >
              Começar do zero
            </button>
          </div>
        )}
        {isDadosStep && (
          <DadosForm
            dados={dados}
            onChange={setDados}
            agora={agora}
            veiculos={veiculos}
            garagens={garagens}
            tiposLimpeza={tiposLimpeza}
            inspetores={inspetores}
            equipes={equipes}
          />
        )}
        {categoriaAtual && (
          <ChecklistCategoryStep
            categoria={categoriaAtual.id}
            itens={itens}
            onChangeItem={atualizarItem}
            tentouAvancar={tentouAvancar}
          />
        )}
        {isFinalStep && <Finalizacao itens={itens} />}

        {erroEnvio && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {erroEnvio}
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 z-10 border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex w-full max-w-md gap-3">
          {step > 0 && (
            <button
              onClick={voltar}
              className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-base font-semibold text-slate-700"
            >
              Voltar
            </button>
          )}
          {!isFinalStep ? (
            <button
              onClick={irParaProximo}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md active:scale-[0.98]"
            >
              Avançar
            </button>
          ) : (
            <button
              onClick={salvarInspecao}
              disabled={!podeSalvar || enviando}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-3.5 text-base font-semibold text-white shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              {enviando ? "Salvando..." : "Salvar Inspeção"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
