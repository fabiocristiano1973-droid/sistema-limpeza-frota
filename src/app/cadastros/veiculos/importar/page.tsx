"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/cadastros/ErrorBanner";
import { gerarTemplateCsv, mapearLinhasCsv } from "@/lib/import-veiculos";
import { ImportacaoLinhaVeiculo } from "@/types/cadastros";

type Etapa = "selecionar" | "revisar" | "concluido";

export default function ImportarVeiculosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [etapa, setEtapa] = useState<Etapa>("selecionar");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [linhasValidadas, setLinhasValidadas] = useState<ImportacaoLinhaVeiculo[]>([]);
  const [totalValidos, setTotalValidos] = useState(0);
  const [totalInvalidos, setTotalInvalidos] = useState(0);
  const [importados, setImportados] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function baixarTemplate() {
    const blob = new Blob([gerarTemplateCsv()], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-importacao-frota.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    setNomeArquivo(file.name);
    setCarregando(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (resultado) => {
        try {
          const linhasBrutas = mapearLinhasCsv(resultado.data);
          const res = await fetch("/api/cadastros/veiculos/importar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ linhas: linhasBrutas, confirmar: false }),
          });
          const body = await res.json();
          if (!res.ok) throw new Error(body.erro || "Não foi possível validar o arquivo.");
          setLinhasValidadas(body.linhasValidadas);
          setTotalValidos(body.totalValidos);
          setTotalInvalidos(body.totalInvalidos);
          setEtapa("revisar");
        } catch (err) {
          setErro(err instanceof Error ? err.message : "Erro ao processar o arquivo.");
        } finally {
          setCarregando(false);
        }
      },
      error: (err: Error) => {
        setErro(`Erro ao ler o CSV: ${err.message}`);
        setCarregando(false);
      },
    });
  }

  async function confirmarImportacao() {
    setCarregando(true);
    setErro(null);
    try {
      // Revalida no servidor com o estado mais atual antes de gravar.
      const linhasBrutas = linhasValidadas.map((l) => ({
        linha: l.linha,
        prefixo: l.prefixo,
        placa: l.placa,
        garagemNome: l.garagemNome ?? "",
        fabricante: l.fabricante ?? "",
        modelo: l.modelo ?? "",
        ano: l.ano ? String(l.ano) : "",
        tipoVeiculo: l.tipoVeiculo ?? "",
        observacao: l.observacao ?? "",
      }));
      const res = await fetch("/api/cadastros/veiculos/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linhas: linhasBrutas, confirmar: true }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.erro || "Não foi possível importar.");
      setLinhasValidadas(body.linhasValidadas);
      setTotalValidos(body.totalValidos);
      setTotalInvalidos(body.totalInvalidos);
      setImportados(body.importados);
      setEtapa("concluido");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao importar.");
    } finally {
      setCarregando(false);
    }
  }

  function recomecar() {
    setEtapa("selecionar");
    setLinhasValidadas([]);
    setNomeArquivo("");
    setErro(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PageHeader titulo="Importar Frota" voltarPara="/cadastros/veiculos" largo />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-3xl">
        <ErrorBanner mensagem={erro} />

        {etapa === "selecionar" && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800 ring-1 ring-blue-100">
              <p className="mb-2 font-semibold">Como importar:</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>Baixe o modelo CSV (colunas: prefixo, placa, garagem, fabricante, modelo, ano, tipo, observacao).</li>
                <li>A coluna &quot;garagem&quot; deve ter o nome ou a sigla de uma unidade já cadastrada.</li>
                <li>Envie o arquivo preenchido para revisar antes de confirmar.</li>
              </ol>
              <p className="mt-2 text-xs text-blue-700">
                Suportamos apenas CSV nesta versão — o formato XLSX foi avaliado e adiado por depender de
                uma biblioteca com vulnerabilidade de segurança conhecida sem correção disponível. Para
                importar de uma planilha Excel, use &quot;Salvar como CSV&quot;.
              </p>
            </div>

            <button
              onClick={baixarTemplate}
              className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300"
            >
              ⬇️ Baixar modelo CSV
            </button>

            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
              <span className="text-3xl">📄</span>
              <span className="text-sm font-semibold text-slate-700">
                {carregando ? "Processando..." : "Toque para selecionar o arquivo CSV"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onArquivoSelecionado}
                disabled={carregando}
              />
            </label>
          </div>
        )}

        {etapa === "revisar" && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-200">
                <p className="text-xl font-bold text-slate-900">{linhasValidadas.length}</p>
                <p className="text-xs text-slate-500">Linhas em {nomeArquivo}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-center ring-1 ring-emerald-200">
                <p className="text-xl font-bold text-emerald-800">{totalValidos}</p>
                <p className="text-xs text-emerald-700">Válidas</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-3 text-center ring-1 ring-red-200">
                <p className="text-xl font-bold text-red-800">{totalInvalidos}</p>
                <p className="text-xs text-red-700">Com erro</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Linha</th>
                    <th className="px-3 py-2">Prefixo</th>
                    <th className="px-3 py-2">Placa</th>
                    <th className="px-3 py-2">Unidade</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasValidadas.map((l) => (
                    <tr key={l.linha} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2 text-slate-400">{l.linha}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900">{l.prefixo || "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{l.placa || "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{l.garagemNome || "—"}</td>
                      <td className="px-3 py-2">
                        {l.valido ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                            ✅ Válido
                          </span>
                        ) : (
                          <span className="text-red-700">⚠️ {l.erros.join(" ")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button
                onClick={recomecar}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-base font-semibold text-slate-700"
              >
                Escolher outro arquivo
              </button>
              <button
                onClick={confirmarImportacao}
                disabled={totalValidos === 0 || carregando}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3.5 text-base font-semibold text-white shadow-md disabled:opacity-50"
              >
                {carregando ? "Importando..." : `Confirmar importação (${totalValidos})`}
              </button>
            </div>
          </div>
        )}

        {etapa === "concluido" && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-2xl bg-emerald-600 p-6 text-center text-white shadow-md">
              <p className="text-3xl">✅</p>
              <p className="text-xl font-bold">{importados} veículo(s) importado(s)</p>
              {totalInvalidos > 0 && (
                <p className="mt-1 text-sm text-emerald-50">
                  {totalInvalidos} linha(s) com erro não foram importadas.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={recomecar}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-base font-semibold text-slate-700"
              >
                Importar outro arquivo
              </button>
              <button
                onClick={() => router.push("/cadastros/veiculos")}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md"
              >
                Ver frota
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
