const fs = require('fs');
const pptxgen = require('pptxgenjs');

const data = JSON.parse(fs.readFileSync('dashboard_data.json', 'utf-8'));
const res = data.resumo;
const veiculos = data.veiculos;

const NAVY = '1E2761';
const NAVY2 = '141B4D';
const ICE = 'CADCFC';
const WHITE = 'FFFFFF';
const INK = '1B1B1B';
const MUTED = '6B7280';
const GOOD = '0CA30C';
const CRIT = 'C0392B';
const WARN = 'B97A00';
const CARD = 'F3F5FB';

function fmt(n, d = 0) { return n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtR(n) { return 'R$ ' + fmt(n, 2); }
function fmtData(iso) { const [a, m, dd] = iso.split('-'); return `${dd}/${m}/${a}`; }

const kmRep = veiculos.reduce((s, v) => s + v.km_reportado, 0);
const lit = veiculos.reduce((s, v) => s + v.litros_reportado, 0);
const custo = veiculos.reduce((s, v) => s + v.custo_total, 0);
const econR = veiculos.reduce((s, v) => s + v.economia_r, 0);
const econL = veiculos.reduce((s, v) => s + v.economia_l, 0);
const kmlFrota = lit > 0 ? kmRep / lit : 0;
const totalBoletim = res.total_validos_presentes_boletim + res.excluidos_total;
const pctValidos = Math.round(100 * res.total_validos_presentes_boletim / totalBoletim);
const anomaliaZero = veiculos.find(v => v.prefixo === 'R7045');
const prioridade = data.prioridade.slice(0, 6);

const setores = [...new Set(veiculos.map(v => v.setor))].sort();
const setorAgg = setores.map(s => {
  const rows = veiculos.filter(v => v.setor === s);
  const km = rows.reduce((a, v) => a + v.km_reportado, 0);
  const l = rows.reduce((a, v) => a + v.litros_reportado, 0);
  return { setor: s, kml: l > 0 ? km / l : 0 };
});

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.3 x 7.5
const W = 13.33, H = 7.5;

function bgSlide(dark) {
  const s = pres.addSlide();
  s.background = { color: dark ? NAVY : WHITE };
  return s;
}

function footer(s, dark, pageLabel) {
  s.addText('ROTA Transportes · Itabuna — Gestão de Média de Combustível', {
    x: 0.5, y: H - 0.42, w: 8, h: 0.3, fontFace: 'Calibri', fontSize: 9,
    color: dark ? '93A3D6' : MUTED, align: 'left', margin: 0,
  });
  s.addText(pageLabel || '', {
    x: W - 3.5, y: H - 0.42, w: 3, h: 0.3, fontFace: 'Calibri', fontSize: 9,
    color: dark ? '93A3D6' : MUTED, align: 'right', margin: 0,
  });
}

// ---------- Slide 1: Title ----------
{
  const s = bgSlide(true);
  s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: NAVY } });
  s.addShape('ellipse', { x: 9.6, y: -2.2, w: 7, h: 7, fill: { color: NAVY2 }, line: { type: 'none' } });
  s.addShape('ellipse', { x: 11.4, y: 4.6, w: 4.2, h: 4.2, fill: { color: NAVY2 }, line: { type: 'none' } });
  s.addText('GESTÃO DE FROTA · TELEMETRIA', { x: 0.9, y: 1.5, w: 8, h: 0.4, fontFace: 'Calibri', fontSize: 13, color: ICE, charSpacing: 3, bold: true, margin: 0 });
  s.addText('Gestão de Média de\nCombustível', {
    x: 0.85, y: 2.0, w: 9.5, h: 2.3, fontFace: 'Cambria', fontSize: 44, bold: true, color: WHITE, margin: 0, lineSpacing: 48,
  });
  s.addText('ROTA Transportes — Itabuna', { x: 0.9, y: 4.35, w: 8, h: 0.5, fontFace: 'Calibri', fontSize: 20, color: ICE, margin: 0 });
  s.addText('Boletim de telemetria: 08/09/2026 a 14/09/2026  ·  Apresentação executiva', {
    x: 0.9, y: 4.85, w: 9, h: 0.4, fontFace: 'Calibri', fontSize: 13, color: '9FB0DE', margin: 0,
  });
  footer(s, true, '');
}

