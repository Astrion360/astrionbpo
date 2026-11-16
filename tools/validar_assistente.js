// Rodar com: node tools/validar_assistente.js
const assert=require('node:assert/strict');
const data=require('../assets/catalog-data.json');
const {recommend}=require('../assets/inteligencia-astrion.js');
const {makeStore}=require('../assets/carrinho-astrion.js');
assert.equal(data.services.length,135);
assert.equal(data.solutions.length,17);
const checks=[
 ['Preciso de um Business Plan e viabilidade para parceria B2B com um banco','bp-b2b'],
 ['Tenho corretores e quero estruturar canais B2B2C e comissões','canais-b2b2c'],
 ['Quero abrir uma administradora e estudar white label','wl-administradora'],
 ['Quero uma análise de RFP para grande conta de consórcio','grande-conta-rfp'],
 ['Preciso terceirizar o backoffice de propostas e a gestão do pipeline mensal','bpo-gerencial'],
 ['Preciso de um simulador em Excel','T02'],
 ['Quero só um dashboard de indicadores','T01'],
 ['Precisamos organizar gestão de sinistros e prestadores','sinistros-prestadores'],
 ['Quero criar uma operação MGA para nossa seguradora','seguros-mga'],
 ['Preciso analisar e melhorar a recuperação de crédito e cobrança de inadimplentes','O04']
];
for(const [need,expected] of checks){const result=recommend({need,choice:'auto',stage:'auto'},data);assert.equal(result.items[0]?.id,expected,need);}
const vague=recommend({need:'Gostaria de melhorar minha empresa'},data);
assert.equal(vague.items.length,0);
const complex=recommend({need:'Preciso realizar um estudo de viabilidade e depois terceirizar a operação mensal de propostas'},data);
assert.deepEqual(complex.items.map(x=>x.id),['bpo-gerencial','bp-b2b']);
let raw={};const memory={getItem:k=>raw[k],setItem:(k,v)=>raw[k]=v};
const cart=makeStore(data,memory);
assert.equal(cart.add('solucao','bp-b2b'),true);
assert.equal(cart.add('solucao','bp-b2b'),false);
assert.equal(cart.summary().projects,84500);
cart.add('servico','D01');assert.equal(cart.summary().projects,84500);assert.deepEqual(cart.summary().duplicates,['D01']);
cart.add('solucao','bpo-gerencial');assert.equal(cart.summary().monthly,45700);
cart.add('solucao','seguros-mga');assert.equal(cart.summary().unpriced.length,1);
const saved=makeStore(data,memory);assert.equal(saved.get().length,4);
saved.remove('solucao','bp-b2b');assert.equal(saved.get().length,3);
saved.clear();assert.equal(saved.get().length,0);
console.log('VALIDAÇÃO OK — 135 serviços, 17 soluções, recomendações, persistência e preços.');
