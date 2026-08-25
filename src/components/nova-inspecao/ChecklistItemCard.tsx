"use client";

import { useRef, useState } from "react";
import { ItemEditState, itemEstaCompleto } from "@/lib/wizard";
import { Criticidade, StatusItem } from "@/types/inspection";
import EvidenciaPreview from "@/components/EvidenciaPreview";
import { comprimirImagem } from "@/lib/comprimir-imagem";

// Tamanho do arquivo ORIGINAL escolhido, antes de comprimir — só pra não
// travar o navegador tentando processar algo absurdo. O que importa pro
// payload da inspeção é o tamanho DEPOIS da compressão (ver comprimir-imagem.ts).
const TAMANHO_MAXIMO_ORIGINAL = 20 * 1024 * 1024; // 20MB

const OPCOES: { status: StatusItem; label: string; emoji: string }[] = [
  { status: "CONFORME", label: "Conforme", emoji: "✅" },
  { status: "NAO_CONFORME", label: "Não Conforme", emoji: "⚠️" },
  { status: "NA", label: "N/A", emoji: "➖" },
];

function estiloBotao(status: StatusItem, ativo: boolean): string {
  if (!ativo) return "bg-white text-slate-600 ring-1 ring-slate-300";
  if (status === "CONFORME") return "bg-emerald-600 text-white shadow-md";
  if (status === "NAO_CONFORME") return "bg-red-600 text-white shadow-md";
  return "bg-slate-500 text-white shadow-md";
}

