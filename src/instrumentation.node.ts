/**
 * Lógica Node-only da inicialização — separada de instrumentation.ts para
 * evitar que o bundler tente empacotar módulos nativos (fs, path, node:sqlite)
 * também para o runtime Edge (ver padrão recomendado em
 * node_modules/next/dist/docs/.../instrumentation.md, seção "Specifying the runtime").
 */
export async function registerNode() {
  const { getDbDriver } = await import("@/lib/db/driver");

  // Guarda de integridade + backup automático reforçado existem só para o
  // incidente de perda de dados do SQLite local (ver integrity-guard.ts) —
  // não fazem sentido com Postgres (sem arquivo local pra verificar/copiar)
  // nem num ambiente serverless (sem disco persistente, sem setInterval
  // sobrevivendo entre invocações).
  if (getDbDriver() === "postgres") {
    console.log("[boot] Driver Postgres ativo — guarda de integridade e backup automático do SQLite desativados.");
    return;
  }

  const { verificarIntegridadeBanco } = await import("@/lib/db/integrity-guard");
  const { backupAutomatico, limparBackupsAutomaticosAntigos } = await import("@/lib/db/auto-backup");

  async function checarEFazerBackup(origem: string) {
    const resultado = await verificarIntegridadeBanco();
    if (!resultado.ok) {
      console.error("=".repeat(72));
      console.error(`[integridade] ALERTA (${origem}): ${resultado.motivo}`);
      console.error(`[integridade] Detalhes: ${JSON.stringify(resultado.detalhes)}`);
      console.error("[integridade] A interface vai ficar bloqueada com um aviso até isso ser resolvido manualmente.");
      console.error("=".repeat(72));
    } else {
      console.log(`[integridade] Verificação (${origem}) OK.`);
    }

    const backupResultado = await backupAutomatico(resultado.ok ? origem : `${origem}-ALERTA`);
    if (backupResultado.ok) {
      console.log(`[backup] Backup automático (${origem}) criado em: ${backupResultado.caminho}`);
    } else {
      console.error(`[backup] Falha no backup automático (${origem}): ${backupResultado.erro}`);
    }
    limparBackupsAutomaticosAntigos();
  }

  // Não aguardado de propósito: a verificação de integridade agora pode levar
  // até ~28s no pior caso (retry da corrida de recuperação do WAL, ver
  // integrity-guard.ts). Bloquear register() nisso deixaria o servidor
  // inteiro fora do ar até resolver — em vez disso, o servidor fica pronto
  // na hora e a tela "Verificando integridade..." cobre esse intervalo.
  checarEFazerBackup("boot").catch((erro) => {
    console.error("[integridade] Erro inesperado na checagem de boot:", erro);
  });

  const intervaloMin = Number(process.env.SLF_BACKUP_INTERVALO_MIN) || 15;
  setInterval(() => {
    checarEFazerBackup("periodico").catch((erro) => {
      console.error("[backup] Erro inesperado no ciclo periódico:", erro);
    });
  }, intervaloMin * 60 * 1000);

  console.log(
    `[backup] Backup automático reforçado habilitado — a cada boot e a cada ${intervaloMin} min (temporário, até a causa do incidente de 2026-08-15 ser confirmada).`
  );
}
