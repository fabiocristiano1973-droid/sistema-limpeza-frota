"""Injeta dashboard_data.json no template HTML e gera o painel final.

Uso:
    python3 08_injetar_dados_painel.py

Espera encontrar, na mesma pasta de execucao:
  - dashboard_data.json  (gerado pelo script 03)
  - 05_template_painel.html

Gera:
  - painel_combustivel.html
"""
import os

data_json = open('dashboard_data.json', encoding='utf-8').read()
tpl = open('05_template_painel.html', encoding='utf-8').read()
data_json_safe = data_json.replace('</script>', '<\\/script>')
out = tpl.replace('__DATA_JSON__', data_json_safe)
open('painel_combustivel.html', 'w', encoding='utf-8').write(out)
print('Painel gerado: painel_combustivel.html —', round(os.path.getsize('painel_combustivel.html') / 1024, 1), 'KB')
print('Copie este arquivo para gestao-combustivel/dashboard/index.html')
