/* Astrion | mecanismo proprietário de recomendação por regras, sem rede nem modelo externo.
   Todas as sugestões apontam exclusivamente para códigos existentes no catálogo. */
(function (root) {
  'use strict';
  const normal = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const STOP = new Set('a as o os um uma uns umas de da do das dos em no na nos nas e ou com para por que qual quais como preciso precisamos queremos quero gostaria meu minha nosso nossa seus suas ser fazer ter temos tenho empresa empresas cliente clientes negocio negocios agora sobre hoje ajudar saber essa esse isso algo ainda ja muito mais também eu você voces somos'.split(' '));
  const words = value => normal(value).split(' ').filter(t => t.length >= 3 && !STOP.has(t));
  const containing = (text, p) => {
    const q = ' ' + normal(text) + ' ', pat = normal(p);
    if (!pat) return false;
    if (q.includes(' ' + pat + ' ')) return true;
    const toks = pat.split(' ');
    return toks.length > 1 && toks.every(t => q.includes(' ' + t + ' '));
  };
  const PROFILES = {
    'triagem-b2b': [
      ['avaliar uma oportunidade', 10, 'avaliação inicial de oportunidade'],['primeiro diagnostico', 12, 'diagnóstico inicial'],['triagem', 17, 'triagem de oportunidade'],['pre viabilidade', 15, 'pré-viabilidade'],['qualificar parceiro', 15, 'qualificação de parceiro']
    ],
    'bp-b2b': [
      ['business plan', 19, 'Business Plan'],['plano de negocios', 20, 'plano de negócios'],['viabilidade', 9, 'viabilidade econômica'],['parceria com banco', 14, 'parceria bancária'],['parceria b2b', 12, 'parceria B2B'],['projetar vendas', 10, 'projeções comerciais'],['estudo financeiro', 12, 'estudo financeiro'],['b2b', 5, 'canal B2B']
    ],
    'grande-conta-rfp': [
      ['rfp', 27, 'RFP'],['edital', 15, 'edital comercial'],['grande conta', 20, 'grande conta'],['concorrencia', 13, 'concorrência'],['multicanal', 9, 'múltiplos canais'],['proposta tecnico financeira', 20, 'proposta técnico-financeira']
    ],
    'viabilidade-retorno': [
      ['valuation', 20, 'valuation'],['retorno do investimento', 16, 'retorno de investimento'],['tir', 13, 'taxa interna de retorno'],['fluxo de caixa', 11, 'fluxo de caixa'],['rentabilidade do projeto', 12, 'rentabilidade econômica'],['investimento', 6, 'investimento'],['due diligence financeira', 11, 'análise financeira']
    ],
    'performance-portfolio': [
      ['portfolio', 16, 'portfólio'],['carteira', 10, 'carteira de negócios'],['margem', 12, 'margens'],['mix', 9, 'mix de produtos'],['performance comercial', 9, 'performance comercial'],['rentabilidade', 13, 'rentabilidade'],['reduzir custos', 8, 'eficiência econômica']
    ],
    'produtos-receitas': [
      ['novo produto', 17, 'novo produto'],['desenvolver produto', 15, 'desenvolvimento de produto'],['seguro', 9, 'seguros'],['seguros', 9, 'seguros'],['sqg', 22, 'seguro de quebra de garantia'],['quebra de garantia', 25, 'seguro de quebra de garantia'],['receita acessoria', 18, 'receitas acessórias'],['prestamista', 15, 'seguro prestamista'],['rastreadores', 13, 'soluções complementares'],['drones', 10, 'novas soluções']
    ],
    'canais-b2b2c': [
      ['b2b2c', 24, 'modelo B2B2C'],['corretores', 17, 'rede de corretores'],['corretor', 17, 'rede de corretores'],['parceiros comerciais', 14, 'parceiros comerciais'],['canal de distribuicao', 19, 'canal de distribuição'],['comissao', 9, 'política de comissionamento'],['credenciamento', 12, 'credenciamento'],['lojas de veiculos', 11, 'rede de lojas'],['imobiliarias', 11, 'canal imobiliário'],['parcerias estrategicas', 11, 'parcerias estratégicas']
    ],
    'lancamento-canal': [
      ['treinar vendedores', 20, 'treinamento de vendedores'],['treinamento', 14, 'treinamento'],['playbook', 19, 'playbook'],['lancamento comercial', 17, 'lançamento comercial'],['preparar equipe', 15, 'preparação da equipe'],['equipe de vendas', 11, 'equipe de vendas']
    ],
    'wl-administradora': [
      ['white label', 27, 'modelo White Label'],['wl', 27, 'modelo White Label'],['administradora', 10, 'administradora de consórcios'],['abrir administradora', 29, 'abertura de administradora'],['nova administradora', 25, 'nova administradora'],['operacao propria', 22, 'operação própria'],['banco central', 13, 'implantação regulada'],['autorizacao bacen', 19, 'autorização regulatória'],['estruturar consorcio', 17, 'estruturação de consórcios']
    ],
    'implantacao-processos': [
      ['implantar operacao', 20, 'implantação de operação'],['implantacao', 8, 'implantação'],['implantar', 7, 'implantação'],['simulador multicanal', 18, 'simulador multicanal'],['integrar sistemas', 16, 'integração de sistemas'],['processos operacionais', 13, 'processos operacionais'],['colocar em producao', 17, 'entrada em produção']
    ],
    'transformacao-ia': [
      ['automacao', 17, 'automação'],['automatizar', 17, 'automação'],['inteligencia artificial', 23, 'inteligência artificial'],['ia', 18, 'inteligência artificial'],['robotizar', 18, 'automação de processos'],['rpa', 16, 'automação de processos'],['otimizar processos', 13, 'otimização de processos'],['reduzir retrabalho', 16, 'redução de retrabalho']
    ],
    'bpo-comercial': [
      ['higienizar leads', 18, 'higienização de oportunidades'],['leads', 9, 'oportunidades comerciais'],['relatorio mensal', 14, 'relatórios mensais'],['rotina comercial', 22, 'rotina comercial'],['backoffice comercial basico', 20, 'backoffice comercial']
    ],
    'bpo-gerencial': [
      ['bpo', 11, 'terceirização operacional'],['backoffice', 14, 'backoffice'],['gestao mensal', 14, 'gestão mensal'],['recorrente', 10, 'serviço recorrente'],['pipeline', 16, 'gestão do pipeline'],['propostas', 10, 'gestão de propostas'],['terceirizar', 12, 'terceirização de rotinas'],['terceirizacao', 12, 'terceirização de rotinas'],['indicadores mensais', 13, 'indicadores recorrentes']
    ],
    'bpo-tecnico': [
      ['prestadores criticos', 20, 'gestão de prestadores críticos'],['suporte tecnico', 18, 'suporte técnico'],['celula tecnica', 25, 'célula técnica'],['terceirizacao tecnica', 21, 'terceirização técnica'],['supervisao de fornecedores', 20, 'supervisão de fornecedores']
    ],
    'executivo-fracionado': [
      ['fractional', 28, 'liderança executiva parcial'],['diretor interino', 26, 'diretoria interina'],['gestor interino', 23, 'gestão interina'],['diretor por horas', 24, 'executivo parcial'],['executivo fracionado', 26, 'executivo fracionado'],['diretor terceirizado', 24, 'direção executiva terceirizada']
    ],
    'seguros-mga': [
      ['mga', 29, 'estrutura MGA'],['mgu', 29, 'estrutura MGU'],['subscricao delegada', 27, 'subscrição delegada'],['assessoria de seguros', 22, 'assessoria de seguros'],['estrutura seguradora', 15, 'operação de seguros']
    ],
    'sinistros-prestadores': [
      ['sinistros', 28, 'gestão de sinistros'],['sinistro', 28, 'gestão de sinistros'],['oficinas', 15, 'rede de prestadores'],['regulacao de sinistro', 26, 'regulação de sinistro'],['perda total', 14, 'perda total'],['fraudes em sinistros', 25, 'prevenção a fraudes']
    ]
  };
  const SERVICE_SIGNALS = {
    D01:['diagnostico comercial','diagnostico da oportunidade'], D02:['pesquisa de mercado','benchmark'],
    D03:['analise de base','base ativa','dados da carteira'], D04:['potencial b2b','potencial b2b2c','dimensionar mercado'],
    D05:['benchmark de comissao','benchmark remuneracao'], D06:['due diligence de parceiro'], D07:['analise de portfolio','mix de produtos'],
    V01:['pre viabilidade','previabilidade'], V02:['unit economics','economia da cota'],V03:['business plan executivo','bp de canal'],
    V04:['estudo de viabilidade','viabilidade completa'], V05:['business plan integrado'],V06:['modelagem white label','modelagem administradora'],
    V07:['valuation','avaliacao economica'],V08:['stress test','inadimplencia da carteira'],V09:['rfp','responder concorrencia'],
    C01:['modelo de distribuicao'],C02:['politica de comissao','estorno de comissao'],C03:['playbook de vendas'],
    C04:['qualificacao de parceiro'],C05:['piloto comercial'],C06:['implantacao comercial'],C07:['treinamento','treinar corretores'],
    C08:['apresentacao executiva'],C09:['receitas acessorias','seguros complementares'],
    O01:['novo produto','desenvolver produto'], O02:['mapear processos'], O03:['contemplacao','garantias'],
    O04:['cobranca','recuperacao de credito','recuperar inadimplentes'], O05:['omnichannel','jornada digital'],
    O06:['raci','sla','scorecard operacional'],O07:['arquitetura bpo'],O08:['implantar processos'],O09:['solucoes complementares'],
    T01:['dashboard','painel executivo','painel indicadores'], T02:['simulador excel','modelo excel','planilha simulador'],
    T03:['simulador integrado','simulador multicanal','simulador consorcio'], T04:['especificacao crm','desenho de portal'],
    T05:['prototipo web','prototipo funcional'], T06:['automacao comercial','automatizar rotinas comerciais'],
    T07:['integracao de dados'], T08:['qualidade de dados','governanca dados'],
    B01:['higienizacao','qualificacao de oportunidades'],B02:['relatorios mensais'],B03:['backoffice de propostas'],
    B04:['pmo mensal','gestao de pipeline'],B05:['triagem de documentos','credenciamento documental'],
    B06:['sustentacao de scorecards'],B07:['celula remota','suporte a parceiros'],B08:['gestao de prestadores'],
    G03:['pld ft','kyc'],G07:['pmo interareas'],K02:['dossie autorizacao'],K03:['banco central','bacen']
  };
  function signalScore(text, arr){
    let value=0, hits=[];
    for (const [pattern, weight, label] of arr || []) {
      if (containing(text, pattern)) {value+=weight;hits.push({label,weight});}
    }
    hits.sort((a,b)=>b.weight-a.weight);
    return {value,hits};
  }
  function tokenMatch(text, hay){
    const q=new Set(words(text)), h=new Set(words(hay));
    let points=0;
    for(const w of q) if(h.has(w))points+=1.05;
    return Math.min(7,points);
  }
  function inferredStage(text){
    const q=normal(text);
    if(/\b(bpo|backoffice|terceiriz|mensal|rotina|recorrent|continuad|suporte mensal|gestao de prestador)\w*\b/.test(q))return '03';
    if(/\b(implant|automat|integr|operacionaliz|estrutur|lancament|treinar|desenvolver produto|distribuicao)\w*\b/.test(q))return '02';
    if(/\b(diagnostic|viabil|estudo|avali|estrateg|planeja|business plan|bp|investiment)\w*\b/.test(q))return '01';
    return 'auto';
  }
  const broadTerms=/\b(implant|estrutur|gestao|viabilidade|planejamento|expandir|transformacao|multicanal|abertura|projeto|estrategia|grande conta)\w*\b/;
  const narrowTerms=/\b(dashboard|painel|simulador|playbook|treinamento|benchmark|regua de cobranca|matriz raci|politica de comissao|contrato|rfp|pmo)\b/;
  function scoreSolutions(text, solutions, stage){
    return solutions.map(s=>{
      const scored=signalScore(text,PROFILES[s.id]);
      const overlap=tokenMatch(text, [s.name,s.short,s.description,...(s.topics||[])].join(' '));
      const affinity=stage==='auto'?0:s.line===stage?3:-2;
      return {...s,score:scored.value+overlap+affinity,match:scored.hits.map(x=>x.label)};
    }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  }
  function scoreServices(text,services,stage){
    const nq=normal(text), qt=new Set(words(text));
    return services.map(s=>{
      const signals=(SERVICE_SIGNALS[s.code]||[]).map(x=>[x,14,x]);
      const sig=signalScore(text,signals);
      const nameMatch=tokenMatch(text,s.name)*1.8;
      const scopeMatch=tokenMatch(text, [s.scope,s.area,...(s.deliverables||[])].join(' '))*.45;
      let score=sig.value+nameMatch+scopeMatch;
      if (nq.includes(normal(s.name)))score+=28;
      if(qt.has(s.code.toLowerCase()))score+=50;
      if(stage!=='auto')score+=s.line===stage?2:-1;
      return {...s,score,match:sig.hits.map(x=>x.label)};
    }).sort((a,b)=>b.score-a.score||a.code.localeCompare(b.code));
  }
  function recommends(input, catalog){
    const text=String(input?.need||'').slice(0,3000).trim(), choice=input?.choice||'auto', stage=input?.stage||'auto';
    const result={understood:[],items:[],alternatives:[],questions:[],confidence:'baixa',message:'',stage};
    if(text.length<12){result.message='Conte um pouco mais sobre o desafio e o resultado esperado.';return result;}
    const nq=normal(text);
    const phase=stage==='auto'?inferredStage(text):stage;
    const sol=scoreSolutions(text,catalog.solutions,phase), svc=scoreServices(text,catalog.services,phase);
    const explicitCode=(nq.match(/\b[a-z][0-9]{2}\b/)||[])[0];
    const explicitService=explicitCode&&catalog.services.find(s=>s.code.toLowerCase()===explicitCode);
    let kind=choice==='unique'?'servico':choice==='combo'?'solucao':'auto';
    if(kind==='auto'){
      if(explicitService || (narrowTerms.test(nq)&&!broadTerms.test(nq)))kind='servico';
      else if(svc[0]?.score>=22 && sol[0]?.score<=svc[0].score*.7)kind='servico';
      else kind='solucao';
    }
    let scored=kind==='servico'?svc:sol;
    if(choice==='auto' && kind==='solucao' && sol[0]?.score<9 && svc[0]?.score>=13){kind='servico';scored=svc;}
    if(choice==='auto' && kind==='servico' && svc[0]?.score<12 && sol[0]?.score>=12){kind='solucao';scored=sol;}
    if(!scored.length || scored[0].score < (kind==='servico'?7:9)){
      result.message='Não encontrei correspondência suficiente para recomendar uma contratação específica.';
      result.questions=['Qual é o setor ou tipo de operação?','Você busca um estudo, implantação ou apoio mensal?','Que resultado precisa receber da Astrion?'];
      return result;
    }
    const selected=[];
    const base=scored[0];
    const top={type:kind,id:kind==='servico'?base.code:base.id,name:base.name,score:base.score,match:base.match.slice(0,3),line:base.line};
    selected.push(top);
    const reason=base.match.length?base.match.slice(0,3):['escopo e entregáveis relacionados à descrição'];
    result.understood=reason;
    result.confidence=base.score>=26?'alta':base.score>=15?'moderada':'inicial';
    // Para demandas explicitamente multidisciplinares, recomenda até três frentes sem componentes duplicados.
    if(choice==='auto' && kind==='solucao' && /\b(e tambem|alem disso|junto com|ao mesmo tempo|e depois|em paralelo|mais o|tanto .* quanto)\b/.test(nq)){
      for(const candidate of sol.slice(1)){
        if(selected.length>=3)break;
        if(candidate.score<9||candidate.score<base.score*.28||candidate.match.length<1)continue;
        const existing=selected.map(sel=>catalog.solutions.find(s=>s.id===sel.id));
        const codes=new Set(existing.flatMap(s=>s?.codes||[]));
        const uniqueCodes=(candidate.codes||[]).filter(x=>!codes.has(x));
        if(candidate.codes.length && uniqueCodes.length/candidate.codes.length<.58)continue;
        if(existing.some(x=>x.line===candidate.line && candidate.score<base.score*.82))continue;
        selected.push({type:'solucao',id:candidate.id,name:candidate.name,score:candidate.score,match:candidate.match.slice(0,3),line:candidate.line});
      }
    }
    result.items=selected;
    result.alternatives=scored.slice(1).filter(x=>!selected.some(sel=>sel.id===(kind==='servico'?x.code:x.id)) && x.score>=Math.max(7,base.score*.49)).slice(0,3).map(x=>({type:kind,id:kind==='servico'?x.code:x.id,name:x.name,score:x.score,match:x.match.slice(0,2)}));
    if(result.confidence==='inicial')result.questions=['Qual é o resultado esperado?','Qual é o prazo ou fase da iniciativa?'];
    result.message=selected.length>1?'Identifiquei frentes complementares para o desafio descrito.':'Identifiquei a oferta mais aderente ao desafio descrito.';
    return result;
  }
  const api={recommend:recommends,normalize:normal,profiles:PROFILES};
  root.ASTRION_INTELLIGENCE=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
