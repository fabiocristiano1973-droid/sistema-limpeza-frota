# Gestão de Média de Combustível — ROTA Transportes / Itabuna

Sistema de gestão de eficiência de combustível construído a partir do boletim
diário de telemetria (`Boletim_do_Veiculo_2026-09-08_2026-09-14.xlsx`), período
**08/09/2026 a 14/09/2026**.

## O que tem aqui

```
gestao-combustivel/
├── planilha/
│   └── Gestao_Media_Combustivel_ROTA_Itabuna.xlsx   ← planilha completa (fórmulas vivas)
├── dashboard/
│   └── index.html                                    ← painel interativo (abrir no navegador)
├── relatorios/
│   ├── Relatorio_Executivo_Combustivel.docx          ← relatório curto para leitura
│   └── Apresentacao_Diretoria_Combustivel.pptx       ← apresentação resumida (9 slides)
└── scripts/                                          ← pipeline para regenerar tudo com um novo boletim
```

Todos os quatro entregáveis (planilha, painel, relatório, apresentação) usam a
**mesma base de dados** e os mesmos números — não são análises independentes.

## Planilha (`planilha/Gestao_Media_Combustivel_ROTA_Itabuna.xlsx`)

Abas, na ordem:

| Aba | Conteúdo |
|---|---|
| `Boletim_do_Veiculo_2026-09-08_2` | **Original, intacta**, com 5 colunas de apoio acrescentadas ao final (BM:BQ) para permitir os cálculos por fórmula |
| `Base_Frota` | **Original, intacta** — cadastro oficial da frota |
| `Metas` | Preço do diesel (input) e meta de km/L por Modelo × Unidade Operacional (input, sugestão inicial editável) |
| `Analise_Consumo` | Uma linha por veículo válido: km, litros, km/L real, meta, desvio, custo/km, custo total, economia potencial em litros e R$ — **tudo por fórmula** (SUMIFS/COUNTIFS sobre o boletim) |
| `Painel` | KPIs executivos, comparação por unidade, ranking de oportunidades — também por fórmula |
| `Análise por Veículo` | Classificação de continuidade do reporte de telemetria (uma linha por veículo, regras do estudo) |
| `Ocorrências` | Evidências (data/veículo/média/distância) de cada interrupção e retomada de reporte |
| `Excluídos` | Veículos do boletim que não constam na Base_Frota (192), com motivo |
| `Sem_Registro_Boletim` | Veículos da Base_Frota sem nenhum registro no boletim (10) |
| `Resumo` | Totais, percentuais por classificação, lista prioritária e regras/limitações da análise |

**Como km/L é calculado:** sempre `km totais ÷ litros totais` nos dias em que a
telemetria reportou consumo — nunca a média simples das médias diárias.

**Cores:** azul + fundo amarelo = célula para você editar (preço do diesel,
metas). Preto = fórmula. Não edite células pretas.

### Como atualizar com um novo boletim

1. Abra a planilha, vá até a aba `Metas` e confirme/ajuste o preço do diesel e
   as metas de km/L (elas não mudam sozinhas quando você troca o boletim).
2. Para o **próximo boletim semanal**, o caminho mais simples é gerar uma nova
   planilha do zero com o script `scripts/04_gerar_planilha.py` (veja abaixo) —
   ele recria as mesmas 8 abas automaticamente a partir do novo arquivo.
3. Se preferir atualizar a planilha atual manualmente: substitua os dados da
   aba do boletim mantendo as mesmas colunas (A a BK) e o mesmo cabeçalho na
   linha 1; as colunas de apoio (BM:BQ) e a aba `Analise_Consumo` recalculam
   sozinhas ao reabrir o arquivo no Excel. As abas `Análise por Veículo`,
   `Ocorrências`, `Excluídos`, `Sem_Registro_Boletim` e `Resumo` **não**
   recalculam sozinhas (são resultado de uma auditoria sequencial, não dá para
   fazer isso só com fórmulas) — para atualizá-las, rode o pipeline de scripts.

### Como testei

