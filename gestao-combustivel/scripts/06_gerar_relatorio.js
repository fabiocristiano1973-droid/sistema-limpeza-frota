const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, Header, Footer, PageNumber,
  LevelFormat, convertInchesToTwip,
} = require('docx');

const data = JSON.parse(fs.readFileSync('dashboard_data.json', 'utf-8'));
const res = data.resumo;
const veiculos = data.veiculos;

const NAVY = '1F3864';
const NAVY_LIGHT = 'D9E1F2';
const GRAY = '595959';
const RED = 'C00000';
const GREEN = '0B6B0B';

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
}
function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 140 } });
}
function bullet(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], bullet: { level: 0 }, spacing: { after: 80 } });
}
function kv(label, value) {
  return new Paragraph({
    children: [new TextRun({ text: label + ':  ', bold: true }), new TextRun({ text: String(value) })],
    spacing: { after: 60 },
  });
}
function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text: String(text), bold: opts.bold || false, color: opts.color, size: opts.size || 19 })],
    })],
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

function fmt(n, d = 0) { return n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtR(n) { return 'R$ ' + fmt(n, 2); }

const kmRep = veiculos.reduce((s, v) => s + v.km_reportado, 0);
const kmTot = veiculos.reduce((s, v) => s + v.km_total, 0);
const lit = veiculos.reduce((s, v) => s + v.litros_reportado, 0);
const custo = veiculos.reduce((s, v) => s + v.custo_total, 0);
const econR = veiculos.reduce((s, v) => s + v.economia_r, 0);
const econL = veiculos.reduce((s, v) => s + v.economia_l, 0);
const kmlFrota = lit > 0 ? kmRep / lit : 0;
const totalBoletim = res.total_validos_presentes_boletim + res.excluidos_total;
const pctValidos = Math.round(100 * res.total_validos_presentes_boletim / totalBoletim);

const anomaliaZero = veiculos.find(v => v.prefixo === 'R7045');
const prioridade = data.prioridade.slice(0, 8);

const tableHeaderRow = (labels, widths) => new TableRow({
  children: labels.map((l, i) => cell(l, { bold: true, color: 'FFFFFF', shade: NAVY, width: widths[i] })),
  tableHeader: true,
});

const rankTable = new Table({
  width: { size: 9350, type: WidthType.DXA },
  columnWidths: [1400, 1600, 3200, 1500, 1650],
  rows: [
    tableHeaderRow(['Prefixo', 'Placa', 'Classificação', 'Km sem reporte', 'Último registro'], [1400, 1600, 3200, 1500, 1650]),
    ...prioridade.map((pr, i) => new TableRow({
      children: [
        cell(pr.prefixo, { width: 1400 }),
        cell(pr.placa, { width: 1600 }),
        cell(pr.classificacao, { width: 3200, color: pr.classificacao.includes('Deixou') || pr.classificacao.includes('Sem reporte') ? RED : undefined }),
        cell(fmt(pr.distancia_dias_tracinho, 1) + ' km', { width: 1500 }),
        cell(pr.ultimo_dia, { width: 1650 }),
      ],
    })),
  ],
});

const classifTable = new Table({
  width: { size: 9350, type: WidthType.DXA },
  columnWidths: [4350, 2000, 3000],
  rows: [
    tableHeaderRow(['Classificação', 'Veículos', '% da frota válida'], [4350, 2000, 3000]),
    ...Object.entries(res.classificacao_contagem).map(([k, v]) => new TableRow({
      children: [
        cell(k, { width: 4350 }),
        cell(v, { width: 2000 }),
        cell((res.classificacao_percentual[k] || 0).toFixed(1) + '%', { width: 3000 }),
      ],
    })),
  ],
});

const kpiTable = new Table({
  width: { size: 9350, type: WidthType.DXA },
  columnWidths: [3350, 3000, 3000],
  rows: [
    new TableRow({ children: [
      cell('Km rodados (dias com reporte)', { bold: true, width: 3350, shade: NAVY_LIGHT }),
      cell('Litros consumidos', { bold: true, width: 3000, shade: NAVY_LIGHT }),
      cell('Km/L real da frota', { bold: true, width: 3000, shade: NAVY_LIGHT }),
    ]}),
    new TableRow({ children: [
      cell(fmt(kmRep) + ' km', { width: 3350, size: 24 }),
      cell(fmt(lit) + ' L', { width: 3000, size: 24 }),
      cell(fmt(kmlFrota, 2) + ' km/L', { width: 3000, size: 24 }),
    ]}),
    new TableRow({ children: [
      cell('Custo total no período (ref.)', { bold: true, width: 3350, shade: NAVY_LIGHT }),
      cell('Economia potencial (litros)', { bold: true, width: 3000, shade: NAVY_LIGHT }),
      cell('Economia potencial (R$)', { bold: true, width: 3000, shade: NAVY_LIGHT }),
    ]}),
    new TableRow({ children: [
      cell(fmtR(custo), { width: 3350, size: 24 }),
      cell(fmt(econL, 0) + ' L', { width: 3000, size: 24, color: GREEN }),
      cell(fmtR(econR), { width: 3000, size: 24, color: GREEN }),
    ]}),
  ],
});

const doc = new Document({
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
    headers: { default: new Header({ children: [new Paragraph({
      children: [new TextRun({ text: 'ROTA Transportes — Itabuna | Gestão de Média de Combustível', size: 16, color: GRAY })],
      alignment: AlignmentType.RIGHT,
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      children: [new TextRun({ text: 'Documento gerado por auditoria de dados — não substitui validação operacional em campo.  Página ', size: 15, color: GRAY }),
        new TextRun({ children: [PageNumber.CURRENT], size: 15, color: GRAY })],
      alignment: AlignmentType.CENTER,
    })] }) },
    children: [
      new Paragraph({ children: [new TextRun({ text: 'RELATÓRIO EXECUTIVO', bold: true, size: 40, color: NAVY })], spacing: { after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: 'Gestão de Média de Combustível — Frota ROTA Transportes / Itabuna', size: 26, color: GRAY })], spacing: { after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: 'Boletim de telemetria: 08/09/2026 a 14/09/2026', size: 20, color: GRAY, italics: true })], spacing: { after: 300 } }),

      h1('1. Contexto e escopo'),
      p('Este relatório analisa o boletim diário de telemetria (média de consumo, distância percorrida e consumo em litros) dos veículos da frota ROTA Transportes em Itabuna, no período de 08/09/2026 a 14/09/2026, cruzado com o cadastro oficial de frota (Base_Frota).'),
      kv('Veículos cadastrados na Base_Frota', res.total_base_frota),
      kv('Veículos válidos com registro no boletim no período', res.total_validos_presentes_boletim),
      kv('Veículos válidos SEM nenhum registro no boletim', res.total_validos_sem_registro_boletim),
      kv('Registros do boletim fora do cadastro (excluídos da análise)', res.excluidos_total),
      p(`O cadastro de frota (Base_Frota) cobre hoje apenas ${pctValidos}% dos ${totalBoletim} veículos que efetivamente circularam sob a operação "ROTA Transportes - Itabuna" na semana — os demais 192 não constam no cadastro oficial e foram preservados numa aba própria (Excluídos), fora da análise principal, sem descartar seus registros originais.`, { color: RED }),

      h1('2. Indicadores de gestão no período'),
      p('Km/L calculado sempre por (km totais ÷ litros totais) dos dias em que a telemetria efetivamente reportou consumo — nunca pela média simples das médias diárias, conforme metodologia solicitada.'),
      kpiTable,
      p(''),
      p('Preço do diesel usado nos cálculos de custo e economia: R$ 6,00/L — valor de referência, pois a base de telemetria não informa o preço efetivamente pago. Ajustar na planilha (aba Metas) pelo preço real do período.', { italics: true, size: 18, color: GRAY }),
      p('Meta de km/L: sugestão inicial calculada como a mediana de km/L do próprio grupo Modelo (Fabricante) × Unidade Operacional nesta semana — não é uma meta corporativa oficial, e deve ser substituída quando a empresa definir seus próprios parâmetros.', { italics: true, size: 18, color: GRAY }),

      h1('3. Continuidade do reporte de telemetria (auditoria de dados)'),
      p('Cada veículo válido foi classificado pela sequência cronológica de reportes de média (numérico = telemetria comunicou; "-" = telemetria não importou o dado naquele registro; zero também conta como reporte).'),
      classifTable,
      p(''),
      p('Achados principais:', { bold: true }),
      bullet(`${res.classificacao_contagem['Deixou de reportar'] || 0} veículo(s) reportaram normalmente e pararam de comunicar a média, permanecendo sem reporte até o fim do período — prioridade máxima de verificação (possível falha de telemetria em curso).`),
      bullet(`${res.classificacao_contagem['Sem reporte em todo o período observado'] || 0} veículo(s) não reportaram nenhuma média numérica na semana inteira, apesar de rodarem — alguns percorreram mais de 2.000 km sem qualquer dado de consumo capturado.`),
      bullet(`${res.classificacao_contagem['Reporte retomado / aparente correção'] || 0} veículo(s) apresentaram uma interrupção pontual (1 dia) seguida de retomada — indício de correção, sem confirmação de manutenção registrada nesta base.`),
      bullet(`${res.classificacao_contagem['Intermitente'] || 0} veículo apresentou múltiplas interrupções e retomadas na mesma semana, padrão que merece investigação de estabilidade do equipamento de telemetria.`),
      bullet(`${res.dias_com_problema_hodometro} registro(s) apresentaram inconsistência de hodômetro (variação incompatível com a distância percorrida no dia) e ${res.placas_corrompidas_no_boletim} registros trazem a placa ilegível/corrompida no arquivo de origem (mesmo veículo, prefixo R7085) — ambos sinalizados, não corrigidos automaticamente.`),

      h1('4. Veículos prioritários para investigação'),
      p('Ordenados por classificação de risco (sem reporte no fim do período primeiro) e por quilometragem rodada sem dado de consumo:'),
      rankTable,

      h1('5. Achado destacado — consumo sem quilometragem'),
      p(`O veículo ${anomaliaZero ? anomaliaZero.prefixo + ' / ' + anomaliaZero.placa : 'R7045 / OUO0218'} reportou média "0,00 Km/L" e distância "0,00 km" em todos os 7 dias do período, mas a telemetria registrou ${anomaliaZero ? fmt(anomaliaZero.litros_reportado, 1) : '856,5'} litros de consumo na semana. Isso é fisicamente incompatível com um veículo parado o tempo todo e sugere falha do sensor de distância/GPS, ou consumo real de uma operação não capturada pelo hodômetro (ex.: geração auxiliar). Não foi atribuída causa mecânica nem responsabilidade a motorista — recomenda-se verificação em campo antes de qualquer ação.`, { color: RED }),

      h1('6. Recomendações e próximos passos'),
      bullet('Atualizar a Base_Frota para cobrir os 192 veículos identificados fora do cadastro oficial (ou confirmar formalmente que não pertencem à frota administrada) — sem isso, ~71% da operação real fica fora de qualquer gestão de eficiência.'),
      bullet('Verificar em campo, com prioridade, os veículos que "deixaram de reportar" e os que rodaram mais de 1.000 km sem nenhum reporte de consumo na semana (lista da seção 4).'),
      bullet('Confirmar a placa correta do prefixo R7085 (registro corrompido em ambas as abas) e investigar a divergência de placas do prefixo R6755 (NZO2423 e NZO4525 na mesma semana).'),
      bullet('Inspecionar o sensor de distância/hodômetro do veículo R7045 (ou equivalente) antes de considerar a média "0,00 Km/L" como rendimento real.'),
      bullet('Definir e inserir a meta oficial de km/L por modelo/operação e o preço real do diesel na aba Metas da planilha, substituindo os valores de referência.'),
      bullet('Repetir esta análise a cada boletim semanal para acompanhar tendência, medir efeito de ações corretivas e manter o painel e a planilha atualizados (ver instruções de atualização no Excel, aba Painel).'),

      h1('7. Limitações desta análise'),
      bullet('Economia potencial é sempre uma estimativa (baseada em meta sugerida e preço de referência), nunca um resultado garantido.'),
      bullet('Dias sem linha no boletim não foram tratados como interrupção de comunicação — apenas os dias efetivamente registrados foram avaliados.'),
      bullet('Nenhuma causa mecânica ou responsabilidade de motorista foi atribuída; todos os achados descrevem padrões de dados que requerem verificação em campo.'),
      bullet('A base cobre apenas uma semana; tendências e recorrência devem ser confirmadas com séries mais longas.'),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('Relatorio_Executivo_Combustivel.docx', buf);
  console.log('done', buf.length, 'bytes');
});