// ---------- Slide 2: Contexto ----------
{
  const s = bgSlide(false);
  s.addText('Contexto e objetivo', { x: 0.6, y: 0.5, w: 10, h: 0.6, fontFace: 'Cambria', fontSize: 30, bold: true, color: NAVY, margin: 0 });
  s.addText('O que foi analisado e por quê', { x: 0.6, y: 1.1, w: 10, h: 0.4, fontFace: 'Calibri', fontSize: 14, color: MUTED, margin: 0 });

  const items = [
    ['Fonte de dados', 'Boletim diário de telemetria (média de consumo, distância, litros) cruzado com o cadastro oficial de frota (Base_Frota).'],
    ['Período', '08/09/2026 a 14/09/2026 — confirmado pelas datas dos registros, sem divergência.'],
    ['Metodologia de km/L', 'Sempre km totais ÷ litros totais nos dias com reporte — nunca a média das médias diárias.'],
    ['Objetivo', 'Medir eficiência real, identificar oportunidades de economia e auditar a continuidade do reporte de telemetria.'],
  ];
  let y = 1.75;
  items.forEach(([label, text]) => {
    s.addShape('roundRect', { x: 0.6, y, w: 0.14, h: 0.14, fill: { color: NAVY }, line: { type: 'none' }, rectRadius: 0.03 });
    s.addText(label, { x: 0.95, y: y - 0.08, w: 3, h: 0.3, fontFace: 'Calibri', fontSize: 14, bold: true, color: NAVY, margin: 0 });
    s.addText(text, { x: 4.1, y: y - 0.1, w: 8.6, h: 0.7, fontFace: 'Calibri', fontSize: 13, color: INK, margin: 0, valign: 'top' });
    y += 1.05;
  });

  s.addShape('roundRect', { x: 0.6, y: 6.05, w: 12.1, h: 1.0, fill: { color: 'FDEDEA' }, line: { type: 'none' }, rectRadius: 0.08 });
  s.addText([
    { text: `Achado de governança de dados:  `, options: { bold: true, color: CRIT } },
    { text: `o cadastro oficial (Base_Frota) cobre apenas ${pctValidos}% dos ${totalBoletim} veículos que efetivamente rodaram na semana sob a mesma operação. Os demais ${res.excluidos_total} veículos ficam fora de qualquer gestão de eficiência até o cadastro ser atualizado.`, options: { color: INK } },
  ], { x: 0.85, y: 6.15, w: 11.6, h: 0.85, fontFace: 'Calibri', fontSize: 12.5, margin: 0, valign: 'middle' });
  footer(s, false, '2');
}

// ---------- Slide 3: KPIs ----------
{
  const s = bgSlide(true);
  s.addText('A frota em números', { x: 0.6, y: 0.5, w: 10, h: 0.6, fontFace: 'Cambria', fontSize: 30, bold: true, color: WHITE, margin: 0 });
  s.addText('Indicadores consolidados do período — veículos válidos (Base_Frota)', { x: 0.6, y: 1.12, w: 11, h: 0.4, fontFace: 'Calibri', fontSize: 14, color: '9FB0DE', margin: 0 });

  const kpis = [
    ['Km rodados', fmt(kmRep), 'dias com reporte'],
    ['Litros consumidos', fmt(lit), 'telemetria'],
    ['Km/L real da frota', fmt(kmlFrota, 2), 'km ÷ litros'],
    ['Custo total (ref.)', fmtR(custo), 'a R$ 6,00/L'],
    ['Economia potencial', fmtR(econR), fmt(econL, 0) + ' L estimados'],
    ['Sem reporte / pararam', String((res.classificacao_contagem['Deixou de reportar'] || 0) + (res.classificacao_contagem['Sem reporte em todo o período'] || 0)), `de ${res.total_validos_presentes_boletim} veículos`],
  ];
  const cw = 3.9, ch = 2.0, gx = 0.25, gy = 0.25, x0 = 0.6, y0 = 1.95;
  kpis.forEach((k, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = x0 + col * (cw + gx), y = y0 + row * (ch + gy);
    s.addShape('roundRect', { x, y, w: cw, h: ch, fill: { color: NAVY2 }, line: { type: 'none' }, rectRadius: 0.1 });
    s.addText(k[0], { x: x + 0.25, y: y + 0.2, w: cw - 0.5, h: 0.35, fontFace: 'Calibri', fontSize: 12.5, color: '9FB0DE', margin: 0 });
    s.addText(k[1], { x: x + 0.25, y: y + 0.55, w: cw - 0.5, h: 0.85, fontFace: 'Calibri', fontSize: 30, bold: true, color: WHITE, margin: 0 });
    s.addText(k[2], { x: x + 0.25, y: y + 1.45, w: cw - 0.5, h: 0.35, fontFace: 'Calibri', fontSize: 11, color: '9FB0DE', margin: 0 });
  });
  footer(s, true, '3');
}

