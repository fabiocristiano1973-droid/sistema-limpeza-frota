import type { MetadataRoute } from "next";

// Next.js serve isto automaticamente em /manifest.webmanifest — é o que
// permite "Adicionar à tela inicial" no celular/tablet, com aparência de
// app nativo (sem barra de endereço do navegador).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inspeção e Liberação da Limpeza da Frota",
    short_name: "Limpeza Frota",
    description: "Controle de inspeção e liberação da limpeza dos ônibus da frota.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#0f172a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