export default function ChecklistItemCard({
  item,
  onChange,
  destacarPendente,
}: {
  item: ItemEditState;
  onChange: (item: ItemEditState) => void;
  destacarPendente?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completo = itemEstaCompleto(item);
  const pendente = Boolean(destacarPendente && !completo);
  const [erroEvidencia, setErroEvidencia] = useState<string | null>(null);
  const [comprimindo, setComprimindo] = useState(false);

  const precisaFotoAgora = item.exigeFoto && item.status !== null && item.status !== "NA";

  function selecionarStatus(status: StatusItem) {
    if (status === "NAO_CONFORME") {
      // Pré-seleciona a criticidade a partir do padrão cadastrado para o
      // item (sem sobrescrever uma escolha que o inspetor já tenha feito);
      // ele continua livre para trocar antes de confirmar.
      const criticidadeSugerida: Criticidade =
        item.criticidadePadrao === "CRITICO" ? "CRITICA" : "NAO_CRITICA";
      onChange({ ...item, status, criticidade: item.criticidade ?? criticidadeSugerida });
    } else {
      onChange({
        ...item,
        status,
        observacao: "",
        criticidade: null,
        // Foto exigida (exigeFoto) some quando o item deixa de se aplicar
        // (N/A); nos demais casos a evidência é preservada mesmo trocando
        // entre Conforme/Não Conforme.
        fotoDataUrl: status === "NA" ? undefined : item.fotoDataUrl,
        evidenciaTipo: status === "NA" ? undefined : item.evidenciaTipo,
      });
    }
  }

  function selecionarOpcao(opcao: string) {
    const conforme = opcao === item.opcaoConforme;
    if (conforme) {
      onChange({
        ...item,
        respostaSelecao: opcao,
        status: "CONFORME",
        observacao: "",
        criticidade: null,
      });
      return;
    }
    const criticidadeSugerida: Criticidade = item.criticidadePadrao === "CRITICO" ? "CRITICA" : "NAO_CRITICA";
    onChange({
      ...item,
      respostaSelecao: opcao,
      status: "NAO_CONFORME",
      // Pré-preenche a observação com a própria opção escolhida — o
      // inspetor pode completar com mais detalhe, mas o campo já nasce
      // válido (não fica bloqueado esperando texto livre redundante).
      observacao: item.observacao.trim().length > 0 ? item.observacao : `Aparência da água: ${opcao}`,
      criticidade: item.criticidade ?? criticidadeSugerida,
    });
  }

  async function onEvidenciaSelecionada(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErroEvidencia(null);

    if (file.size > TAMANHO_MAXIMO_ORIGINAL) {
      setErroEvidencia("Arquivo muito grande (máximo 20MB). Escolha uma foto menor.");
      e.target.value = "";
      return;
    }

    setComprimindo(true);
    try {
      // Comprime no aparelho antes de anexar — evita passar do limite de
      // tamanho da requisição ao salvar (ver comprimir-imagem.ts).
      const dataUrl = await comprimirImagem(file);
      onChange({ ...item, fotoDataUrl: dataUrl, evidenciaTipo: "FOTO" });
    } catch {
      setErroEvidencia("Não foi possível processar essa foto. Tente outra.");
    } finally {
      setComprimindo(false);
      e.target.value = "";
    }
  }

  function removerEvidencia() {
    onChange({ ...item, fotoDataUrl: undefined, evidenciaTipo: undefined });
  }

  const blocoEvidencia = (obrigatoria: boolean) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        Foto / Evidência {obrigatoria ? <span className="text-red-500">*</span> : "(opcional)"}
      </span>
      {item.fotoDataUrl ? (
        <div className="relative w-fit">
          <EvidenciaPreview
            url={item.fotoDataUrl}
            tipo={item.evidenciaTipo}
            className="h-28 w-28 rounded-xl object-cover ring-1 ring-slate-300"
          />
          <button
            type="button"
            onClick={removerEvidencia}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm text-white shadow"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={comprimindo}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium disabled:opacity-60 ${
            obrigatoria && destacarPendente
              ? "bg-red-50 text-red-700 ring-1 ring-red-300"
              : "bg-slate-100 text-slate-700 ring-1 ring-slate-300"
          }`}
        >
          {comprimindo ? "Processando foto..." : "📷 Adicionar foto"}
        </button>
      )}
      {erroEvidencia && <span className="text-xs text-red-600">{erroEvidencia}</span>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onEvidenciaSelecionada}
      />
    </div>
  );

  return (
    <div
      id={`item-${item.itemId}`}
      className={`rounded-2xl bg-white p-4 shadow-sm ring-1 transition ${
        pendente ? "ring-2 ring-red-400" : "ring-slate-200"
      }`}
    >
      <p className="mb-3 text-[15px] font-medium leading-snug text-slate-900">{item.label}</p>

      {item.tipoResposta === "SELECAO" ? (
        <div className="flex flex-col gap-2">
          {(item.opcoesSelecao ?? []).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => selecionarOpcao(opcao)}
              className={`rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                item.respostaSelecao === opcao
                  ? opcao === item.opcaoConforme
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-red-600 text-white shadow-md"
                  : "bg-white text-slate-700 ring-1 ring-slate-300"
              }`}
            >
              {opcao}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {OPCOES.map((op) => (
            <button
              key={op.status}
              type="button"
              onClick={() => selecionarStatus(op.status)}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-xs font-semibold transition ${estiloBotao(
                op.status,
                item.status === op.status
              )}`}
            >
              <span className="text-lg leading-none">{op.emoji}</span>
              {op.label}
            </button>
          ))}
        </div>
      )}

      {/* Evidência disponível pra qualquer item assim que um status é
          escolhido — obrigatória quando o cadastro exige (exigeFoto),
          opcional nos demais casos. Antes só existia campo de foto pra
          itens marcados como obrigatórios; itens comuns não tinham como
          anexar nada, mesmo o inspetor querendo (pedido registrado no
          checklist de campo 21-25/08/2026). */}
      {item.tipoResposta !== "SELECAO" && item.status !== null && item.status !== "NA" && (
        <div className="mt-4 border-t border-slate-100 pt-4">{blocoEvidencia(precisaFotoAgora)}</div>
      )}

      {item.status === "NAO_CONFORME" && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Observação <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={2}
              placeholder="Descreva a não conformidade encontrada"
              value={item.observacao}
              onChange={(e) => onChange({ ...item, observacao: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Criticidade <span className="text-red-500">*</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(["CRITICA", "NAO_CRITICA"] as Criticidade[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ ...item, criticidade: c })}
                  className={`rounded-xl px-2 py-2.5 text-sm font-semibold transition ${
                    item.criticidade === c
                      ? c === "CRITICA"
                        ? "bg-red-700 text-white shadow-md"
                        : "bg-amber-500 text-white shadow-md"
                      : "bg-white text-slate-700 ring-1 ring-slate-300"
                  }`}
                >
                  {c === "CRITICA" ? "🔴 Crítica" : "🟡 Não Crítica"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
