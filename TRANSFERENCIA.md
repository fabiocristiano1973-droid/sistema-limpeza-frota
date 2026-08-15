# Transferência para computador pessoal — Sistema de Inspeção e Liberação da Limpeza da Frota

Preparado em 2026-08-15, commit `7360ae7` (branch `master`, `git status` limpo no momento desta cópia).

---

## 1. O que copiar (duas cópias separadas — leia com atenção)

O projeto tem **duas partes que vivem em lugares diferentes no disco**, de propósito (ver seção "Regras fixas" abaixo). As duas precisam ir pro HD, senão você leva o código mas fica sem os dados reais.

### 1a. Pasta do projeto (código + histórico do Git + backups)

Origem: `C:\Users\Rota\OneDrive\Meus Documentos Pessoais\Sistema_Limpeza_Frota`

Copiar **tudo**, incluindo `.git` (preserva todo o histórico de commits) e `backups\` (preserva as evidências dos incidentes e os pontos de restauração), **exceto** `node_modules` e `.next` (build e dependências — são recriados no destino, não faz sentido carregar).

Comando (ajuste `D:\` para a letra do seu HD):

```powershell
robocopy "C:\Users\Rota\OneDrive\Meus Documentos Pessoais\Sistema_Limpeza_Frota" "D:\Sistema_Limpeza_Frota" /E /XD node_modules .next /R:2 /W:5
```

### 1b. Dados reais do banco (FORA da pasta do projeto — não esqueça)

Origem: `C:\Users\Rota\AppData\Local\SistemaLimpezaFrota`

Contém o banco SQLite real (290 veículos, cadastros, inspeções), o segredo de sessão e os logs. Isso **não está** dentro da pasta acima nem no Git — é onde ficam os dados de verdade.

```powershell
robocopy "C:\Users\Rota\AppData\Local\SistemaLimpezaFrota" "D:\SistemaLimpezaFrota-dados" /E /R:2 /W:5
```

No computador pessoal, depois de instalar o projeto, copie o conteúdo de `D:\SistemaLimpezaFrota-dados` para `%LOCALAPPDATA%\SistemaLimpezaFrota` (o app cria essa pasta sozinho se não existir, mas criaria um banco novo vazio — você quer copiar o banco real por cima antes do primeiro `npm run dev`).

### O que NÃO precisa levar
- `node_modules/` — reinstala com `npm install` no destino.
- `.next/` — recriado automaticamente ao rodar `npm run dev` ou `npm run build`.

---

## 2. Depois de copiar, no computador pessoal

```bash
cd Sistema_Limpeza_Frota
npm install
npm run dev
```

Abre em `http://localhost:3000`. Login: `admin` + a senha que você definiu por último.

**Sobre não ser administrador nessa máquina** — o que funciona sem admin e o que não funciona:
- ✅ `npm install`, `npm run dev`/`build`/`start` — não precisam de admin.
- ✅ Atalho de início automático (pasta Startup **do seu usuário**, não a de todos os usuários) — não precisa de admin.
- ❌ Regra de firewall pra liberar acesso de outros dispositivos na rede — precisa de admin. Sem isso, o app funciona normalmente no próprio computador, só não vai ser acessível por celular/outros dispositivos na rede até alguém com admin liberar.
- ❌ Exclusão do Windows Defender (ver pendência abaixo) — precisa de admin.

---

## 3. O que já está implementado (funcionando, testado, commitado)

- **Checklist de inspeção** com fluxo físico reorganizado (8 etapas: Externo/Bagageiro → Entrada Dianteira → Cabine → Acesso ao Salão → Salão/Corredor → Bebedouro → Banheiro → Acabamento, + Finalização).
- **Evidência obrigatória em Bebedouro** — 2 fotos obrigatórias + seleção de aparência da água (com Não Conformidade automática se a água não estiver "Normal/límpida").
- **Evidência obrigatória em Banheiro** — 4 fotos obrigatórias (reservatório, descarga, guilhotina da porta, guilhotina da descarga).
- **Autenticação evoluída**: administrador cria usuários e reseta senha de qualquer um; senha provisória força troca no primeiro acesso (bloqueia qualquer outra tela até trocar); qualquer usuário troca a própria senha a qualquer momento; perfis (Inspetor/Encarregado, Gestor, Administrador) preservados, incluindo a regra de que só Administrador acessa Cadastros.
- **Guarda de integridade** (`src/lib/db/integrity-guard.ts`) — verifica na inicialização e periodicamente se as tabelas críticas existem e têm dados; bloqueia a interface inteira com um alerta visível em vez de deixar o app recriar dados fictícios por cima de uma perda.
- **Backup automático reforçado** — a cada boot do watchdog e a cada 15 minutos, retendo os 48 mais recentes.

