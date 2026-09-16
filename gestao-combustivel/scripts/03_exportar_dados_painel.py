import pickle, json, statistics
from collections import defaultdict

d = pickle.load(open('state.pkl', 'rb'))
res = json.load(open('resultado.json'))
agg = json.load(open('agg_vehicle.json'))
frota_rows = d['frota_rows']

DIESEL_PRICE = 6.00

# rebuild consolidated groups (same logic as analyze3) to get per-day rows per vehicle
matched = d['matched']; groups = d['groups']
by_frota_id = defaultdict(list)
for gk, frec in matched.items():
    by_frota_id[id(frec)].append(gk)
consolidated = {}
for fid, gks in by_frota_id.items():
    frec = matched[gks[0]]
    combined_rows = []
    for gk in gks:
        combined_rows.extend(groups[gk])
    consolidated[frec['prefixo']] = dict(frec=frec, rows=combined_rows)

# ---- metas by group (median of individual vehicle km/L) ----
by_group = defaultdict(lambda: {'kmls': [], 'km': 0.0, 'l': 0.0})
for pref, a in agg.items():
    g = (a['fb'], a['setor'])
    by_group[g]['km'] += a['km_reportado']
    by_group[g]['l'] += a['litros_reportado']
    if a['kml']:
        by_group[g]['kmls'].append(a['kml'])

metas = {}
for g, v in by_group.items():
    median_kml = round(statistics.median(v['kmls']), 2) if v['kmls'] else None
    metas[g] = median_kml

# ---- per-vehicle daily records ----
daily = []
for pref, cinfo in consolidated.items():
    frec = cinfo['frec']
    for r in cinfo['rows']:
        daily.append(dict(
            data=str(r['dia']), prefixo=pref, placa=frec['placa'], setor=frec['setor'],
            fb=frec['fb'], uo=frec['uo'],
            dist=r['dist'], litros=r['consumo_val'] if r['media_status'] == 'numerico' else None,
            media=r['media_val'] if r['media_status'] == 'numerico' else None,
            reportou=(r['media_status'] == 'numerico'),
        ))
daily.sort(key=lambda x: (x['prefixo'], x['data']))

# ---- per-vehicle summary (mirrors Analise_Consumo formulas) ----
class_by_prefixo = {a['prefixo']: a for a in res['analise']}
veiculos = []
for pref, a in sorted(agg.items()):
    meta = metas.get((a['fb'], a['setor']))
    kml = a['kml']
    desvio = None
    status = 'Sem dados suficientes'
    custo_km = None
    custo_total = round(a['litros_reportado'] * DIESEL_PRICE, 2)
    econ_l = 0.0
    econ_r = 0.0
    if kml is not None and meta:
        desvio = round((kml - meta) / meta, 4)
        custo_km = round(DIESEL_PRICE / kml, 2)
        if kml >= meta:
            status = 'Acima da meta' if desvio >= 0.02 else 'Na meta'
        else:
            status = 'Crítico: abaixo da meta' if desvio <= -0.10 else 'Abaixo da meta'
        if kml < meta:
            econ_l = round(max(0.0, a['litros_reportado'] - (a['km_reportado'] / meta)), 1)
            econ_r = round(econ_l * DIESEL_PRICE, 2)
    elif kml is not None and not meta:
        status = 'Sem meta definida'
    cl = class_by_prefixo.get(pref, {})
    veiculos.append(dict(
        prefixo=pref, placa=cl.get('placa', ''), fb=a['fb'], setor=a['setor'],
        classificacao=cl.get('classificacao', ''),
        km_total=a['km_total'], km_reportado=a['km_reportado'], litros_reportado=a['litros_reportado'],
        kml=kml, meta=meta, desvio=desvio, status=status,
        custo_km=custo_km, custo_total=custo_total,
        economia_l=econ_l, economia_r=econ_r,
        dias_numericos=cl.get('dias_numericos'), dias_tracinho=cl.get('dias_tracinho'),
        situacao_ultimo_registro=cl.get('situacao_ultimo_registro'),
        distancia_dias_tracinho=cl.get('distancia_dias_tracinho'),
        observacao=cl.get('observacao'),
    ))

out = dict(
    gerado_em='2026-09-16',
    periodo=dict(inicio='2026-09-08', fim='2026-09-14'),
    diesel_price=DIESEL_PRICE,
    resumo=res['resumo'],
    metas={f"{g[0]}|{g[1]}": v for g, v in metas.items()},
    veiculos=veiculos,
    daily=daily,
    excluidos_resumo=dict(total=len(res['excluidos']), por_localidade=res['resumo']['excluidos_por_localidade']),
    prioridade=res['prioridade_investigacao'],
)
json.dump(out, open('dashboard_data.json', 'w'), ensure_ascii=False, separators=(',', ':'), default=str)
print("veiculos:", len(veiculos), "daily rows:", len(daily))
print("frota totals check: km_reportado sum=", round(sum(v['km_reportado'] for v in veiculos),1),
      "litros sum=", round(sum(v['litros_reportado'] for v in veiculos),1))
import os
print("file size KB:", round(os.path.getsize('dashboard_data.json')/1024,1))
