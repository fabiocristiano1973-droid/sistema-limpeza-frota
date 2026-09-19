# Governo Interior — Princípios em Ação

Aplicação pessoal para descobrir, testar, praticar e incorporar valores e princípios
no dia a dia. **App Next.js totalmente independente** do sistema de limpeza da frota
que vive na raiz deste mesmo repositório — projetos separados, sem nenhuma dependência
funcional entre eles (ver seção "Isolamento" abaixo).

Pergunta central do sistema: **"Que tipo de homem esta decisão está construindo?"**

## Executando

Este diretório é o seu próprio projeto — instale e rode a partir daqui, não da raiz
do repositório:

```bash
cd apps/governo-interior
npm install
npm run dev
```

Abre em `http://localhost:3001` (porta diferente da frota de propósito, para os dois
rodarem juntos localmente sem conflito).

Build de produção:

```bash
npm run build
npm run start
```

Testes:

```bash
npm run test
```

Lint:

```bash
npm run lint
```

## Isolamento em relação ao sistema de limpeza da frota

- **Estrutura própria**: `apps/governo-interior/` tem `package.json`,
  `package-lock.json`, `node_modules`, `tsconfig.json`, `next.config.ts`,
  `eslint.config.mjs`, `.gitignore` e `src/` inteiramente seus. Nada é compartilhado
  com a raiz do repositório.
- **`next.config.ts` fixa `turbopack.root`** explicitamente neste diretório. Sem isso,
  o Turbopack detecta o `package-lock.json` da raiz (do sistema de limpeza) e tenta
  empacotar arquivos de lá (`src/proxy.ts`, `src/instrumentation.ts`) como se fossem
  deste app — foi um bug real encontrado e corrigido durante a migração para este
  layout de monorepo.
- **`tsconfig.json` da raiz do repositório** ganhou `"apps"` em `exclude`, e
  **`eslint.config.mjs` da raiz** ganhou `"apps/**"` nos `globalIgnores` — sem isso, o
  typecheck e o lint do sistema de limpeza tentavam varrer este app (e vice-versa não
  acontece: o typecheck/lint daqui nunca sobe para a raiz). Foram as duas únicas
  alterações feitas em arquivos do sistema de limpeza, e são só configuração de
  ferramentas — nenhuma linha de código/comportamento da frota mudou.
- **Layout raiz, manifest, service worker e dados 100% próprios** — nenhum import
  cruza para `../../src` da frota.
- **Sem login compartilhado**: este app não tem autenticação hoje (uso pessoal,
  single-user, dados só no dispositivo). Se um dia precisar de conta/senha, será uma
  implementação própria aqui dentro — nunca reaproveitando cookies/sessão do sistema
  de limpeza.
- **Times diferentes, acessos diferentes**: como são dois deploys/domínios distintos
  (ver "Deploy" abaixo), a equipe que usa o app da frota nunca tem acesso a este —
  não há link, botão ou rota que leve de um para o outro.

## Deploy independente

Cada app é publicado separadamente. Na Vercel (ou qualquer outra plataforma baseada em
"Root Directory"):

- **Sistema de limpeza da frota**: Root Directory = `.` (raiz do repo) — projeto de
  deploy já existente, sem nenhuma mudança de configuração.
- **Governo Interior**: um projeto de deploy **novo**, com Root Directory =
  `apps/governo-interior`. Instalação e build usam o `package.json` deste diretório.

Publicar um não publica nem afeta o outro — são domínios/URLs diferentes.

## Arquitetura de dados

- **100% local, privacy-first**: tudo fica no IndexedDB do navegador
  (`src/lib/db.ts`, usando a lib `idb`). Não existe nenhuma API route neste app — sem
  backend, sem coleta de dados.
- **Backup/exportação**: em Configurações → "Exportar todos os dados (.json)" gera um
  arquivo com valores, princípios, situações, conflitos, seleções semanais, revisões
  semanais e configuração de lembretes. "Importar backup" lê esse mesmo formato e
  **substitui** os dados atuais do dispositivo (pede confirmação antes).
- **Sincronização futura em nuvem**: a camada `src/lib/db.ts` concentra todo o acesso
  a dados atrás de funções simples (`listarX`, `criarX`, `salvarX`, `excluirX`) —
  trocar IndexedDB por Supabase/PostgreSQL no futuro significa reimplementar só esse
  arquivo. Há um `.env.example` já preparado para as variáveis desse cenário.
- **Datas**: sempre exibidas como `DD/MM/AAAA` (nunca `AAAA-MM-DD`) via
  `src/lib/date.ts`; o formato `AAAA-MM-DD` só é usado internamente nos
  `<input type="date">`, que o próprio navegador exige nesse formato.

## Lembretes e notificações — o que é confiável e o que não é

O Android/Chrome **não garante** disparo de notificações agendadas por uma PWA comum
(sem push real) quando o app está fechado. Para não fingir uma confiabilidade que não
existe:

- **Via confiável (recomendada)**: Configurações → "Baixar lembretes para o calendário
  (.ics)" gera um arquivo com 3 eventos recorrentes (lembrete da manhã, check-in
  noturno, revisão semanal) para importar no Google Agenda/Calendário do Android.
- **Via best-effort (opcional)**: pede permissão de notificação do navegador e, com a
  aba aberta, dispara `Notification` no horário configurado. Documentado como não
  confiável de boot fechado.
- **Push real**: não implementado — exigiria Push API + service worker + backend, o
  que conflita com a proposta 100% local/privacy-first de hoje.

## Instalando como PWA

1. Abra o app no Chrome do Android.
2. Menu (⋮) → **Adicionar à tela inicial**.
3. Abre em modo `standalone`, com ícone e nome do Governo Interior — nada do sistema
   de limpeza aparece.

## Estrutura de arquivos

```
apps/governo-interior/
├── package.json              próprio, independente da raiz
├── next.config.ts            fixa turbopack.root neste diretório
├── src/app/                  rotas (App Router) — client components + manifest.ts
├── src/components/           UI (Cartao, botões, navegação, ciclo de maturidade…)
├── src/lib/                  domínio: types, db (IndexedDB), datas, maturidade,
│                              classificação de evidências, ICS, export/import
├── public/sw.js               service worker (escopo "/")
├── public/icons/               ícones do manifest (192/512, any + maskable)
└── scripts/gerar-icones.mjs    script (usa sharp, não é dependência do projeto)
```
