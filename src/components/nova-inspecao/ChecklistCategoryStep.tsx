"use client";

import ChecklistItemCard from "./ChecklistItemCard";
import { ItemEditState, itemEstaCompleto } from "@/lib/wizard";
import { CategoriaChecklist } from "@/types/inspection";
import { obterInfoCategoria } from "@/lib/checklist-catalog";

export default function ChecklistCategoryStep({
  categoria,
  itens,
  onChangeItem,
  tentouAvancar,
}: {
  categoria: CategoriaChecklist;
  itens: ItemEditState[];
  onChangeItem: (item: ItemEditState) => void;
  tentouAvancar: boolean;
}) {
  const info = obterInfoCategoria(categoria);
  const itensCategoria = itens.filter((i) => i.categoria === categoria);
  const completos = itensCategoria.filter(itemEstaCompleto).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="text-2xl">{info.icone}</span> {info.label}
        </h2>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
          {completos}/{itensCategoria.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {itensCategoria.map((item) => (
          <ChecklistItemCard
            key={item.itemId}
            item={item}
            onChange={onChangeItem}
            destacarPendente={tentouAvancar}
          />
        ))}
      </div>
    </div>
  );
}
