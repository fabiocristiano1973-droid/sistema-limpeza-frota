import openpyxl, datetime, json, re, pickle
from collections import defaultdict, Counter

# >>> ATUALIZE aqui para apontar para o novo arquivo de boletim semanal <<<
SRC = '../planilha/Boletim_do_Veiculo_mais_recente.xlsx'
wb = openpyxl.load_workbook(SRC, data_only=True)
# a aba do boletim é sempre a primeira do arquivo exportado pela telemetria
# (o nome muda a cada semana, ex. "Boletim_do_Veiculo_2026-09-15_2"); "Base_Frota" é fixo
ws_bol = wb.worksheets[0]
ws_frota = wb['Base_Frota']

def norm_placa(v):
    if isinstance(v, datetime.datetime):
        return None
    if v is None:
        return None
    s = str(v).strip().upper().replace('-', '').replace(' ', '')
    return s if s else None

def norm_prefixo(v):
    if v is None:
        return None
    return str(v).strip().upper()

# ---------- Base_Frota ----------
frota_rows = []
frota_by_placa = defaultdict(list)
frota_by_prefixo = defaultdict(list)
for r in range(3, ws_frota.max_row + 1):
    prefixo = ws_frota.cell(row=r, column=1).value
    placa = ws_frota.cell(row=r, column=2).value
    if prefixo is None and placa is None:
        continue
    rec = dict(
        row=r, prefixo=prefixo, placa=placa,
        placa_norm=norm_placa(placa), prefixo_norm=norm_prefixo(prefixo),
        placa_corrupted=isinstance(placa, datetime.datetime),
        empresa=ws_frota.cell(row=r, column=3).value,
        tipo=ws_frota.cell(row=r, column=4).value,
        fb=ws_frota.cell(row=r, column=5).value,
        ano=ws_frota.cell(row=r, column=6).value,
        uo=ws_frota.cell(row=r, column=7).value,
        setor=ws_frota.cell(row=r, column=8).value,
        linha=ws_frota.cell(row=r, column=9).value,
    )
    frota_rows.append(rec)
    if rec['placa_norm']:
        frota_by_placa[rec['placa_norm']].append(rec)
    if rec['prefixo_norm']:
        frota_by_prefixo[rec['prefixo_norm']].append(rec)

dup_placa_frota = {k: v for k, v in frota_by_placa.items() if len(v) > 1}
dup_prefixo_frota = {k: v for k, v in frota_by_prefixo.items() if len(v) > 1}
print("Base_Frota: placas duplicadas ->", len(dup_placa_frota))
print("Base_Frota: prefixos duplicados ->", len(dup_prefixo_frota))
for k, v in dup_prefixo_frota.items():
    print(" prefixo dup:", k, [(x['row'], x['placa']) for x in v])

# ---------- Boletim ----------
MEDIA_RE = re.compile(r'^\s*(-?\d+[.,]?\d*)\s*Km/L\s*$', re.IGNORECASE)
CONSUMO_RE = re.compile(r'^\s*(-?\d+[.,]?\d*)\s*L\s*$', re.IGNORECASE)

rows = []
for r in range(2, ws_bol.max_row + 1):
    raw_placa = ws_bol.cell(row=r, column=1).value
    prefixo = ws_bol.cell(row=r, column=2).value
    uo = ws_bol.cell(row=r, column=3).value
    motoristas = ws_bol.cell(row=r, column=4).value
    dia = ws_bol.cell(row=r, column=5).value
    dist_raw = ws_bol.cell(row=r, column=6).value
    consumo_raw = ws_bol.cell(row=r, column=17).value
    media_raw = ws_bol.cell(row=r, column=18).value
    hod_i_raw = ws_bol.cell(row=r, column=31).value
    hod_f_raw = ws_bol.cell(row=r, column=32).value

    placa_corrupted = isinstance(raw_placa, datetime.datetime)
    np_ = norm_placa(raw_placa)
    npref = norm_prefixo(prefixo)
    dia_date = dia.date() if isinstance(dia, datetime.datetime) else dia

    try:
        dist = float(dist_raw)
    except Exception:
        dist = None
    try:
        hod_i = float(hod_i_raw)
    except Exception:
        hod_i = None
    try:
        hod_f = float(hod_f_raw)
    except Exception:
        hod_f = None

    media_str = None if media_raw is None else str(media_raw).strip()
    if media_str is None or media_str == '':
        media_status, media_val = 'vazio', None
    elif media_str == '-':
        media_status, media_val = 'tracinho', None
    else:
        m = MEDIA_RE.match(media_str)
        if m:
            media_status, media_val = 'numerico', float(m.group(1).replace(',', '.'))
        else:
            media_status, media_val = 'invalido', None

    consumo_str = None if consumo_raw is None else str(consumo_raw).strip()
    if consumo_str is None or consumo_str == '':
        consumo_status, consumo_val = 'vazio', None
    elif consumo_str == '-':
        consumo_status, consumo_val = 'tracinho', None
    else:
        m = CONSUMO_RE.match(consumo_str)
        if m:
            consumo_status, consumo_val = 'numerico', float(m.group(1).replace(',', '.'))
        else:
            consumo_status, consumo_val = 'invalido', None

    hod_delta = None
    hod_issue = False
    if hod_i is not None and hod_f is not None and dist is not None:
        hod_delta = hod_f - hod_i
        if abs(hod_delta - dist) > 5:
            hod_issue = True

    rows.append(dict(
        row=r, raw_placa=raw_placa, placa_corrupted=placa_corrupted, placa_norm=np_,
        prefixo=prefixo, prefixo_norm=npref, uo=uo, motoristas=motoristas,
        dia=dia_date, dist=dist, dist_raw=dist_raw,
        consumo_status=consumo_status, consumo_val=consumo_val, consumo_raw=consumo_raw,
        media_status=media_status, media_val=media_val, media_raw=media_raw,
        hod_i=hod_i, hod_f=hod_f, hod_delta=hod_delta, hod_issue=hod_issue,
    ))