// ---------- Slide 4: km/L por setor (native chart) ----------
{
  const s = bgSlide(false);
  s.addText('km/L real por Unidade Operacional', { x: 0.6, y: 0.5, w: 11, h: 0.6, fontFace: 'Cambria', fontSize: 28, bold: true, color: NAVY, margin: 0 });
  s.addText('Comparação entre grupos operacionais equivalentes (km ÷ litros)', { x: 0.6, y: 1.12, w: 11, h: 0.4, fontFace: 'Calibri', fontSize: 13, color: MUTED, margin: 0 });

  s.addChart(pres.ChartType.bar, [{
    name: 'km/L real',
    labels: setorAgg.map(d => d.setor),
    values: setorAgg.map(d => Number(d.kml.toFixed(2))),
  }], {
    x: 0.7, y: 1.75, w: 7.3, h: 4.9,
    barDir: 'col', chartColors: [NAVY],
    showTitle: false, showLegend: false,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: NAVY, dataLabelFontSize: 13, dataLabelFontBold: true,
    dataLabelFormatCode: '0.00',
    catAxisLabelColor: INK, catAxisLabelFontSize: 12,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 10, valAxisTitle: 'km/L', showValAxisTitle: true,
    valAxisLabelFormatCode: '0.00',
    valGridLine: { color: 'E5E7EB', size: 0.75 }, catGridLine: { style: 'none' },
    barGapWidthPct: 60,
  });

  s.addShape('roundRect', { x: 8.35, y: 1.75, w: 4.35, h: 4.9, fill: { color: CARD }, line: { type: 'none' }, rectRadius: 0.1 });
  s.addText('Leitura', { x: 8.65, y: 1.95, w: 3.8, h: 0.35, fontFace: 'Calibri', fontSize: 14, bold: true, color: NAVY, margin: 0 });
  const notas = [
    `Melhor km/L: ${setorAgg.slice().sort((a, b) => b.kml - a.kml)[0].setor} (${setorAgg.slice().sort((a, b) => b.kml - a.kml)[0].kml.toFixed(2)} km/L).`,
    `Menor km/L: ${setorAgg.slice().sort((a, b) => a.kml - b.kml)[0].setor} (${setorAgg.slice().sort((a, b) => a.kml - b.kml)[0].kml.toFixed(2)} km/L) — investigar se reflete perfil de rota (relevo/trânsito) antes de comparar como "pior desempenho".`,
    'Metas por Modelo × Unidade são sugestões iniciais (mediana do próprio grupo) — ver planilha, aba Metas.',
  ];
  let ny = 2.45;
  notas.forEach(t => {
    s.addText(t, { x: 8.65, y: ny, w: 3.8, h: 1.1, fontFace: 'Calibri', fontSize: 11.5, color: INK, margin: 0, valign: 'top' });
    ny += 1.15;
  });
  footer(s, false, '4');
}

