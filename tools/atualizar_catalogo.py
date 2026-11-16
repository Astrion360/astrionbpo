#!/usr/bin/env python3
"""Regenera o catálogo público JS a partir do JSON editável, validando os preços."""
import json,re,sys
from pathlib import Path
from collections import Counter
BASE=Path(__file__).resolve().parent.parent
SOURCE=BASE/'assets'/'catalog-data.json'
TARGET=BASE/'assets'/'catalog-data.js'
data=json.loads(SOURCE.read_text(encoding='utf-8'))
services=data['services'];solutions=data['solutions'];lines=data['lines']
assert len(services)==135, 'O catálogo deve conter 135 serviços.'
by_code={r['code']:r for r in services}
assert len(by_code)==135, 'Códigos de serviços duplicados.'
assert all(r['code'] and r['name'] and r['line'] in lines for r in services)

def price_number(p):
    if not p.startswith('R$'):return None
    digits=re.sub(r'[^0-9]','',p)
    return int(digits) if digits else None

for r in services:
    r['lineName']=lines[r['line']]
    r['priceType']='mensal' if r['format']=='Mensal' else 'projeto' if r['format']=='Projeto' else 'consulta'
    r['priceValue']=price_number(r['price'])
    if r['priceType']=='consulta':assert r['price']=='Sob consulta'
    else: assert isinstance(r['priceValue'],int),f"Preço de {r['code']} inválido"
assert Counter(r['priceType'] for r in services)=={'projeto':55,'mensal':8,'consulta':72}
for s in solutions:
    s['lineName']=lines[s['line']]
    codes=s['codes']
    assert len(set(codes))==len(codes),f"Código duplicado na solução {s['id']}"
    assert all(c in by_code for c in codes),f"Serviço inexistente em {s['id']}"
    comps=[by_code[c] for c in codes]
    kinds={r['priceType'] for r in comps}
    s['priceType']=next(iter(kinds)) if len(kinds)==1 else 'misto' if comps else 'consulta'
    s['priceValue']=sum(r['priceValue'] for r in comps) if s['priceType'] in ('mensal','projeto') else None
    s['price']='R$ '+format(s['priceValue'],',').replace(',','.')+('/mês' if s['priceType']=='mensal' else '') if s['priceValue'] is not None else 'Sob consulta'
    s['special']=not bool(codes)
assert len({s['id'] for s in solutions})==len(solutions),'Soluções duplicadas.'
SOURCE.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
TARGET.write_text('window.ASTRION_DATA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
print(f"Catálogo atualizado: {len(services)} serviços, {len(solutions)} soluções. \nArquivo: {TARGET}")
