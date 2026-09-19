// Service worker do Governo Interior — app independente, escopo "/" (raiz
// deste app; não compartilha domínio/deploy com o sistema de limpeza).
//
// Estratégia: os dados reais moram no IndexedDB do navegador (não aqui) —
// este SW só garante que o "casco" do app (HTML das rotas principais,
// JS/CSS gerados pelo Next e ícones) fique disponível offline, com
// stale-while-revalidate para manter tudo atualizado quando há rede.
// Pré-cacheia as rotas principais (não só a Home) — a maioria das telas é
// só casco + IndexedDB, então funcionam offline mesmo na primeira visita.
const CACHE_VERSAO = "governo-interior-v1";
const URLS_ESSENCIAIS = [
  "/",
  "/registrar",
  "/principios",
  "/principios/novo",
  "/valores",
  "/valores/novo",
  "/codigo",
  "/conflitos",
  "/conflitos/novo",
  "/revisao-semanal",
  "/evolucao",
  "/configuracoes",
  "/mais",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSAO)
      .then((cache) => cache.addAll(URLS_ESSENCIAIS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE_VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function ehMesmaOrigem(url) {
  return url.origin === self.location.origin;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!ehMesmaOrigem(url)) return;

  // Navegações dentro do app: tenta rede, cai pro casco em cache se offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE_VERSAO).then((cache) => cache.put(request, copia));
          return resposta;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_VERSAO);
          return (
            (await cache.match(request)) ||
            (await cache.match("/")) ||
            new Response("Você está offline e esta página ainda não foi visitada.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }),
    );
    return;
  }

  // Assets estáticos do próprio app (ícones, chunks do Next, manifest):
  // stale-while-revalidate.
  const ehAssetRelevante = url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/");
  if (!ehAssetRelevante) return;

  event.respondWith(
    caches.open(CACHE_VERSAO).then(async (cache) => {
      const emCache = await cache.match(request);
      const buscaRede = fetch(request)
        .then((resposta) => {
          if (resposta.ok) cache.put(request, resposta.clone());
          return resposta;
        })
        .catch(() => undefined);
      return emCache || (await buscaRede) || Response.error();
    }),
  );
});
