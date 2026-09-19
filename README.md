This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Governo Interior — Princípios em Ação (PWA)

Aplicação pessoal para descobrir, testar, praticar e incorporar valores e princípios no
dia a dia, vivendo dentro deste mesmo projeto Next.js em `/governo-interior`, como um
segundo PWA independente do sistema de limpeza da frota (manifest, service worker e
navegação próprios — um não interfere no outro).

### Por que aqui dentro do mesmo projeto

O ambiente desta tarefa só dava acesso a este repositório (`sistema-limpeza-frota`), e
não a um repositório novo. Em vez de forçar um projeto separado sem onde publicá-lo, o
Governo Interior foi construído como uma seção isolada do mesmo app Next.js, sob o
prefixo `/governo-interior`, com:

- **Manifest próprio**, servido por um route handler em
  `src/app/governo-interior/manifest.webmanifest/route.ts` (essa versão do Next.js só
  reconhece a convenção de arquivo `manifest.ts` na raiz de `app/`; por isso o manifest
  aninhado é montado à mão, nomeando a própria pasta `manifest.webmanifest`).
- **Service worker próprio**, em `public/governo-interior/sw.js`, registrado com
  `scope: "/governo-interior/"` — cobre só essa árvore de rotas, sem tocar no restante
  do site.
- **Layout, tema e navegação próprios**, sem relação visual com o sistema de frota.
- **Exclusão explícita do login da frota**: `src/proxy.ts` (o middleware de
  autenticação do sistema de limpeza) tinha um matcher que capturava *todas* as rotas,
  inclusive as novas — isso foi corrigido adicionando `governo-interior` à lista de
  prefixos ignorados pelo proxy, já que este é um app pessoal sem conta/senha, com
  dados só no dispositivo.

Se um dia este app for separado em outro repositório, basta copiar `src/app/governo-interior/`,
`src/components/governo-interior/`, `src/lib/governo-interior/` e `public/governo-interior/`
para um projeto Next.js novo (ajustando os `import`s de `@/…`) e remover a exceção do proxy.

### Executando

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/governo-interior` no navegador (ou no celular, na mesma
rede, usando o IP mostrado pelo `next dev`).

Build de produção:

```bash
npm run build
npm run start
```

### Testes

```bash
npm run test
```

Cobre as regras de negócio puras: formatação de data em `DD/MM/AAAA`, cálculo de
estatísticas e do avanço no ciclo de maturidade (o que bloqueia "Incorporar" sem
evidências suficientes), classificação automática de evidências, geração do arquivo
`.ics` e exportação/importação — incluindo um teste de integração da camada IndexedDB
com `fake-indexeddb`.

### Instalando como PWA no Android/Samsung

1. Abra `/governo-interior` no Chrome do Android.
2. Menu (⋮) → **Adicionar à tela inicial** (ou o banner de instalação automático do
   Chrome, se aparecer).
3. O app abre em modo `standalone` (sem barra de endereço), com os ícones e cores do
   Governo Interior (não os do sistema de frota).

No desktop (Chrome/Edge), o ícone de instalação aparece na barra de endereço.

### Arquitetura de dados

- **100% local, privacy-first**: tudo fica no IndexedDB do navegador
  (`src/lib/governo-interior/db.ts`, usando a lib `idb`). Nada é enviado a servidor
  algum — não há API routes para o Governo Interior.
- **Backup/exportação**: em Configurações → "Exportar todos os dados (.json)" gera um
  arquivo com valores, princípios, situações, conflitos, seleções semanais, revisões
  semanais e configuração de lembretes. "Importar backup" lê esse mesmo formato e
  **substitui** os dados atuais do dispositivo (pede confirmação antes).
- **Sincronização futura em nuvem**: a camada `db.ts` concentra todo o acesso a dados
  atrás de funções simples (`listarX`, `criarX`, `salvarX`, `excluirX`) — trocar
  IndexedDB por Supabase/PostgreSQL no futuro significa reimplementar só esse arquivo,
  sem tocar nas telas.
- **Datas**: sempre exibidas como `DD/MM/AAAA` (nunca `AAAA-MM-DD`) via
  `src/lib/governo-interior/date.ts`; o formato `AAAA-MM-DD` só é usado internamente
  nos `<input type="date">`, que o próprio navegador exige nesse formato.

### Lembretes e notificações — o que é confiável e o que não é

O Android/Chrome **não garante** disparo de notificações agendadas por uma PWA comum
(sem push real) quando o app está fechado — timers de página são suspensos pelo
sistema. Para não fingir uma confiabilidade que não existe:

- **Via confiável (recomendada)**: Configurações → "Baixar lembretes para o calendário
  (.ics)" gera um arquivo com 3 eventos recorrentes (lembrete da manhã, check-in
  noturno, revisão semanal) que o usuário importa no Google Agenda/Calendário do
  Android. Isso dispara notificações do próprio sistema operacional, independente do
  navegador.
- **Via best-effort (opcional)**: um botão pede permissão de notificação do navegador
  e, enquanto a aba do Governo Interior estiver aberta, uma verificação a cada 30s
  dispara uma `Notification` se o horário configurado bater. Documentado na própria
  tela como não confiável de boot fechado.
- **Push real (não implementado)**: exigiria Push API + service worker escutando
  `push` + um backend capaz de enviar o push nos horários certos (ex.: um cron
  server-side com `web-push`). Ficou de fora desta primeira versão por exigir
  infraestrutura de servidor, que conflita com a proposta 100% local/privacy-first do
  app hoje.

### Estrutura de arquivos

```
src/app/governo-interior/         rotas (App Router) — todas client components
src/components/governo-interior/  UI (Cartao, botões, navegação, ciclo de maturidade…)
src/lib/governo-interior/         domínio: types, db (IndexedDB), datas, maturidade,
                                   classificação de evidências, ICS, export/import
public/governo-interior/sw.js     service worker
public/icons/governo-interior/    ícones do PWA (192/512, any + maskable)
```
