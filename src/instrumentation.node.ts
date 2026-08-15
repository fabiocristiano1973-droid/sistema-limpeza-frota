/**
 * Lógica Node-only da inicialização — separada de instrumentation.ts para
 * evitar que o bundler tente empacotar módulos nativos (fs, path, node:sqlite)
 * também para o runtime Edge (ver padrão recomendado em
 * node_modules/next/dist/docs/.../instrumentation.md, seção "Specifying the runtime").
 */
export async function registerNode() {
  const { verificarIntegridadeBanco } = await import("@/lib/db/integrity-guard");
  const { backupAutomatico, limparBackupsAutomaticosAntigos } = await import("@/lib/db/auto-backup");

  async function checarEFazerBackup(origem: string) {
    const resultado = verificarIntegridadeBanco();
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

  await checarEFazerBackup("boot");

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
