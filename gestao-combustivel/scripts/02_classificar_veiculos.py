import pickle, json, datetime
from collections import defaultdict, Counter

d = pickle.load(open('state.pkl', 'rb'))
rows = d['rows']; groups = d['groups']; matched = d['matched']; unmatched = d['unmatched']
ambiguous = d['ambiguous']; frota_no_boletim = d['frota_no_boletim']; frota_rows = d['frota_rows']

PERIODO_INICIO = datetime.date(2026, 9, 8)
PERIODO_FIM = datetime.date(2026, 9, 14)

def display_placa(frec):
    if frec.get('placa_corrupted'):
        return f"PLACA ILEGÍVEL (cadastro corrompido — prefixo {frec['prefixo']})"
    return frec['placa']

def fmt_br(d):
    """Formata data no padrao DD/MM/AAAA."""
    if isinstance(d, str):
        d = datetime.date.fromisoformat(d)
    return d.strftime('%d/%m/%Y')

def periodo_br(ini, fim):
    ini_s, fim_s = fmt_br(ini), fmt_br(fim)
    return ini_s if ini_s == fim_s else f'{ini_s} a {fim_s}'

def veh_label(gk, grows, frec=None):
    prefixos = sorted(set(str(r['prefixo']) for r in grows if r['prefixo']))
    placas = sorted(set(str(r['raw_placa']) for r in grows if r['raw_placa'] and not r['placa_corrupted']))
    corrompida = any(r['placa_corrupted'] for r in grows)
    return dict(prefixos=prefixos, placas=placas, placa_corrompida=corrompida)

# ---------------- Consolidate boletim groups that resolved to the SAME Base_Frota vehicle ----------------
# (e.g. one plate-group matched directly by placa, another matched by prefixo fallback with a
# divergent placa text for the same prefixo) -- these must be treated as ONE vehicle timeline,
# not silently merged/overwritten later, and the plate divergence must be flagged.
by_frota_id = defaultdict(list)
for gk, frec in matched.items():
    by_frota_id[id(frec)].append(gk)

consolidated = {}  # representative gk -> (frec, combined_rows, note)
for fid, gks in by_frota_id.items():
    frec = matched[gks[0]]
    combined_rows = []
    for gk in gks:
        combined_rows.extend(groups[gk])
    note = ''
    if len(gks) > 1:
        placas_vistas = sorted(set(str(r['raw_placa']) for r in combined_rows
                                    if r['raw_placa'] and not r['placa_corrupted']))
        note = (f"Boletim usa {len(placas_vistas)} placas para o prefixo {frec['prefixo']} na semana "
                f"({', '.join(placas_vistas)}). Base_Frota cadastra {display_placa(frec)}. "
                f"Verificar placa correta junto à operação.")
    consolidated[gks[0]] = dict(frec=frec, rows=combined_rows, note=note)

print(f"Grupos consolidados por identidade de veiculo na Base_Frota: {len(matched)} grupos -> {len(consolidated)} veiculos unicos")
for gk, c in consolidated.items():
    if c['note']:
        print(" ", c['note'])

# ---------------- Vehicle analysis (valid fleet) ----------------
analise = []
ocorrencias = []
multi_dia_flags = []

