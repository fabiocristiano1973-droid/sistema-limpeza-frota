import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Este repositório também tem um package-lock.json na raiz (do sistema
  // de limpeza da frota, um app totalmente separado). Sem isto, o
  // Turbopack infere a raiz do workspace subindo até lá — e passa a tentar
  // empacotar arquivos do OUTRO app (src/proxy.ts, src/instrumentation.ts
  // da frota) como se fossem deste. Fixar a raiz aqui garante isolamento
  // total entre os dois projetos.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