- Todas as ~9.350 fórmulas foram recalculadas no LibreOffice (`recalc.py`):
  **0 erros** (`#DIV/0!`, `#VALUE!`, `#NAME?`, etc.).
- Os totais de km e litros da aba `Analise_Consumo`/`Painel` foram conferidos
  célula a célula contra o cálculo independente feito em Python
  (`scripts/03_exportar_dados_painel.py`) — batem exatamente.
- Casos de borda testados manualmente: veículo sem nenhum dia com reporte
  (`km/L` mostra "Sem dados", não erro), veículo com litros > 0 e km = 0
  (`custo por km` tratado, não gera `#DIV/0!`), placa corrompida no arquivo
  original (prefixo R7085 — tratado e sinalizado, não quebra o cruzamento).

## Painel HTML (`dashboard/index.html`)

Arquivo único, sem dependência de internet — funciona abrindo direto no
navegador, em notebook ou celular (testado em 1400px e 390px de largura).

- **Filtros**: unidade (setor), modelo/fabricante, classificação de reporte,
  busca por placa/prefixo — todos os gráficos, KPIs, mapa de calor e tabelas
  reagem em tempo real.
- **Mapa de calor**: continuidade do reporte por veículo × dia (verde =
  reportou, vermelho = tracinho, cinza = sem registro naquele dia).
- **Ranking de oportunidades**: top 15 por economia potencial estimada.
- **Tabela completa**: 79 veículos, ordenável por qualquer coluna.

### Como atualizar o painel

O painel carrega os dados embutidos no próprio HTML (não faz requisição de
rede), então é preciso gerar um novo arquivo a cada boletim:

```bash
cd scripts
python3 01_cruzar_boletim_frota.py        # cruza boletim × Base_Frota
python3 02_classificar_veiculos.py        # classifica continuidade de reporte
python3 03_exportar_dados_painel.py       # gera dashboard_data.json
python3 08_injetar_dados_painel.py        # gera painel_combustivel.html
cp painel_combustivel.html ../dashboard/index.html
```

## Relatório executivo e apresentação (`relatorios/`)

- `Relatorio_Executivo_Combustivel.docx` — 3 páginas, contexto, indicadores,
  achados de continuidade de reporte, veículos prioritários, recomendações e
  limitações.
- `Apresentacao_Diretoria_Combustivel.pptx` — 9 slides, mesma base de dados,
  com gráficos nativos do PowerPoint (editáveis).

Para regenerar depois de rodar os scripts 01-03 acima:

```bash
cd scripts
npm install docx pptxgenjs   # primeira vez apenas
node 06_gerar_relatorio.js
node 07_gerar_apresentacao.js
cp Relatorio_Executivo_Combustivel.docx Apresentacao_Diretoria_Combustivel.pptx ../relatorios/
```

## Principais achados desta rodada (08/09 a 14/09/2026)

- **Base_Frota desatualizada**: cobre só 29% (79 de 271) dos veículos que
  rodaram na semana sob a mesma operação — os outros 192 estão fora de
  qualquer gestão de eficiência até o cadastro ser corrigido.
- **14 veículos válidos** (18%) pararam de reportar ou não reportaram nenhuma
  média na semana inteira, alguns rodando mais de 2.000 km sem dado de
  consumo algum.
- **Achado que precisa verificação em campo**: veículo R7045/OUO0218 registrou
  856,5 L de consumo com 0,00 km e 0,00 Km/L em todos os 7 dias — incompatível
  fisicamente, sugere falha de sensor de distância/GPS, não rendimento real.
- **Economia potencial estimada**: R$ 14.866,20 (≈2.478 L) se os veículos
  abaixo da meta sugerida atingissem o km/L mediano do próprio grupo — número
  é uma estimativa, não uma garantia, e depende de meta oficial e preço real
  do diesel serem inseridos na aba `Metas`.

Nenhuma causa mecânica nem responsabilidade de motorista foi atribuída em
nenhum dos achados — todos descrevem padrões nos dados que pedem verificação
em campo.