for gk, cinfo in consolidated.items():
    frec = cinfo['frec']
    grows = sorted(cinfo['rows'], key=lambda r: r['dia'])
    # dedupe by day (defensive - none expected but rule requires handling)
    per_day = defaultdict(list)
    for r in grows:
        per_day[r['dia']].append(r)
    dias_ordenados = sorted(per_day.keys())

    seq = []  # (dia, reported_bool, misto_bool, rows_that_day)
    for dia in dias_ordenados:
        drows = per_day[dia]
        statuses = [r['media_status'] for r in drows]
        numerico = any(s == 'numerico' for s in statuses)
        tracinho = any(s == 'tracinho' for s in statuses)
        outros = any(s in ('vazio', 'invalido') for s in statuses)
        misto = numerico and tracinho
        if misto:
            multi_dia_flags.append((gk, dia, drows))
        reported = numerico  # numeric on at least one record that day counts as reported
        seq.append(dict(dia=dia, reported=reported, misto=misto, outros_invalidos=outros, rows=drows))

    # runs of consecutive same "reported" state
    runs = []
    for item in seq:
        if runs and runs[-1]['reported'] == item['reported']:
            runs[-1]['dias'].append(item['dia'])
        else:
            runs.append(dict(reported=item['reported'], dias=[item['dia']]))

    n_false_runs = sum(1 for rr in runs if not rr['reported'])
    n_true_runs = sum(1 for rr in runs if rr['reported'])

    if n_true_runs == 0:
        classificacao = 'Sem reporte em todo o período'
    elif n_false_runs == 0:
        classificacao = 'Reporte contínuo'
    elif n_false_runs == 1 and not runs[-1]['reported']:
        classificacao = 'Deixou de reportar'
    elif n_false_runs == 1 and runs[-1]['reported']:
        classificacao = 'Reporte retomado / aparente correção'
    elif n_false_runs >= 2:
        classificacao = 'Intermitente'
    else:
        classificacao = 'Dados insuficientes ou inconsistentes'

    # interruptions and resumptions (transitions)
    interrupcoes = []
    retomadas = []
    for i, rr in enumerate(runs):
        if not rr['reported']:
            desde_inicio = (i == 0)
            interrupcoes.append(dict(inicio=str(rr['dias'][0]), fim=str(rr['dias'][-1]),
                                      dias=len(rr['dias']), desde_inicio=desde_inicio))
        else:
            if i > 0:  # a resumption after a false run
                retomadas.append(dict(data=str(rr['dias'][0]), apos_dias_sem_reporte=len(runs[i-1]['dias'])))

    dias_numericos = sum(1 for it in seq if it['reported'])
    dias_tracinho = sum(1 for it in seq if not it['reported'])
    situacao_ultimo = 'Informando média' if seq[-1]['reported'] else 'Sem média'

    dist_dias_tracinho = 0.0
    for it in seq:
        if not it['reported']:
            for r in it['rows']:
                if r['dist'] is not None:
                    dist_dias_tracinho += r['dist']

    # build occurrences (evidence rows) for interrupções/retomadas
    for i, rr in enumerate(runs):
        if not rr['reported'] and i > 0:
            first_dash_day = rr['dias'][0]
            last_dash_day = rr['dias'][-1]
            drow = per_day[first_dash_day][0]
            ocorrencias.append(dict(
                data=str(first_dash_day), veiculo_prefixo=frec['prefixo'], veiculo_placa=display_placa(frec),
                media=drow['media_raw'], distancia=drow['dist'], tipo='Sem média'))
        if rr['reported'] and i > 0:
            first_num_day = rr['dias'][0]
            drow = per_day[first_num_day][0]
            ocorrencias.append(dict(
                data=str(first_num_day), veiculo_prefixo=frec['prefixo'], veiculo_placa=display_placa(frec),
                media=drow['media_raw'], distancia=drow['dist'], tipo='Voltou a informar'))

    cobertura_dias = len(dias_ordenados)
    obs_parts = []
    if classificacao == 'Reporte contínuo':
        obs_parts.append("Telemetria informando normalmente.")
    elif classificacao == 'Deixou de reportar':
        obs_parts.append(f"Sem média desde {fmt_br(runs[-1]['dias'][0])}. Verificar telemetria/comunicação.")
    elif classificacao == 'Reporte retomado / aparente correção':
        gap = next((rr for rr in runs if not rr['reported']), None)
        if gap:
            obs_parts.append(f"Sem média em {periodo_br(gap['dias'][0], gap['dias'][-1])}. "
                              f"Voltou a informar em {fmt_br(retomadas[0]['data']) if retomadas else '-'}. "
                              f"Verificar se houve alguma intervenção.")
    elif classificacao == 'Intermitente':
        eventos = []
        for i, rr in enumerate(runs):
            if not rr['reported']:
                eventos.append(f"Sem média em {periodo_br(rr['dias'][0], rr['dias'][-1])}.")
            elif i > 0:
                eventos.append(f"Voltou a informar em {fmt_br(rr['dias'][0])}.")
        eventos.append("Verificar telemetria/comunicação.")
        obs_parts.append(' '.join(eventos))
    elif classificacao == 'Sem reporte em todo o período':
        obs_parts.append("Não informou média em nenhum dia registrado. Verificar telemetria.")
    else:
        obs_parts.append("Dados insuficientes para classificar. Verificar boletim.")
    if cobertura_dias < 7:
        obs_parts.append(f"Há registros em {cobertura_dias} dos 7 dias. Nos demais dias não há registro no boletim.")
    if any(it['misto'] for it in seq):
        obs_parts.append("Média e tracinho no mesmo dia. Ver Ocorrências.")

    analise.append(dict(
        placa=display_placa(frec), prefixo=frec['prefixo'], uo=frec['uo'], setor=frec['setor'],
        empresa=frec['empresa'], tipo=frec['tipo'], fb=frec['fb'], ano=frec['ano'],
        classificacao=classificacao,
        primeiro_dia=str(dias_ordenados[0]), ultimo_dia=str(dias_ordenados[-1]),
        dias_com_registro=cobertura_dias,
        dias_numericos=dias_numericos, dias_tracinho=dias_tracinho,
        interrupcoes=interrupcoes, retomadas=retomadas,
        situacao_ultimo_registro=situacao_ultimo,
        distancia_dias_tracinho=round(dist_dias_tracinho, 1),
        observacao=' '.join(obs_parts),
        correspondencia_ressalva=(ambiguous.get(gk, '') + (' ' + cinfo['note'] if cinfo['note'] else '')).strip(),
        placa_boletim_corrompida=any(r['placa_corrupted'] for r in grows),
    ))

analise.sort(key=lambda x: (x['prefixo'] or ''))