// ---------- Slide 5: Continuidade do reporte ----------
{
  const s = bgSlide(false);
  s.addText('Continuidade do reporte de telemetria', { x: 0.6, y: 0.5, w: 11.5, h: 0.6, fontFace: 'Cambria', fontSize: 28, bold: true, color: NAVY, margin: 0 });
  s.addText('Classificação dos veículos válidos pela sequência de reportes de média na semana', { x: 0.6, y: 1.12, w: 11.5, h: 0.4, fontFace: 'Calibri', fontSize: 13, color: MUTED, margin: 0 });

  const order = ['Reporte contínuo', 'Reporte retomado / aparente correção', 'Intermitente', 'Deixou de reportar', 'Sem reporte em todo o período'];
  const colorMap = { 'Reporte contínuo': GOOD, 'Reporte retomado / aparente correção': WARN, 'Intermitente': 'E67E22', 'Deixou de reportar': CRIT, 'Sem reporte em todo o período': '922B21' };
  s.addChart(pres.ChartType.bar, [{
    name: 'Veículos',
    labels: order.map(o => o.replace(' em todo o período', ' (total)').replace('Reporte retomado / aparente correção', 'Retomado')),
    values: order.map(o => res.classificacao_contagem[o] || 0),
  }], {
    x: 0.7, y: 1.75, w: 7.6, h: 4.9,
    barDir: 'bar', chartColors: order.map(o => colorMap[o]), valueBarColors: true,
    showTitle: false, showLegend: false,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: INK, dataLabelFontSize: 12, dataLabelFontBold: true,
    catAxisLabelColor: INK, catAxisLabelFontSize: 11.5,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 10,
    valGridLine: { color: 'E5E7EB', size: 0.75 }, catGridLine: { style: 'none' },
    barGapWidthPct: 40,
  });

  s.addShape('roundRect', { x: 8.55, y: 1.75, w: 4.15, h: 4.9, fill: { color: 'FDEDEA' }, line: { type: 'none' }, rectRadius: 0.1 });
  s.addText('Prioridade de verificação', { x: 8.85, y: 1.95, w: 3.6, h: 0.35, fontFace: 'Calibri', fontSize: 14, bold: true, color: CRIT, margin: 0 });
  s.addText(
    `${res.classificacao_contagem['Deixou de reportar'] || 0} veículos pararam de reportar e seguem sem dado até o fim do período. ` +
    `${res.classificacao_contagem['Sem reporte em todo o período'] || 0} não reportaram a semana inteira, alguns rodando mais de 2.000 km sem qualquer dado de consumo.`,
    { x: 8.85, y: 2.35, w: 3.6, h: 1.6, fontFace: 'Calibri', fontSize: 12, color: INK, margin: 0, valign: 'top' }
  );
  s.addText('"–" = telemetria não importou a média · qualquer número, inclusive 0,00, conta como reporte.', {
    x: 8.85, y: 5.9, w: 3.6, h: 0.6, fontFace: 'Calibri', fontSize: 10.5, italic: true, color: MUTED, margin: 0, valign: 'top',
  });
  footer(s, false, '5');
}

// ---------- Slide 6: Ranking de oportunidades ----------
{
  const s = bgSlide(false);
  s.addText('Ranking de oportunidades', { x: 0.6, y: 0.5, w: 11, h: 0.6, fontFace: 'Cambria', fontSize: 28, bold: true, color: NAVY, margin: 0 });
  s.addText('Veículos prioritários — maior risco/economia potencial estimada', { x: 0.6, y: 1.12, w: 11, h: 0.4, fontFace: 'Calibri', fontSize: 13, color: MUTED, margin: 0 });

  const head = ['Prefixo', 'Placa', 'Classificação', 'Km sem reporte', 'Último registro'];
  const rows = [head.map(h => ({ text: h, options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 12 } }))];
  prioridade.forEach(p => {
    rows.push([
      { text: p.prefixo, options: { fontSize: 12 } },
      { text: p.placa, options: { fontSize: 12 } },
      { text: p.classificacao, options: { fontSize: 11.5, color: CRIT } },
      { text: fmt(p.distancia_dias_tracinho, 1) + ' km', options: { fontSize: 12, align: 'right' } },
      { text: fmtData(p.ultimo_dia), options: { fontSize: 12 } },
    ]);
  });
  s.addTable(rows, {
    x: 0.6, y: 1.85, w: 12.1, h: 3.9,
    colW: [1.7, 1.9, 4.6, 2.0, 1.9],
    border: { type: 'solid', color: 'E5E7EB', pt: 0.75 },
    autoPage: false, valign: 'middle',
    margin: [4, 6, 4, 6],
  });

  s.addShape('roundRect', { x: 0.6, y: 6.0, w: 12.1, h: 0.95, fill: { color: CARD }, line: { type: 'none' }, rectRadius: 0.08 });
  s.addText('Lista completa (79 veículos, com km/L, meta, desvio e economia) disponível na planilha — aba Analise_Consumo — e no painel HTML interativo.', {
    x: 0.85, y: 6.1, w: 11.6, h: 0.75, fontFace: 'Calibri', fontSize: 12, color: INK, margin: 0, valign: 'middle',
  });
  footer(s, false, '6');
}

