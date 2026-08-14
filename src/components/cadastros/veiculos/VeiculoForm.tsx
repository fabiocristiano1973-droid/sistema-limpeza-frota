"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/cadastros/FormField";
import ErrorBanner from "@/components/cadastros/ErrorBanner";
import { inputClass, selectClass, textareaClass } from "@/components/cadastros/form-styles";
import { Garagem, Veiculo } from "@/types/cadastros";

export default function VeiculoForm({
  garagens,
  veiculo,
}: {
  garagens: Garagem[];
  veiculo?: Veiculo;
}) {
  const router = useRouter();
  const editando = Boolean(veiculo);

  const [prefixo, setPrefixo] = useState(veiculo?.prefixo ?? "");
  const [placa, setPlaca] = useState(veiculo?.placa ?? "");
  const [garagemId, setGaragemId] = useState(veiculo?.garagemId ?? "");
  const [fabricante, setFabricante] = useState(veiculo?.fabricante ?? "");
  const [modelo, setModelo] = useState(veiculo?.modelo ?? "");
  const [ano, setAno] = useState(veiculo?.ano ? String(veiculo.ano) : "");
  const [tipoVeiculo, setTipoVeiculo] = useState(veiculo?.tipoVeiculo ?? "");
  const [observacao, setObservacao] = useState(veiculo?.observacao ?? "");

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!prefixo.trim() || !placa.trim()) {
      setErro("Prefixo e placa são obrigatórios.");
      return;
    }
    setEnviando(true);
    setErro(null);

    const payload = {
      prefixo: prefixo.trim(),
      placa: placa.trim().toUpperCase(),
      garagemId: garagemId || undefined,
      fabricante: fabricante.trim() || undefined,
      modelo: modelo.trim() || undefined,
      ano: ano ? Number(ano) : undefined,
      tipoVeiculo: tipoVeiculo.trim() || undefined,
      observacao: observacao.trim() || undefined,
    };

    try {
      const url = editando ? `/api/cadastros/veiculos/${veiculo!.id}` : "/api/cadastros/veiculos";
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Não foi possível salvar o veículo.");
      }
      router.push("/cadastros/veiculos");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <ErrorBanner mensagem={erro} />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Prefixo do ônibus" required>
          <input className={inputClass} value={prefixo} onChange={(e) => setPrefixo(e.target.value)} placeholder="Ex: 10234" />
        </FormField>

        <FormField label="Placa" required>
          <input
            className={inputClass}
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            placeholder="Ex: ABC1D23"
            maxLength={8}
          />
        </FormField>
      </div>

      <FormField label="Garagem / Unidade" hint="Usada para sugerir automaticamente a unidade na inspeção">
        <select className={selectClass} value={garagemId} onChange={(e) => setGaragemId(e.target.value)}>
          <option value="">Sem unidade definida</option>
          {garagens.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField label="Fabricante">
          <input className={inputClass} value={fabricante} onChange={(e) => setFabricante(e.target.value)} />
        </FormField>
        <FormField label="Modelo">
          <input className={inputClass} value={modelo} onChange={(e) => setModelo(e.target.value)} />
        </FormField>
        <FormField label="Ano">
          <input
            className={inputClass}
            type="number"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            min={1980}
            max={2100}
          />
        </FormField>
      </div>

      <FormField label="Tipo de veículo">
        <input
          className={inputClass}
          value={tipoVeiculo}
          onChange={(e) => setTipoVeiculo(e.target.value)}
          placeholder="Ex: Urbano, Rodoviário, Micro-ônibus"
        />
      </FormField>

      <FormField label="Observação">
        <textarea
          className={textareaClass}
          rows={3}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
      </FormField>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/cadastros/veiculos")}
          className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-base font-semibold text-slate-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md disabled:opacity-50"
        >
          {enviando ? "Salvando..." : "Salvar Veículo"}
        </button>
      </div>
    </form>
  );
}
