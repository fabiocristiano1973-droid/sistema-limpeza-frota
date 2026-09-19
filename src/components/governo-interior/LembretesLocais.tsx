"use client";

import { useEffect } from "react";
import { obterConfiguracaoLembretes } from "@/lib/governo-interior/db";

// Best-effort: só dispara enquanto esta aba está aberta. Não substitui o
// .ics (a via confiável) — ver seção "Como receber os lembretes de
// verdade" em Configurações. Nunca finge confiabilidade que não existe.
const CHAVE_ULTIMO_DISPARO = "governo-interior:ultimo-disparo-lembrete";

function horarioAtualBate(horario: string): boolean {
  const agora = new Date();
  const [h, m] = horario.split(":").map(Number);
  return agora.getHours() === h && agora.getMinutes() === m;
}

function jaDisparouAgora(chaveLembrete: string): boolean {
  const registro = sessionStorage.getItem(CHAVE_ULTIMO_DISPARO);
  const minutoAtual = `${new Date().toISOString().slice(0, 16)}`;
  return registro === `${chaveLembrete}:${minutoAtual}`;
}

function marcarDisparo(chaveLembrete: string) {
  const minutoAtual = `${new Date().toISOString().slice(0, 16)}`;
  sessionStorage.setItem(CHAVE_ULTIMO_DISPARO, `${chaveLembrete}:${minutoAtual}`);
}

export default function LembretesLocais() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const intervalo = setInterval(async () => {
      if (Notification.permission !== "granted") return;
      const config = await obterConfiguracaoLembretes();
      if (!config.notificacoesLocaisAtivas) return;

      if (config.manhaAtivo && horarioAtualBate(config.manhaHorario) && !jaDisparouAgora("manha")) {
        marcarDisparo("manha");
        new Notification("Governo Interior", { body: "Qual princípio vai governar Fábio hoje?" });
      }
      if (config.noiteAtivo && horarioAtualBate(config.noiteHorario) && !jaDisparouAgora("noite")) {
        marcarDisparo("noite");
        new Notification("Governo Interior", { body: "Suas decisões de hoje revelaram quais princípios?" });
      }
      if (
        config.semanalAtivo &&
        new Date().getDay() === config.semanalDiaSemana &&
        horarioAtualBate(config.semanalHorario) &&
        !jaDisparouAgora("semanal")
      ) {
        marcarDisparo("semanal");
        new Notification("Governo Interior", { body: "É hora de revisar suas evidências da semana." });
      }
    }, 30_000);

    return () => clearInterval(intervalo);
  }, []);

  return null;
}
