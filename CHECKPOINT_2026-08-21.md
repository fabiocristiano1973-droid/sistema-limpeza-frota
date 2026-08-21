# Checkpoint técnico — 21/08/2026 (fim do dia)

Dia de virada de chave: o sistema saiu de "roda só no meu computador" para **produção real, na
nuvem, funcionando de qualquer lugar**. Este arquivo é o ponto de partida pra retomar depois sem
precisar reconstruir contexto — qualquer sessão de IA (Claude Code, ChatGPT) deve ler isto
primeiro.

## Estado do Git

- **Último commit**: `c7b58f4` — "fix(auth): usa SESSION_SECRET de variavel de ambiente na Vercel"
- **Branch**: `main` (renomeada de `master` hoje, pra bater com o padrão do GitHub/Vercel)
- **Working tree**: limpo.
- **Novidade de hoje**: o projeto agora tem um repositório remoto real —
  `https://github.com/fabiocristiano1973-droid/sistema-limpeza-frota` (público — considerar
  trocar pra privado). Antes disso, o histórico só existia local; a partir de hoje, todo `git
  push` envia pra lá, e é esse repositório que a Vercel usa pra implantar automaticamente a cada
  push na `main`.

## O que foi concluído hoje (lista completa, em ordem)

1. **Migração real de dados**: SQLite local → Postgres/Supabase, executada e validada (contagens
   batendo em ambos os lados, conferido por dois caminhos independentes). 290 veículos, 59 itens
   de checklist, 6 inspetores, 5 equipes, 5 garagens, 5 tipos de limpeza, 1 usuário migrados sem
   perda. Backup do SQLite de origem preservado antes da migração
   (`backups/pre-migracao-postgres-*` e `backups/dump-para-migracao/`).
2. **Ajustes de produção no código**: cookie de sessão vira `secure` automaticamente na Vercel
   (sem quebrar o uso local em HTTP); guarda de integridade e backup automático do SQLite se
   desligam sozinhos quando o driver ativo é Postgres; `SESSION_SECRET` passou a vir de variável
   de ambiente em vez de arquivo local (esse arquivo não existiria/persistiria num ambiente
   serverless).
3. **Geração de PDF do relatório de inspeção**: nova (não existia antes de hoje). Botão "Baixar
   relatório em PDF" na tela de cada inspeção, testado com dados reais e confirmado pelo Fábio em
   produção.
4. **Conta GitHub criada** (`fabiocristiano1973-droid`), repositório criado, código enviado.
5. **Conta Vercel criada**, projeto importado do GitHub, variáveis de ambiente configuradas
   (`DATABASE_URL` — pooler do Supabase, porta 6543; `SESSION_SECRET` — chave aleatória gerada
   hoje), deploy concluído com sucesso.
6. **Testado em produção, de ponta a ponta, pelo Fábio**: celular, Wi-Fi desligado (só 4G/5G),
   login, inspeção nova completa com foto real pela câmera, finalização, download do PDF — tudo
   funcionando. Confirmado independentemente direto no banco (inspeção do veículo 5125/JQC9404,
   58 itens, salva via app em produção).

## Situação de cada frente

- **SQLite local**: continua intacto, é a cópia "histórica" — não é mais o banco ativo em
  produção, mas segue funcionando localmente se `DATABASE_URL` não estiver setada no ambiente.
- **PostgreSQL/Supabase**: **é o banco ativo em produção agora.** Projeto Supabase
  (`zuuaqndvipekivonhabj`), status saudável.
- **Vercel**: **implantado e funcionando.** URL pública:
  `https://sistema-limpeza-frota.vercel.app`. Deploy automático a cada `git push` na `main`.
- **PWA**: concluído (dia anterior), "Adicionar à Tela de Início" funciona em Android/iOS.
- **PDF**: concluído hoje, testado e confirmado em produção.
- **GitHub**: repositório criado e conectado, `fabiocristiano1973-droid/sistema-limpeza-frota`,
  atualmente **público** (considerar trocar pra privado, é sistema interno da empresa).

## Critérios de aceite do Fábio (10 originais) — status

1. Funciona por endereço HTTPS fixo — ✅ confirmado.
2. Celular funciona fora da rede de casa/empresa (4G/5G) — ✅ confirmado hoje, com inspeção real completa.
3. Tablet completa o checklist — não testado ainda.
4. Dado sobrevive a reinício/logout/novo acesso — ✅ (Postgres é persistente, não depende de processo local).
5. Fotos permanecem corretamente vinculadas — ✅ confirmado (foto real da câmera, salva e visível na inspeção).
6. PDF do relatório gerado corretamente — ✅ confirmado em produção.
7. Dois dispositivos usando ao mesmo tempo sem corromper dado — não testado ainda (Postgres deve
   lidar bem com isso nativamente, mas não foi validado na prática).
8. Desligar o notebook do Fábio não derruba o sistema pra equipe — ✅ por construção (Vercel é
   independente de qualquer máquina do Fábio).
9. Usuário não precisa de IP nem configuração técnica — ✅ confirmado.

## Pendências reais (nada bloqueante, tudo incremental a partir daqui)

- Trocar o repositório GitHub de Público pra Privado.
- Resetar a senha do banco no Supabase (a original ficou exposta no histórico do chat mais cedo
  hoje — funciona normalmente, mas é boa prática trocar; lembrar de atualizar `DATABASE_URL` no
  `.env.local` e nas variáveis de ambiente da Vercel depois).
- Testar em tablet.
- Testar dois dispositivos simultâneos.
- Migrar fotos de base64-inline-no-JSON pra Supabase Storage (funciona do jeito atual, mas é o
  próximo passo de escala/performance quando o volume real de uso crescer).
- Limpar a inspeção de teste (veículo 5125/JQC9404, 21/08/2026 ~20:44) do banco de produção antes
  de começar o uso real pela equipe — não existe botão de exclusão na interface (decisão de
  design: nunca apagar inspeção com histórico); a forma mais simples é apagar essa linha
  específica direto pelo Table Editor do Supabase (tabela `inspecoes`), já que é dado de teste,
  não operacional.
- Decidir o que fazer com o watchdog local (`scripts/start-prod.ps1`) — não é mais necessário
  como infraestrutura de produção, mas pode continuar existindo como acesso local de
  desenvolvimento/testes.

## Regra permanente (continua valendo)

O objetivo não foi só "colocar o sistema na nuvem" — foi transformar o sistema numa aplicação de
produção segura, rastreável e independente de qualquer notebook, preservando os dados e a lógica
já construída. Isso foi alcançado hoje. Daqui pra frente: qualquer alteração de schema, migração
de dado real ou operação irreversível continua exigindo backup prévio e autorização explícita do
Fábio antes de executar.