## 4. Pendências de investigação (não estão resolvidas — não finja que estão)

### 4a. Atraso de leitura do banco pós-reinício (mitigado, causa não confirmada)
Depois de um reinício abrupto do processo (reboot do Windows, ou o processo cair), o banco fica temporariamente ilegível por até ~90 segundos antes de voltar a funcionar sozinho — sem perda de dado nenhuma, só demora. A suspeita mais forte é o Windows Defender escaneando o arquivo em tempo real, mas **não foi confirmado** (não dá pra confirmar por log, e a exclusão do Defender ainda não foi aplicada em lugar nenhum). Mitigação atual: pausa + retry de leitura pura por até 90s, com tela "Verificando integridade dos dados..." em vez de travar ou assustar à toa. Histórico completo de tentativas (o que já foi tentado e descartado) está comentado direto no código, em `verificarIntegridadeBanco()`.

**Se o mesmo atraso aparecer no computador pessoal:** primeiro tente excluir a pasta de dados do Defender (`Add-MpPreference -ExclusionPath "$env:LOCALAPPDATA\SistemaLimpezaFrota"`, como administrador). Se não resolver, o próximo passo é investigar com o Process Monitor (Sysinternals), ao vivo, durante um reboot.

### 4b. Perda de dados real, recorrente — CAUSA RAIZ AINDA DESCONHECIDA (o mais sério)
**Diferente do item 4a.** Em pelo menos 3-4 ocasiões (14/08 e três vezes em 15/08, incluindo uma vez em pleno funcionamento normal, sem reinício nenhum), o arquivo do banco foi reduzido de verdade a um esqueleto vazio (só a tabela `usuarios`, sem dados). Todas as vezes foram restauradas com sucesso a partir de backups íntegros, sem perda definitiva — mas a causa nunca foi confirmada. Já descartado com evidência: lógica do próprio app (`getDb()`, `sqlite.ts` — não tem nenhuma migration/DROP/seed que explique isso), watchdog (`start-prod.ps1` — só sobe/reinicia processo), dois watchdogs concorrentes, Agendador de Tarefas do Windows, service worker. AnyDesk (acesso remoto) estava configurado pra iniciar automaticamente e foi removido por precaução, mas nunca foi confirmado nem descartado como causa.

**Isso é a prioridade #1 antes de considerar o sistema pronto pra uso real da frota.** Evidências de todos os incidentes preservadas em `backups\` (pastas com prefixo `incidente-`, `estado-vazio-`).

## 5. Regras fixas do projeto — não quebrar, em nenhuma refatoração futura

- **Nunca excluir fisicamente um registro com histórico.** Status `INATIVO` existe pra isso — exclusão física só é aceitável pra dado que nunca foi usado em nenhuma inspeção.
- **Snapshot de inspeção é imutável.** Uma vez finalizada, uma inspeção nunca é recalculada a partir dos cadastros atuais — ela guarda sua própria cópia de categoria/nome/criticidade no momento em que foi feita. Mudar um item do checklist depois nunca deve alterar como uma inspeção antiga aparece.
- **Nunca recriar dado fictício silenciosamente.** Se uma tabela que já devia ter dados reais aparecer vazia, o sistema bloqueia e avisa — nunca preenche sozinho com dados de exemplo por cima de uma possível perda real (é exatamente o que a guarda de integridade do item 3 faz).
- **Banco de dados fora da pasta sincronizada (OneDrive/Git).** Já causou EPERM de sincronização antes — é por isso que os dados reais vivem em `%LOCALAPPDATA%`, não dentro do projeto.
- **Backup antes de qualquer alteração em banco ou autenticação.** Todo script administrativo em `scripts/` segue esse padrão — replicar em qualquer script novo.
