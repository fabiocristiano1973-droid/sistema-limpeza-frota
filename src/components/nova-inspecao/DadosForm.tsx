"use client";

import { TURNOS } from "@/lib/fixtures";
import { Turno } from "@/types/inspection";
import { Equipe, Garagem, Inspetor, TipoLimpeza, Veiculo } from "@/types/cadastros";

export interface DadosInspecao {
  veiculoId: string;
  garagemId: string;
  turno: Turno | "";
  tipoLimpezaId: string;
  inspetorId: string;
  equipeId: string;
}

export function dadosEstaoCompletos(dados: DadosInspecao): boolean {
  return Boolean(
    dados.veiculoId &&
      dados.garagemId &&
      dados.turno &&
      dados.tipoLimpezaId &&
      dados.inspetorId &&
      dados.equipeId
  );
}

const labelClass = "text-sm font-medium text-slate-700";
const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

export default function DadosForm({
  dados,
  onChange,
  agora,
  veiculos,
  garagens,
  tiposLimpeza,
  inspetores,
  equipes,
}: {
  dados: DadosInspecao;
  onChange: (dados: DadosInspecao) => void;
  agora: Date;
  veiculos: Veiculo[];
  garagens: Garagem[];
  tiposLimpeza: TipoLimpeza[];
  inspetores: Inspetor[];
  equipes: Equipe[];
}) {
  function set<K extends keyof DadosInspecao>(campo: K, valor: DadosInspecao[K]) {
    onChange({ ...dados, [campo]: valor });
  }

  const veiculoSelecionado = veiculos.find((v) => v.id === dados.veiculoId);

  function onSelecionarVeiculo(veiculoId: string) {
    const veiculo = veiculos.find((v) => v.id === veiculoId);
    onChange({
      ...dados,
      veiculoId,
      // Sugere/preenche automaticamente a unidade do veículo selecionado.
      garagemId: veiculo?.garagemId ?? dados.garagemId,
    });
  }

  function onSelecionarEquipe(equipeId: string) {
    const equipe = equipes.find((e) => e.id === equipeId);
    onChange({
      ...dados,
      equipeId,
      // Sugere o turno padrão da equipe apenas se ainda não escolhido.
      turno: !dados.turno && equipe?.turnoPadrao ? (equipe.turnoPadrao as Turno) : dados.turno,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800 ring-1 ring-blue-100">
        <span className="font-semibold">Data e hora:</span>{" "}
        {agora.toLocaleDateString("pt-BR")} às{" "}
        {agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </div>

      {veiculos.length === 0 ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Nenhum veículo ativo cadastrado. Cadastre um veículo em Cadastros → Frota antes de iniciar
          uma inspeção.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Prefixo do ônibus</label>
          <select
            className={selectClass}
            value={dados.veiculoId}
            onChange={(e) => onSelecionarVeiculo(e.target.value)}
          >
            <option value="">Selecione o veículo</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.prefixo} — {v.placa}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Placa</label>
        <input
          className={selectClass}
          value={veiculoSelecionado?.placa ?? ""}
          readOnly
          placeholder="Preenchida automaticamente"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Garagem / Unidade</label>
        <select
          className={selectClass}
          value={dados.garagemId}
          onChange={(e) => set("garagemId", e.target.value)}
        >
          <option value="">Selecione a garagem</option>
          {garagens.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Turno</span>
        <div className="grid grid-cols-3 gap-2">
          {TURNOS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("turno", t)}
              className={`rounded-xl px-2 py-3 text-sm font-semibold transition ${
                dados.turno === t
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-slate-700 ring-1 ring-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Tipo de limpeza</label>
        <select
          className={selectClass}
          value={dados.tipoLimpezaId}
          onChange={(e) => set("tipoLimpezaId", e.target.value)}
        >
          <option value="">Selecione o tipo</option>
          {tiposLimpeza.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Inspetor / Encarregado</label>
        <select
          className={selectClass}
          value={dados.inspetorId}
          onChange={(e) => set("inspetorId", e.target.value)}
        >
          <option value="">Selecione o inspetor</option>
          {inspetores.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nomeCompleto}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Equipe responsável pela limpeza</label>
        <select
          className={selectClass}
          value={dados.equipeId}
          onChange={(e) => onSelecionarEquipe(e.target.value)}
        >
          <option value="">Selecione a equipe</option>
          {equipes.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
