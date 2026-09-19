// Gerador de id simples, sem dependências — suficiente para chaves locais
// (IndexedDB) onde só precisamos de unicidade, não de imprevisibilidade
// criptográfica.
export function gerarId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
