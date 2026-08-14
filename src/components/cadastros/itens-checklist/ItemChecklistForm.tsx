"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/cadastros/FormField";
import ErrorBanner from "@/components/cadastros/ErrorBanner";
import { inputClass, selectClass } from "@/components/cadastros/form-styles";
import { categoriasConhecidas, obterInfoCategoria } from "@/lib/checklist-catalog";
import { AplicacaoItemChecklist, CriticidadePadrao, ItemChecklistCadastro } from "@/types/cadastros";

const NOVA_CATEGORIA = "__nova__";

export default function ItemChecklistForm({
  item,
  itensExistentes,
  classificacoesVeiculos,
}: {
  item?: ItemChecklistCadastro;
  itensExistentes: ItemChecklistCadastro[];
  classificacoesVeiculos: string[];
}) {
  const router = useRouter();
  const editando = Boolean(item);

  const opcoesCategoria = useMemo(() => {
    const conhecidas = categoriasConhecidas();
    const extras = new Set<string>();
    for (const i of itensExistentes) {
      if (!conhecidas.some((c) => c.valor === i.categoria)) extras.add(i.categoria);
    }
    return [
      ...conhecidas,
      ...Array.from(extras).map((valor) => ({ valor, ...obterInfoCategoria(valor) })),
    ];
  }, [itensExistentes]);

  const categoriaInicialConhecida = item ? opcoesCategoria.some((o) => o.valor === item.categoria) : true;

  const [categoriaSelect, setCategoriaSelect] = useState(
    item && categoriaInicialConhecida ? item.categoria : item ? NOVA_CATEGORIA : ""
  );
  const [categoriaCustom, setCategoriaCustom] = useState(
    item && !categoriaInicialConhecida ? item.categoria : ""
  );
  const [nome, setNome] = useState(item?.nome ?? "");
  const [ordem, setOrdem] = useState(String(item?.ordem ?? sugerirOrdem(itensExistentes, item?.categoria)));
  const [aplicacaoTipo, setAplicacaoTipo] = useState<AplicacaoItemChecklist>(
    item?.aplicacaoTipo ?? "TODOS"
  );
  const [aplicacaoClassificacao, setAplicacaoClassificacao] = useState(
    item?.aplicacaoClassificacao ?? "DD"
  );
  const [criticidadePadrao, setCriticidadePadrao] = useState<CriticidadePadrao>(
    item?.criticidadePadrao ?? "NORMAL"
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const categoriaFinal = categoriaSelect === NOVA_CATEGORIA ? categoriaCustom.trim() : categoriaSelect;

  function onCategoriaChange(valor: string) {
    setCategoriaSelect(valor);
    if (valor !== NOVA_CATEGORIA && !item) {
      setOrdem(String(sugerirOrdem(itensExistentes, valor)));
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!categoriaFinal) {
      setErro("Informe a categoria/área do item.");
      return;
    }
    if (!nome.trim()) {
      setErro("Informe o nome/descrição do item.");
      return;
    }
    if (aplicacaoTipo === "CLASSIFICACAO" && !aplicacaoClassificacao.trim()) {
      setErro('Informe a classificação de veículo (ex: "DD") para esta aplicação.');
      return;
    }

    setEnviando(true);
    setErro(null);

    const payload = {
      categoria: categoriaFinal,
      nome: nome.trim(),
      ordem: Number(ordem) || 0,
      aplicacaoTipo,
      aplicacaoClassificacao: aplicacaoTipo === "CLASSIFICACAO" ? aplicacaoClassificacao.trim() : undefined,
      criticidadePadrao,
    };

    try {
      const url = editando
        ? `/api/cadastros/itens-checklist/${item!.id}`
        : "/api/cadastros/itens-checklist";
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Não foi possível salvar o item.");
      }
      router.push("/cadastros/itens-checklist");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <ErrorBanner mensagem={erro} />

      <FormField label="Categoria / Área da inspeção" required>
        <select className={selectClass} value={categoriaSelect} onChange={(e) => onCategoriaChange(e.target.value)}>
          <option value="">Selecione a categoria</option>
          {opcoesCategoria.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.icone} {c.label}
            </option>
          ))}
          <option value={NOVA_CATEGORIA}>➕ Nova categoria...</option>
        </select>
      </FormField>

      {categoriaSelect === NOVA_CATEGORIA && (
        <FormField label="Nome da nova categoria/área" required hint='Ex: "Sanitário", "Interno", "Equipamentos"'>
          <input
            className={inputClass}
            value={categoriaCustom}
            onChange={(e) => setCategoriaCustom(e.target.value)}
            placeholder="Digite o nome da categoria"
          />
        </FormField>
      )}

      <FormField label="Nome / descrição do item" required>
        <input
          className={inputClass}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder='Ex: "Capas limpas"'
        />
      </FormField>

      <FormField
        label="Ordem de exibição"
        hint="Itens com número menor aparecem primeiro dentro da categoria"
      >
        <input
          className={inputClass}
          type="number"
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
        />
      </FormField>

      <FormField label="Aplicação" hint="Em quais veículos este item deve aparecer no checklist">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAplicacaoTipo("TODOS")}
            className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
              aplicacaoTipo === "TODOS"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-slate-700 ring-1 ring-slate-300"
            }`}
          >
            Todos os veículos
          </button>
          <button
            type="button"
            onClick={() => setAplicacaoTipo("CLASSIFICACAO")}
            className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
              aplicacaoTipo === "CLASSIFICACAO"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-slate-700 ring-1 ring-slate-300"
            }`}
          >
            Somente classificação...
          </button>
        </div>
      </FormField>

      {aplicacaoTipo === "CLASSIFICACAO" && (
        <FormField
          label="Classificação do veículo"
          required
          hint='Compara com o campo "Tipo de veículo" cadastrado na Frota (ex: DD). Cadastre o veículo com esse mesmo valor para o item aparecer.'
        >
          <input
            className={inputClass}
            list="classificacoes-veiculos"
            value={aplicacaoClassificacao}
            onChange={(e) => setAplicacaoClassificacao(e.target.value)}
            placeholder="Ex: DD"
          />
          <datalist id="classificacoes-veiculos">
            {classificacoesVeiculos.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </FormField>
      )}

      <FormField
        label="Criticidade padrão"
        hint="Sugestão pré-selecionada quando o item for marcado Não Conforme — o inspetor ainda pode trocar"
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setCriticidadePadrao("NORMAL")}
            className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
              criticidadePadrao === "NORMAL"
                ? "bg-slate-700 text-white shadow-md"
                : "bg-white text-slate-700 ring-1 ring-slate-300"
            }`}
          >
            ⚪ Normal
          </button>
          <button
            type="button"
            onClick={() => setCriticidadePadrao("CRITICO")}
            className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
              criticidadePadrao === "CRITICO"
                ? "bg-red-700 text-white shadow-md"
                : "bg-white text-slate-700 ring-1 ring-slate-300"
            }`}
          >
            🔴 Crítico
          </button>
        </div>
      </FormField>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/cadastros/itens-checklist")}
          className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-base font-semibold text-slate-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md disabled:opacity-50"
        >
          {enviando ? "Salvando..." : "Salvar Item"}
        </button>
      </div>
    </form>
  );
}

function sugerirOrdem(itensExistentes: ItemChecklistCadastro[], categoria?: string): number {
  const daCategoria = categoria ? itensExistentes.filter((i) => i.categoria === categoria) : [];
  if (daCategoria.length > 0) {
    return Math.max(...daCategoria.map((i) => i.ordem)) + 10;
  }
  if (itensExistentes.length > 0) {
    return Math.max(...itensExistentes.map((i) => i.ordem)) + 100;
  }
  return 100;
}
