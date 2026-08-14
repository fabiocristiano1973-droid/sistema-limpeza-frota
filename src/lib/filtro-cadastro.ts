export function filtrarRegistros<T extends { status: string }>(
  registros: T[],
  opts: { q?: string; status?: string; camposBusca: (keyof T)[] }
): T[] {
  let resultado = registros;

  if (opts.status) {
    resultado = resultado.filter((r) => r.status === opts.status);
  }

  if (opts.q) {
    const q = opts.q.toLowerCase();
    resultado = resultado.filter((r) =>
      opts.camposBusca.some((campo) => String(r[campo] ?? "").toLowerCase().includes(q))
    );
  }

  return resultado;
}