# ---------- match boletim vehicles to frota ----------
by_vehicle = defaultdict(list)  # matched key -> rows
match_notes = {}  # matched key -> note
unmatched_groups = defaultdict(list)  # (placa_norm or prefixo) -> rows (not in frota)

# group boletim rows first by (placa_norm or prefixo_norm-as-fallback-key) so all rows of the
# same physical vehicle stay together even if placa is corrupted in some/])
vehicle_group_key = {}  # row -> group key
groups = defaultdict(list)
for r in rows:
    if r['placa_norm']:
        gk = ('P', r['placa_norm'])
    elif r['prefixo_norm']:
        gk = ('X', r['prefixo_norm'])
    else:
        gk = ('R', r['row'])
    groups[gk].append(r)

print("\nGrupos de veiculos distintos no boletim (por placa/prefixo):", len(groups))

matched = {}   # group key -> frota rec
unmatched = {}  # group key -> reason
ambiguous = {}

for gk, grows in groups.items():
    kind, val = gk
    prefixos_in_group = set(norm_prefixo(x['prefixo']) for x in grows if x['prefixo'])
    if kind == 'P':
        frec = frota_by_placa.get(val)
        if frec and len(frec) == 1:
            matched[gk] = frec[0]
            continue
        elif frec and len(frec) > 1:
            # try disambiguate by prefixo
            cand = [f for f in frec if f['prefixo_norm'] in prefixos_in_group]
            if len(cand) == 1:
                matched[gk] = cand[0]
                ambiguous[gk] = f"Placa {val} duplicada na Base_Frota; desambiguado por prefixo"
                continue
            else:
                ambiguous[gk] = f"Placa {val} duplicada na Base_Frota ({len(frec)} ocorrencias) sem desambiguacao clara por prefixo"
                unmatched[gk] = ambiguous[gk]
                continue
        # placa not found directly -> try prefixo fallback
        cand = None
        for p in prefixos_in_group:
            fr = frota_by_prefixo.get(p)
            if fr:
                cand = fr
                break
        if cand and len(cand) == 1:
            matched[gk] = cand[0]
            ambiguous[gk] = f"Placa {val} nao encontrada na Base_Frota; correspondencia feita pelo prefixo {list(prefixos_in_group)}"
            continue
        unmatched[gk] = f"Placa {val} (prefixo {list(prefixos_in_group)}) nao consta na Base_Frota"
    else:  # kind == 'X' (placa corrupted in boletim, use prefixo)
        cand = frota_by_prefixo.get(val)
        if cand and len(cand) == 1:
            matched[gk] = cand[0]
            ambiguous[gk] = f"Placa do boletim ilegivel/corrompida; correspondencia feita pelo prefixo {val}"
            continue
        unmatched[gk] = f"Placa ilegivel no boletim e prefixo {val} nao encontrado (ou ambiguo) na Base_Frota"

print("Veiculos casados com Base_Frota:", len(matched))
print("Veiculos NAO casados (excluidos):", len(unmatched))
print("Casamentos com ressalva/ambiguidade:", len(ambiguous))
for gk, note in list(ambiguous.items())[:20]:
    print(" ", gk, "->", note)

print("\nExcluidos detalhe:")
for gk, note in unmatched.items():
    print(" ", gk, note, "linhas:", len(groups[gk]))

# frota vehicles never seen in boletim
seen_frota_rows_ids = set(id(v) for v in matched.values())
frota_no_boletim = [f for f in frota_rows if id(f) not in seen_frota_rows_ids]
print("\nVeiculos da Base_Frota SEM nenhum registro no boletim:", len(frota_no_boletim))
for f in frota_no_boletim:
    print(" ", f['prefixo'], f['placa'], f['uo'])

pickle.dump(dict(rows=rows, frota_rows=frota_rows, groups=groups, matched=matched,
                  unmatched=unmatched, ambiguous=ambiguous, frota_no_boletim=frota_no_boletim,
                  frota_by_placa=dict(frota_by_placa), frota_by_prefixo=dict(frota_by_prefixo)),
            open('state.pkl', 'wb'))
print("\nSaved state.pkl")
