# Checkpoint técnico — 21/08/2026

Encerramento seguro do dia. Este arquivo é o ponto de partida para retomar amanhã sem
precisar reconstruir contexto.

## Estado do Git

- **Último commit**: `a9a938f` — "feat(producao): adiciona camada Postgres/Supabase em paralelo ao SQLite"
- **Branch**: `master`
- **Working tree**: limpo (`nothing to commit, working tree clean`) — nada pendente, nada não salvo.
- Nenhum push feito hoje nem em nenhum dia anterior — histórico só existe local, sem remoto configurado.

## Funcionalidades concluídas hoje (21/08/2026)

1. Confirmado que a sessão de trabalho passou a rodar no computador pessoal (`DESKTOP-A8U5BLC`),
   com código sincronizado via OneDrive e banco SQLite local íntegro (290 veículos, 5 garagens,
   59 itens de checklist, 6 inspetores, 5 equipes, 1 usuário, 0 inspeções).
2. Construída a camada Postgres/Supabase **em paralelo** à SQLite (nenhuma delas ativa por padrão):
   - `src/lib/db/driver.ts` — decide o driver ativo só pela presença de `DATABASE_URL`.
   - `src/lib/db/postgres.ts` — pool de conexão (`pg`), não instanciado enquanto `DATABASE_URL`
     não existir.
   - `src/lib/repository/postgres-crud-repository.ts` e
     `src/lib/repository/postgres-inspection-repository.ts` — espelham exatamente o
     comportamento das versões SQLite existentes.
   - `src/lib/repository/crud-repository.ts` — ponto único de troca para os cadastros/usuários.
   - `src/lib/repository/cadastros.ts`, `usuarios.ts`, `index.ts` — atualizados para passar pelo
     ponto único de troca (sem mudar nenhuma página/rota).
3. Script `scripts/migrar-para-postgres.mjs` preparado: faz backup do SQLite de origem antes de
   qualquer leitura, copia as 8 tabelas para o Postgres, valida contagem de linhas.
   **Não foi executado.**
4. Validação de qualidade: `tsc --noEmit` limpo, `npm run lint` limpo, `npm run build` limpo,
   boot real do servidor testado numa porta separada (3001, sem interferir no servidor já em uso
   na porta 3000) — guarda de integridade OK, login carregou normalmente.
5. Commit único e coerente: `a9a938f`.

## Arquivos principais criados/alterados hoje

Criados:
- `src/lib/db/driver.ts`
- `src/lib/db/postgres.ts`
- `src/lib/repository/crud-repository.ts`
- `src/lib/repository/postgres-crud-repository.ts`
- `src/lib/repository/postgres-inspection-repository.ts`
- `scripts/migrar-para-postgres.mjs`

Alterados (só o ponto de troca de storage, nenhuma lógica de negócio):
- `src/lib/repository/cadastros.ts`
- `src/lib/repository/usuarios.ts`
- `src/lib/repository/index.ts`
- `package.json` / `package-lock.json` (dependência `pg` adicionada)

## Situação do SQLite

- Íntegro. **Não foi alterado hoje** — só lido (verificação de integridade, backup automático de
  rotina, e o teste de boot numa porta separada).
- Continua sendo o banco ativo em produção local (nenhuma variável `DATABASE_URL` configurada).
- Backup automático de boot mais recente: `backups/auto-boot-2026-08-21T03-05-00-914Z/`.

## Situação da preparação PostgreSQL

- Código pronto e testado (compila, lint limpo, build limpo).
- **Não conectado a nenhum banco real.** `DATABASE_URL` não está configurada em lugar nenhum.
- Nenhuma migração foi executada. Nenhuma credencial foi solicitada, vista ou usada.

## Situação do PWA

- Concluído e funcionando (commit `f09c553`, dia anterior): manifest, ícones, suporte a
  "Adicionar à Tela de Início" no Android e iOS.

## Situação do PDF

- Não iniciado. Fica depois de Supabase Storage + fotos, conforme ordem definida pelo Fábio.

## Situação do Supabase

- Projeto **criado pelo Fábio**.
- No momento deste checkpoint, o provisionamento ainda estava em andamento no painel do Supabase.
- Nenhuma connection string foi compartilhada, vista ou usada nesta sessão.

## Situação da Vercel

- **Não criada, não configurada.** Nenhuma ação tomada.

## Pendências

- Confirmar que o provisionamento do projeto Supabase terminou.
- Revisar o modelo de dados Postgres (schema) com o Fábio antes de qualquer migração real.
- Identificar qual connection string do Supabase usar para migração (porta direta 5432) e qual
  para a aplicação em produção (pooler, porta 6543).
- Fábio precisa cadastrar os segredos (`DATABASE_URL` etc.) localmente — nunca colados na conversa.
- Validar backup do SQLite (rotina já ativa) e contagens de origem antes de qualquer migração.
- Só então preparar um teste de migração — execução real só após autorização explícita.
- Depois: Supabase Storage para fotos, geração de PDF, configuração da Vercel, testes de aceite
  (celular, tablet, 4G/5G, uso simultâneo por dois dispositivos).

## Próximo passo exato para amanhã

Confirmar que o provisionamento do projeto Supabase terminou, e então revisar juntos o modelo de
dados Postgres antes de tocar em qualquer dado real — seguindo a ordem completa definida pelo
Fábio (ver seção "Pendências" acima, itens 1 a 12 da instrução original).

## Regra permanente para esta migração

O objetivo não é "colocar o sistema na nuvem" — é transformar o sistema atual em uma aplicação de
produção segura, rastreável e independente de qualquer notebook, preservando os dados e a lógica
já construída. Antes de qualquer operação irreversível (migração real, deploy, alteração de
dados), parar e pedir autorização explícita do Fábio.
