/**
 * Roda uma vez quando o servidor Next.js sobe (dev ou `next start`), antes de
 * atender qualquer requisição. Ver node_modules/next/dist/docs/.../instrumentation.md.
 *
 * Duas proteções adicionadas após o incidente de 2026-08-15 (banco reduzido
 * a um esqueleto vazio entre uma noite e a manhã seguinte, causa raiz do
 * apagamento ainda não confirmada) — implementadas em ./instrumentation.node.ts
 * (mantido separado deste arquivo para não puxar módulos Node como fs/path/
 * node:sqlite para o bundle do runtime Edge):
 *   1. Verifica se as tabelas críticas existem e têm dados; se não, registra
 *      um alerta que o layout raiz usa para bloquear a UI inteira.
 *   2. Backup automático no boot e a cada N minutos, além dos backups
 *      manuais já feitos pelos scripts administrativos.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNode } = await import("./instrumentation.node");
    await registerNode();
  }
}
