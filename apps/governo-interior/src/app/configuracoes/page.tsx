"use client";

import { useEffect, useRef, useState } from "react";
import {
  exportarTudo,
  importarTudo,
  obterConfiguracaoLembretes,
  salvarConfiguracaoLembretes,
} from "@/lib/db";
import { montarPayloadExportacao, nomeArquivoExportacao, validarPayloadImportacao } from "@/lib/exportacao";
import { gerarICS } from "@/lib/ics";
import type { ConfiguracaoLembretes } from "@/lib/types";
import { nomeDiaSemana } from "@/lib/date";
import {
  BotaoPrimario,
  BotaoSecundario,
  Cabecalho,
  Campo,
  Cartao,
  Carregando,
  Selecao,
} from "@/components/ui";

const DIAS = [0, 1, 2, 3, 4, 5, 6];

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<ConfiguracaoLembretes | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagemNotificacao, setMensagemNotificacao] = useState("");
  const [mensagemImportacao, setMensagemImportacao] = useState("");
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    obterConfiguracaoLembretes().then(setConfig);
  }, []);

  if (!config) return <Carregando />;

  function atualizar<K extends keyof ConfiguracaoLembretes>(chave: K, valor: ConfiguracaoLembretes[K]) {
    setConfig((c) => (c ? { ...c, [chave]: valor } : c));
  }

  async function salvar() {
    if (!config) return;
    setSalvando(true);
    try {
      await salvarConfiguracaoLembretes(config);
    } finally {
      setSalvando(false);
    }
  }

  function baixarICS() {
    if (!config) return;
    const conteudo = gerarICS(config);
    const blob = new Blob([conteudo], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "governo-interior-lembretes.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function pedirPermissaoNotificacao() {
    if (!("Notification" in window)) {
      setMensagemNotificacao("Este navegador não suporta notificações.");
      return;
    }
    const permissao = await Notification.requestPermission();
    if (permissao === "granted") {
      atualizar("notificacoesLocaisAtivas", true);
      setMensagemNotificacao(
        "Permissão concedida. Atenção: isto só funciona enquanto o Governo Interior estiver aberto em uma aba — não é confiável com o app fechado no Android. Para lembretes garantidos, use o arquivo .ics abaixo.",
      );
    } else {
      atualizar("notificacoesLocaisAtivas", false);
      setMensagemNotificacao("Permissão negada pelo navegador.");
    }
  }

  async function exportar() {
    const dados = await exportarTudo();
    const payload = montarPayloadExportacao(dados);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivoExportacao();
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importarArquivo(arquivo: File) {
    setMensagemImportacao("");
    try {
      const texto = await arquivo.text();
      const json = JSON.parse(texto);
      const payload = validarPayloadImportacao(json);
      const confirmado = confirm(
        "Importar este backup vai SUBSTITUIR todos os dados atuais do Governo Interior neste dispositivo. Deseja continuar?",
      );
      if (!confirmado) return;
      await importarTudo(payload);
      setMensagemImportacao("Dados importados com sucesso. Recarregando…");
      setTimeout(() => window.location.reload(), 1200);
    } catch (erro) {
      setMensagemImportacao(erro instanceof Error ? erro.message : "Não foi possível importar este arquivo.");
    }
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo="Configurações" voltarPara="/mais" />

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold text-[#f4ede0]">Lembretes</h2>
        <Cartao className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#f4ede0]">Lembrete da manhã</p>
              <p className="text-xs text-[#8892a8]">&ldquo;Qual princípio vai governar Fábio hoje?&rdquo;</p>
            </div>
            <input
              type="checkbox"
              checked={config.manhaAtivo}
              onChange={(e) => atualizar("manhaAtivo", e.target.checked)}
              className="h-5 w-5 accent-[#c8a24d]"
            />
          </div>
          {config.manhaAtivo && (
            <Campo type="time" value={config.manhaHorario} onChange={(e) => atualizar("manhaHorario", e.target.value)} />
          )}

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-[#f4ede0]">Check-in noturno</p>
              <p className="text-xs text-[#8892a8]">&ldquo;Suas decisões de hoje revelaram quais princípios?&rdquo;</p>
            </div>
            <input
              type="checkbox"
              checked={config.noiteAtivo}
              onChange={(e) => atualizar("noiteAtivo", e.target.checked)}
              className="h-5 w-5 accent-[#c8a24d]"
            />
          </div>
          {config.noiteAtivo && (
            <Campo type="time" value={config.noiteHorario} onChange={(e) => atualizar("noiteHorario", e.target.value)} />
          )}

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-[#f4ede0]">Revisão semanal</p>
              <p className="text-xs text-[#8892a8]">&ldquo;É hora de revisar suas evidências da semana.&rdquo;</p>
            </div>
            <input
              type="checkbox"
              checked={config.semanalAtivo}
              onChange={(e) => atualizar("semanalAtivo", e.target.checked)}
              className="h-5 w-5 accent-[#c8a24d]"
            />
          </div>
          {config.semanalAtivo && (
            <div className="grid grid-cols-2 gap-2">
              <Selecao value={config.semanalDiaSemana} onChange={(e) => atualizar("semanalDiaSemana", Number(e.target.value))}>
                {DIAS.map((d) => (
                  <option key={d} value={d}>
                    {nomeDiaSemana(d)}
                  </option>
                ))}
              </Selecao>
              <Campo type="time" value={config.semanalHorario} onChange={(e) => atualizar("semanalHorario", e.target.value)} />
            </div>
          )}
        </Cartao>

        <div className="mt-3">
          <BotaoPrimario onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar lembretes"}
          </BotaoPrimario>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-[#f4ede0]">Como receber os lembretes de verdade</h2>
        <Cartao className="space-y-3">
          <p className="text-sm text-[#cdd5e3]">
            <strong className="text-[#f4ede0]">Recomendado — calendário:</strong> baixe o arquivo abaixo e importe no
            Google Agenda/Calendário do Android. Assim os lembretes chegam mesmo com o app fechado.
          </p>
          <BotaoSecundario onClick={baixarICS}>Baixar lembretes para o calendário (.ics)</BotaoSecundario>

          <div className="border-t border-white/10 pt-3">
            <p className="text-sm text-[#cdd5e3]">
              <strong className="text-[#f4ede0]">Opcional — notificação no navegador:</strong> só funciona enquanto
              esta aba estiver aberta. Não é confiável com o app fechado (limitação do Android/navegador, não deste
              app). Uma versão futura com push real exigiria service worker + Push API + um servidor dedicado.
            </p>
            <div className="mt-2">
              <BotaoSecundario onClick={pedirPermissaoNotificacao}>
                {config.notificacoesLocaisAtivas ? "Notificações locais ativadas" : "Ativar notificações locais (best-effort)"}
              </BotaoSecundario>
            </div>
            {mensagemNotificacao && <p className="mt-2 text-xs text-[#e8c877]">{mensagemNotificacao}</p>}
          </div>
        </Cartao>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-[#f4ede0]">Seus dados</h2>
        <Cartao className="space-y-3">
          <p className="text-xs text-[#8892a8]">
            Tudo fica só neste dispositivo (IndexedDB do navegador) — nada é enviado a servidores externos.
          </p>
          <BotaoSecundario onClick={exportar}>Exportar todos os dados (.json)</BotaoSecundario>
          <div>
            <input
              ref={inputArquivoRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) importarArquivo(arquivo);
                e.target.value = "";
              }}
            />
            <BotaoSecundario onClick={() => inputArquivoRef.current?.click()}>Importar backup (.json)</BotaoSecundario>
          </div>
          {mensagemImportacao && <p className="text-xs text-[#e0a98a]">{mensagemImportacao}</p>}
        </Cartao>
      </section>
    </div>
  );
}