// ---------- Slide 7: Achado destacado ----------
{
  const s = bgSlide(true);
  s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: NAVY } });
  s.addText('ACHADO DESTACADO', { x: 0.9, y: 0.85, w: 8, h: 0.4, fontFace: 'Calibri', fontSize: 13, color: ICE, charSpacing: 3, bold: true, margin: 0 });
  s.addText('Consumo de combustível sem quilometragem registrada', {
    x: 0.85, y: 1.3, w: 11.5, h: 1.3, fontFace: 'Cambria', fontSize: 30, bold: true, color: WHITE, margin: 0, lineSpacing: 34,
  });

  s.addShape('roundRect', { x: 0.9, y: 2.85, w: 3.5, h: 1.7, fill: { color: NAVY2 }, line: { type: 'none' }, rectRadius: 0.1 });
  s.addText('Veículo', { x: 1.15, y: 3.0, w: 3, h: 0.3, fontFace: 'Calibri', fontSize: 11, color: '9FB0DE', margin: 0 });
  s.addText(anomaliaZero ? `${anomaliaZero.prefixo} / ${anomaliaZero.placa}` : 'R7045 / OUO0218', { x: 1.15, y: 3.3, w: 3, h: 0.5, fontFace: 'Calibri', fontSize: 20, bold: true, color: WHITE, margin: 0 });
  s.addText('7 dias, MBB — Conquista', { x: 1.15, y: 3.9, w: 3, h: 0.4, fontFace: 'Calibri', fontSize: 11.5, color: '9FB0DE', margin: 0 });

  s.addShape('roundRect', { x: 4.6, y: 2.85, w: 3.5, h: 1.7, fill: { color: NAVY2 }, line: { type: 'none' }, rectRadius: 0.1 });
  s.addText('Distância / Km-L reportados', { x: 4.85, y: 3.0, w: 3, h: 0.3, fontFace: 'Calibri', fontSize: 11, color: '9FB0DE', margin: 0 });
  s.addText('0,00 km', { x: 4.85, y: 3.3, w: 3, h: 0.5, fontFace: 'Calibri', fontSize: 20, bold: true, color: WHITE, margin: 0 });
  s.addText('0,00 Km/L em todos os 7 dias', { x: 4.85, y: 3.9, w: 3, h: 0.4, fontFace: 'Calibri', fontSize: 11.5, color: '9FB0DE', margin: 0 });

  s.addShape('roundRect', { x: 8.3, y: 2.85, w: 4.1, h: 1.7, fill: { color: 'C0392B' }, line: { type: 'none' }, rectRadius: 0.1 });
  s.addText('Litros consumidos (telemetria)', { x: 8.55, y: 3.0, w: 3.6, h: 0.3, fontFace: 'Calibri', fontSize: 11, color: 'FADBD8', margin: 0 });
  s.addText(anomaliaZero ? fmt(anomaliaZero.litros_reportado, 1) + ' L' : '856,5 L', { x: 8.55, y: 3.3, w: 3.6, h: 0.5, fontFace: 'Calibri', fontSize: 24, bold: true, color: WHITE, margin: 0 });
  s.addText('na semana — fisicamente incompatível com 0 km', { x: 8.55, y: 3.9, w: 3.6, h: 0.4, fontFace: 'Calibri', fontSize: 11, color: 'FADBD8', margin: 0 });

  s.addText('Leitura: sugere falha do sensor de distância/GPS, ou consumo de uma operação não capturada pelo hodômetro (ex.: geração auxiliar). Nenhuma causa mecânica foi confirmada — recomenda-se verificação em campo antes de qualquer ação ou penalização.', {
    x: 0.9, y: 4.9, w: 11.5, h: 1.4, fontFace: 'Calibri', fontSize: 15, color: 'D6DEF5', margin: 0, valign: 'top', lineSpacing: 22,
  });
  footer(s, true, '7');
}

