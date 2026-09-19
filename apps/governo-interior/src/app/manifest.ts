import type { MetadataRoute } from "next";

// App raiz (não aninhado) — a convenção padrão do Next.js funciona direto
// aqui, servido em /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Governo Interior — Princípios em Ação",
    short_name: "Governo Interior",
    description:
      "Ferramenta pessoal para descobrir, testar, praticar e incorporar valores e princípios no dia a dia.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