# ---------------- Excluídos ----------------
excluidos = []
for gk, note in unmatched.items():
    grows = groups[gk]
    prefixos = sorted(set(str(r['prefixo']) for r in grows if r['prefixo']))
    placas = sorted(set(str(r['raw_placa']) for r in grows if r['raw_placa'] and not r['placa_corrupted']))
    uos = sorted(set(str(r['uo']) for r in grows if r['uo']))
    dias_ = sorted(set(r['dia'] for r in grows if r['dia']))
    localidade = uos[0] if len(uos) == 1 and uos[0] else 'Localidade não identificada'
    excluidos.append(dict(
        placa=placas[0] if placas else (gk[1] if gk[0]=='P' else '(ilegível)'),
        prefixo=prefixos[0] if prefixos else gk[1],
        uo_localidade=localidade,
        periodo_registros=periodo_br(dias_[0], dias_[-1]) if dias_ else '-',
        qtd_registros=len(grows),
        motivo=note,
    ))
excluidos.sort(key=lambda x: x['prefixo'])

# ---------------- Per-vehicle km/L aggregates (ground truth for Excel formula validation) ----------------
agg_vehicle = {}
for gk, cinfo in consolidated.items():
    frec = cinfo['frec']
    grows = cinfo['rows']
    km_total = sum(r['dist'] for r in grows if r['dist'] is not None)
    km_reportado = sum(r['dist'] for r in grows if r['media_status'] == 'numerico' and r['dist'] is not None)
    litros_reportado = sum(r['consumo_val'] for r in grows if r['media_status'] == 'numerico' and r['consumo_val'] is not None)
    kml = km_reportado / litros_reportado if litros_reportado else None
    agg_vehicle[frec['prefixo']] = dict(km_total=round(km_total, 2), km_reportado=round(km_reportado, 2),
                                         litros_reportado=round(litros_reportado, 2),
                                         kml=round(kml, 3) if kml else None, setor=frec['setor'], fb=frec['fb'])
json.dump(agg_vehicle, open('agg_vehicle.json', 'w'), ensure_ascii=False, indent=2)
print("\nagg_vehicle.json: ", len(agg_vehicle), "veiculos unicos (deve bater com total_validos_presentes_boletim)")

# ---------------- Base_Frota sem boletim ----------------
sem_boletim = [dict(placa=f['placa'], prefixo=f['prefixo'], uo=f['uo'], setor=f['setor'])
               for f in frota_no_boletim]

# ---------------- Resumo ----------------
total_base_frota = len(frota_rows)
total_validos_presentes = len(analise)
total_validos_sem_boletim = len(sem_boletim)
class_counts = Counter(a['classificacao'] for a in analise)
class_pct = {k: round(100 * v / total_validos_presentes, 1) for k, v in class_counts.items()}

excluidos_por_localidade = Counter(e['uo_localidade'] for e in excluidos)

prioridade = [a for a in analise if a['classificacao'] in
              ('Deixou de reportar', 'Sem reporte em todo o período', 'Intermitente')]
def prio_key(a):
    ordem = {'Deixou de reportar': 0, 'Sem reporte em todo o período': 1, 'Intermitente': 2}
    return (ordem.get(a['classificacao'], 9), -a['distancia_dias_tracinho'])
prioridade.sort(key=prio_key)

resumo = dict(
    total_base_frota=total_base_frota,
    total_validos_presentes_boletim=total_validos_presentes,
    total_validos_sem_registro_boletim=total_validos_sem_boletim,
    classificacao_contagem=dict(class_counts),
    classificacao_percentual=class_pct,
    excluidos_total=len(excluidos),
    excluidos_por_localidade=dict(excluidos_por_localidade),
    periodo_esperado=periodo_br(PERIODO_INICIO, PERIODO_FIM),
    periodo_confirmado=f"Confirmado: {periodo_br(PERIODO_INICIO, PERIODO_FIM)}. Nenhuma divergência de data.",
    dias_com_problema_hodometro=sum(1 for r in rows if r['hod_issue']),
    placas_corrompidas_no_boletim=sum(1 for r in rows if r['placa_corrupted']),
    dias_mistos_detectados=len(multi_dia_flags),
)

out = dict(analise=analise, ocorrencias=ocorrencias, excluidos=excluidos,
           sem_boletim=sem_boletim, resumo=resumo,
           prioridade_investigacao=[dict(placa=a['placa'], prefixo=a['prefixo'],
                                          classificacao=a['classificacao'],
                                          situacao_ultimo_registro=a['situacao_ultimo_registro'],
                                          distancia_dias_tracinho=a['distancia_dias_tracinho'],
                                          ultimo_dia=a['ultimo_dia']) for a in prioridade])

json.dump(out, open('resultado.json', 'w'), ensure_ascii=False, indent=2, default=str)

print("=== RESUMO ===")
print(json.dumps(resumo, ensure_ascii=False, indent=2))
print("\nTotal analise:", len(analise))
print("Total ocorrencias:", len(ocorrencias))
print("Total excluidos:", len(excluidos))
print("Total sem_boletim:", len(sem_boletim))
print("\nPrioridade (top 15):")
for p in out['prioridade_investigacao'][:15]:
    print(" ", p)