// ---------- Slide 8: Recomendações ----------
{
  const s = bgSlide(false);
  s.addText('Recomendações', { x: 0.6, y: 0.5, w: 10, h: 0.6, fontFace: 'Cambria', fontSize: 30, bold: true, color: NAVY, margin: 0 });
  s.addText('Ações sugeridas, por ordem de prioridade', { x: 0.6, y: 1.12, w: 10, h: 0.4, fontFace: 'Calibri', fontSize: 13, color: MUTED, margin: 0 });

  const recs = [
    ['1', 'Atualizar a Base_Frota', `Cadastrar (ou excluir formalmente) os ${res.excluidos_total} veículos que rodam fora dela hoje — ${100 - pctValidos}% da operação real fica fora da gestão.`],
    ['2', 'Verificar veículos sem reporte', 'Priorizar os que "deixaram de reportar" e os que rodaram >1.000 km sem nenhum dado de consumo na semana.'],
    ['3', 'Corrigir cadastro de placas', 'Confirmar a placa do prefixo R7085 (corrompida) e investigar a divergência de placas do prefixo R6755.'],
    ['4', 'Inspecionar sensor do R7045', 'Consumo relevante registrado com 0 km e 0,00 Km/L o período inteiro — checar hodômetro/GPS antes de qualquer conclusão.'],
    ['5', 'Definir metas e preço oficiais', 'Substituir a meta sugerida (mediana) e o preço de referência do diesel pelos valores oficiais na aba Metas.'],
    ['6', 'Repetir a análise semanalmente', 'Acompanhar tendência e medir o efeito das ações corretivas com o mesmo painel e planilha.'],
  ];
  const cw = 5.95, ch = 1.55, gx = 0.3, gy = 0.3, x0 = 0.6, y0 = 1.85;
  recs.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = x0 + col * (cw + gx), y = y0 + row * (ch + gy);
    s.addShape('roundRect', { x, y, w: cw, h: ch, fill: { color: CARD }, line: { type: 'none' }, rectRadius: 0.09 });
    s.addShape('ellipse', { x: x + 0.22, y: y + 0.22, w: 0.5, h: 0.5, fill: { color: NAVY }, line: { type: 'none' } });
    s.addText(r[0], { x: x + 0.22, y: y + 0.22, w: 0.5, h: 0.5, fontFace: 'Calibri', fontSize: 16, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0 });
    s.addText(r[1], { x: x + 0.9, y: y + 0.16, w: cw - 1.1, h: 0.4, fontFace: 'Calibri', fontSize: 14, bold: true, color: NAVY, margin: 0 });
    s.addText(r[2], { x: x + 0.9, y: y + 0.56, w: cw - 1.1, h: 0.9, fontFace: 'Calibri', fontSize: 11.5, color: INK, margin: 0, valign: 'top', lineSpacing: 14 });
  });
  footer(s, false, '8');
}

// ---------- Slide 9: Fechamento ----------
{
  const s = bgSlide(true);
  s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: NAVY } });
  s.addShape('ellipse', { x: -2.5, y: 4.2, w: 6, h: 6, fill: { color: NAVY2 }, line: { type: 'none' } });
  s.addText('Como manter isto atualizado', { x: 0.9, y: 1.2, w: 10.5, h: 0.7, fontFace: 'Cambria', fontSize: 32, bold: true, color: WHITE, margin: 0 });
  const steps = [
    'Exportar o novo boletim semanal de telemetria no mesmo formato (colunas e nomes de aba).',
    'Colar os dados na aba do boletim da planilha — as fórmulas de km/L, custo e economia recalculam automaticamente.',
    'Revisar a aba Metas (preço do diesel e metas por modelo/operação) a cada período.',
    'Reabrir o painel HTML (mesma pasta) para visualizar filtros, mapa de calor e ranking atualizados.',
  ];
  let y = 2.3;
  steps.forEach((t, i) => {
    s.addShape('ellipse', { x: 0.9, y, w: 0.42, h: 0.42, fill: { color: ICE }, line: { type: 'none' } });
    s.addText(String(i + 1), { x: 0.9, y, w: 0.42, h: 0.42, fontFace: 'Calibri', fontSize: 14, bold: true, color: NAVY, align: 'center', valign: 'middle', margin: 0 });
    s.addText(t, { x: 1.55, y: y - 0.05, w: 10.5, h: 0.55, fontFace: 'Calibri', fontSize: 14.5, color: 'E6ECFB', margin: 0, valign: 'middle' });
    y += 0.85;
  });
  s.addText('Economia potencial é sempre uma estimativa. Nenhuma causa mecânica ou responsabilidade de motorista foi atribuída nesta análise.', {
    x: 0.9, y: 6.5, w: 11, h: 0.5, fontFace: 'Calibri', fontSize: 11.5, italic: true, color: '9FB0DE', margin: 0,
  });
  footer(s, true, '9');
}

pres.writeFile({ fileName: 'Apresentacao_Diretoria_Combustivel.pptx' }).then(() => console.log('done'));
