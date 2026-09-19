// Este app já tem um manifest.ts na raiz (para o sistema de limpeza da
// frota) e, nesta versão do Next.js, o arquivo de convenção `manifest.ts`
// só é reconhecido como rota de metadata quando está na RAIZ de app/ (a
// checagem interna usa uma regex ancorada em `^/manifest`, que não bate com
// caminhos aninhados como `/governo-interior/manifest`). Por isso o
// manifest do Governo Interior é servido "na mão" por um route handler,
// nomeando a própria pasta como `manifest.webmanifest` — assim a rota já
// nasce com a extensão certa, sem precisar de reescrita.
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      name: "Governo Interior — Princípios em Ação",
      short_name: "Governo Interior",
      description:
        "Ferramenta pessoal para descobrir, testar, praticar e incorporar valores e princípios no dia a dia.",
      start_url: "/governo-interior",
      scope: "/governo-interior/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0b1220",
      theme_color: "#0b1220",
      lang: "pt-BR",
      icons: [
        { src: "/icons/governo-interior/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/governo-interior/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        {
          src: "/icons/governo-interior/icon-192-maskable.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/icons/governo-interior/icon-512-maskable.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
