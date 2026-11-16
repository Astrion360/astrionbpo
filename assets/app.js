(() => {
  'use strict';
  const DATA = window.ASTRION_DATA || {services: [], solutions: [], lines: {}};
  const CFG = window.ASTRION_CONFIG || {};
  const ENGINE = window.ASTRION_INTELLIGENCE;
  const CART = window.ASTRION_CART;
  const services = DATA.services || [];
  const solutions = DATA.solutions || [];
  const byCode = new Map(services.map(x => [x.code, x]));
  const bySolution = new Map(solutions.map(x => [x.id, x]));
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
  const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const decBR = v => (Number(v) || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
  const solutionUrl = id => 'solucao.html?id=' + encodeURIComponent(id);
  const serviceUrl = code => 'servico.html?codigo=' + encodeURIComponent(code);
  const queryUrl = q => 'assistente.html#necessidade=' + encodeURIComponent(q);
  const validPrice = 'Valores de referência até ' + (CFG.priceValidUntil || '12/12/2026') + '. Escopo e condições dependem de proposta específica.';
  function txt(id, value) { const el = $('#'+id); if(el) el.textContent = String(value ?? ''); }
  function toast(message) { const el = $('#toast'); if (!el) return; el.textContent = message; el.hidden = false; clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.hidden=true},3500);}
  async function copy(text) {
    try {await navigator.clipboard.writeText(text);toast('Resumo copiado para a área de transferência.');}
    catch(e){const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();if(ok)toast('Resumo copiado para a área de transferência.');else toast('Selecione e copie o texto do resumo.');}
  }
  function cartCount(){const el=$('#cart-count');if(el&&CART){el.textContent=String(CART.get().length);el.setAttribute('aria-label',CART.get().length+' itens selecionados');}}
  function addToCart(type,id,notify=true){
    if(!CART)return false;
    const added=CART.add(type,id);cartCount();
    if(notify)toast(added?'Adicionado ao seu carrinho de orçamento.':'Este item já está no carrinho ou não está disponível.');
    return added;
  }
  function cartItemName(entry){return CART?.describe(entry)?.name||entry.id;}
  function cartText(extra=''){
    const s=CART.summary();
    const lines=['SOLICITAÇÃO DE PROPOSTA — ASTRION ASSESSORIA','',`Itens selecionados: ${s.selected}`,''];
    s.entries.forEach((e,i)=>{const x=CART.describe(e);lines.push(`${i+1}. ${x.name} (${e.type==='solucao'?'Solução':'Serviço'}) — ${x.price}`);});
    lines.push('','SERVIÇOS INCLUÍDOS (SEM DUPLICIDADE)');
    s.services.forEach(x=>lines.push(`• ${x.code} — ${x.name}: ${x.price}`));
    lines.push('',`Projetos pontuais: ${decBR(s.projects)}`,`Mensalidades de referência: ${decBR(s.monthly)}/mês`);
    if(s.unpriced.length)lines.push('Sob consulta: '+s.unpriced.map(x=>x.name).join('; '));
    lines.push('',validPrice,'Valores pontuais e mensais não são somados entre si. A seleção não configura compra nem contratação.');
    if(extra.trim())lines.push('','Contexto adicional:',extra.trim());
    return lines.join('\n');
  }
  function solutionCard(s){return `<a class="solution-card" href="${solutionUrl(s.id)}"><span class="card-line">${esc(s.lineName)}</span><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><div class="mini-meta"><span>${esc(s.price)}</span><span aria-hidden="true">↗</span></div></a>`;}
  function serviceCard(s){return `<a href="${serviceUrl(s.code)}" class="service-card"><div class="service-top"><span class="pill">${esc(s.code)}</span><span class="mini-tag">${esc(s.lineName)}</span></div><h3>${esc(s.name)}</h3><p>${esc(s.area)}</p><div class="service-bottom"><span>${esc(s.level)} complexidade</span><span class="small-price">${esc(s.price)}</span></div></a>`;}
  function setupGlobal(){
    const menu=$('#menu-toggle');const nav=$('#main-nav');
    if(menu&&nav) {menu.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',open?'true':'false');menu.setAttribute('aria-label',open?'Fechar navegação':'Abrir navegação');});nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');}});}
    txt('year',new Date().getFullYear());cartCount();
    const hs=$('#hero-search');if(hs){hs.addEventListener('submit',e=>{e.preventDefault();const q=$('#hero-need').value.trim();location.href=q?queryUrl(q):'assistente.html';});}
  }
  function setupHome(){const el=$('#home-solutions');if(!el)return;const ids=['bp-b2b','wl-administradora','canais-b2b2c','viabilidade-retorno','transformacao-ia','bpo-gerencial'];el.innerHTML=ids.map(id=>bySolution.get(id)).filter(Boolean).map(solutionCard).join('');}
  function setupSolutions(){
    const grid=$('#solutions-grid');if(!grid)return;
    let line=['01','02','03'].includes(params.get('linha'))?params.get('linha'):'all';
    function render(){const list=solutions.filter(s=>line==='all'||s.line===line);grid.innerHTML=list.map(solutionCard).join('');txt('solution-count',`${list.length} soluções disponíveis`);$$('#solution-line-filters .chip').forEach(ch=>ch.classList.toggle('active',ch.dataset.line===line));}
    $$('#solution-line-filters .chip').forEach(ch=>ch.addEventListener('click',()=>{line=ch.dataset.line;render();history.replaceState(null,'',line==='all'?'solucoes.html':'solucoes.html?linha='+line);}));render();
  }
  function setupServices(){
    const grid=$('#services-grid');if(!grid)return;
    const q=$('#service-query'),line=$('#service-line'),area=$('#service-area'),fmt=$('#service-format');
    const areas=[...new Set(services.map(s=>s.area))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    area.innerHTML='<option value="all">Todas as áreas</option>'+areas.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    if(params.get('linha')&&['01','02','03'].includes(params.get('linha')))line.value=params.get('linha');
    let page=1;const perPage=16;
    function render(){
      const query=norm(q.value);const list=services.filter(s=>{
        if(line.value!=='all'&&s.line!==line.value)return false;
        if(area.value!=='all'&&s.area!==area.value)return false;
        if(fmt.value!=='all'&&s.priceType!==fmt.value)return false;
        const hay=norm([s.code,s.name,s.area,s.lineName,s.scope,s.deliverables.join(' ')].join(' '));
        return !query || query.split(' ').every(t=>hay.includes(t));
      });
      const total=Math.max(1,Math.ceil(list.length/perPage));page=Math.min(page,total);
      grid.innerHTML=list.length?list.slice((page-1)*perPage,page*perPage).map(serviceCard).join(''):'<div class="no-results"><h3>Nenhum serviço encontrado</h3><p style="margin-top:10px">Ajuste a busca ou descreva sua necessidade no <a href="assistente.html" class="text-link">assistente de soluções ↗</a>.</p></div>';
      txt('service-count',`${list.length} serviço${list.length===1?'':'s'} encontrado${list.length===1?'':'s'}`);
      const pg=$('#services-pagination');pg.innerHTML=list.length>perPage?`<button type="button" class="btn btn-outline btn-small" id="prev-page" ${page===1?'disabled':''}>← Anterior</button><span class="pill">Página ${page} de ${total}</span><button type="button" class="btn btn-outline btn-small" id="next-page" ${page===total?'disabled':''}>Próxima →</button>`:'';
      $('#prev-page')?.addEventListener('click',()=>{page--;render();grid.scrollIntoView({behavior:'smooth',block:'start'});});
      $('#next-page')?.addEventListener('click',()=>{page++;render();grid.scrollIntoView({behavior:'smooth',block:'start'});});
    }
    [q,line,area,fmt].forEach(el=>el.addEventListener(el===q?'input':'change',()=>{page=1;render();}));
    $('#clear-filters')?.addEventListener('click',()=>{q.value='';line.value='all';area.value='all';fmt.value='all';page=1;render();});render();
  }
  function errorState(el,msg='Não localizamos este item no catálogo.') { if(el)el.innerHTML=`<div class="container" style="padding:60px 0"><h2>Item não encontrado</h2><p style="color:var(--muted);margin:14px 0 26px">${esc(msg)}</p><a class="btn btn-primary" href="solucoes.html">Ver soluções</a></div>`; }
  function setupSolutionDetail(){
    const el=$('#solution-detail-page');if(!el)return;
    const s=bySolution.get(params.get('id'));
    if(!s){errorState(el);return;}
    document.title=s.name+' | Astrion Assessoria';
    txt('solution-line-heading',s.lineName);txt('solution-detail-title',s.name);txt('solution-detail-lead',s.short);
    txt('solution-description',s.description);txt('solution-target',s.target);txt('solution-price',s.price);
    txt('solution-aside-line',s.lineName);txt('solution-aside-model',s.priceType==='mensal'?'Mensalidade':s.priceType==='projeto'?'Fee por projeto':'Sob consulta');
    txt('solution-count-items',s.codes.length?String(s.codes.length):'Projeto especializado');
    txt('solution-price-note',s.priceType==='consulta'?'Escopo, equipe e remuneração são definidos em proposta.':s.priceType==='mensal'?'Mensalidade de referência dos componentes listados.':'Valor de referência dos componentes listados.');
    $('#solution-deliverables').innerHTML=s.outcomes.map(x=>`<li>${esc(x)}</li>`).join('');
    const items=$('#solution-items');items.innerHTML=s.codes.length?s.codes.map(code=>{const r=byCode.get(code);return `<a class="comparison-card" href="${serviceUrl(code)}" style="display:flex;align-items:center;justify-content:space-between;gap:15px"><span><span class="pill">${esc(code)}</span><strong style="display:block;margin-top:8px;font-size:14px;color:var(--navy)">${esc(r.name)}</strong></span><span class="small-price">${esc(r.price)} ↗</span></a>`;}).join(''):'<div class="info-box"><strong>Projeto sob medida</strong><p>O detalhamento das frentes de trabalho, especialistas e critérios de entrega é realizado após diagnóstico inicial.</p></div>';
    $('#solution-contact').href='contato.html?solucao='+encodeURIComponent(s.name);
    $('#solution-add-cart')?.addEventListener('click',()=>addToCart('solucao',s.id));
  }
  function setupServiceDetail(){
    const container=$('#service-detail-title');if(!container)return;
    const s=byCode.get((params.get('codigo')||'').toUpperCase());
    if(!s){errorState($('.content-section')?.parentElement,'Código de serviço inexistente.');return;}
    document.title=s.code+' · '+s.name+' | Astrion Assessoria';
    txt('service-crumb',s.code);txt('service-line-heading',s.lineName);txt('service-detail-title',s.name);txt('service-detail-lead',s.area+' · '+s.code);
    txt('service-scope',s.scope);txt('service-timing',s.timing);txt('service-acceptance',s.acceptance);txt('service-metrics',s.metrics);txt('service-exclusions',s.exclusions);
    txt('service-detail-price',s.price);txt('service-price-note',s.priceType==='consulta'?'Preço e formato são definidos após o dimensionamento do serviço.':s.priceType==='mensal'?'Mensalidade de referência para o escopo a ser pactuado.':'Preço de referência por projeto; escopo a pactuar.');
    txt('service-aside-code',s.code);txt('service-aside-area',s.area);txt('service-aside-level',s.level);txt('service-aside-format',s.format);
    $('#service-deliverables').innerHTML=s.deliverables.map(x=>`<li>${esc(x)}</li>`).join('');
    $('#service-contact').href='contato.html?servico='+encodeURIComponent(s.code+' — '+s.name);
    $('#service-add-cart')?.addEventListener('click',()=>addToCart('servico',s.code));
  }
  function recommendationCard(rec,title,reason){
    const isSolution=rec.type==='solucao';
    const x=isSolution?bySolution.get(rec.id):byCode.get(rec.id);
    if(!x)return '';
    const path=isSolution?solutionUrl(rec.id):serviceUrl(rec.id);
    const inCart=CART?.get().some(e=>e.type===rec.type&&e.id===rec.id);
    const notes=isSolution&&x.codes.length?`<div class="components"><span class="mini-tag">Serviços que compõem esta solução</span>${x.codes.map(c=>{const r=byCode.get(c);return `<a href="${serviceUrl(c)}"><span><strong>${esc(c)}</strong> · ${esc(r.name)}</span><small>${esc(r.price)} ↗</small></a>`;}).join('')}</div>`:!isSolution?`<div class="components"><span class="mini-tag">Entregáveis previstos</span><ul class="bullet-list">${x.deliverables.map(d=>`<li>${esc(d)}</li>`).join('')}</ul></div>`:'';
    const why=rec.match?.length?'Identificamos no seu desafio: '+rec.match.join(', ')+'.':reason;
    return `<article class="result-card premium-result" data-recommendation-type="${esc(rec.type)}" data-recommendation-id="${esc(rec.id)}"><div class="result-line"><span class="pill ${title==='Recomendação principal'?'pill-gold':''}">${esc(title)}</span><span class="pill">${isSolution?'Solução combinada':'Serviço individual'}</span><span class="pill">${esc(x.lineName)}</span></div><div class="result-intro"><div><h3>${esc(x.name)}</h3><p>${esc(why||'Entrega alinhada ao objetivo descrito.')}</p></div><div class="result-price-box"><span>Valor de referência</span><strong>${esc(x.price)}</strong></div></div><p class="form-note">${x.priceType==='consulta'?'Escopo e preço definidos após dimensionamento.':x.priceType==='mensal'?'Mensalidade de referência; prazo contratual a definir.':'Preço pontual de referência; confirmação mediante proposta.'}</p>${notes}<div class="result-actions"><button type="button" class="btn ${inCart?'btn-added':'btn-primary'}" data-cart-type="${rec.type}" data-cart-id="${esc(rec.id)}">${inCart?'✓ Já está no carrinho':'+ Adicionar ao carrinho'}</button><button type="button" class="btn btn-decline" data-skip-id="${esc(rec.id)}" data-skip-type="${esc(rec.type)}">Não adicionar</button><a class="text-link" href="${path}">Ver detalhes ↗</a></div><div class="decision-state" hidden></div></article>`;
  }
  function setupAssistant(){
    const form=$('#assistant-form');if(!form)return;
    const input=$('#assistant-description'),intent=$('#assistant-intent'),phase=$('#assistant-phase');
    let latestResult=null;
    txt('assistant-mode-label','Análise feita na própria ferramenta, sem IA externa. Você decide o que incluir no orçamento.');
    $$('.example').forEach(ex=>ex.addEventListener('click',()=>{input.value=ex.dataset.example;input.focus();}));
    $('#assistant-clear')?.addEventListener('click',()=>{form.reset();$('#assistant-results').hidden=true;latestResult=null;history.replaceState(null,'','assistente.html');input.focus();});
    const hashParams=new URLSearchParams(location.hash.slice(1));const initial=hashParams.get('necessidade')||params.get('necessidade');if(initial)input.value=initial.slice(0,3000);
    function updateCartVisuals(){
      const entries=CART?.get()||[];
      $$('[data-recommendation-id]').forEach(card=>{
        const type=card.dataset.recommendationType,id=card.dataset.recommendationId;
        const exists=entries.some(e=>e.type===type&&e.id===id);
        const button=$('[data-cart-id]',card);
        if(!button)return;
        button.textContent=exists?'✓ Já está no carrinho':'+ Adicionar ao carrinho';
        button.classList.toggle('btn-added',exists);button.classList.toggle('btn-primary',!exists);
        const decline=$('[data-skip-id]',card);
        if(decline)decline.textContent=exists?'Retirar do carrinho':'Não adicionar';
        card.classList.toggle('is-added',exists);
      });
      txt('recommendation-cart-count',entries.length);
      cartCount();
    }
    form.addEventListener('submit',e=>{
      e.preventDefault();const need=input.value.trim();if(need.length<12){toast('Descreva o desafio com pelo menos 12 caracteres.');input.focus();return;}
      const result=ENGINE.recommend({need,choice:intent.value,stage:phase.value},{services,solutions});
      latestResult=result;
      const target=$('#recommendation-items');
      if(!result.items.length){
        txt('recommendation-title','Precisamos de mais contexto');
        target.innerHTML=`<div class="result-card"><h3>Vamos entender melhor o desafio.</h3><p>${esc(result.message)}</p><ul class="bullet-list" style="margin-top:20px">${(result.questions||[]).map(q=>`<li>${esc(q)}</li>`).join('')}</ul><div class="result-actions"><a class="btn btn-outline" href="servicos.html">Explorar catálogo</a><button class="btn btn-primary" type="button" id="assistant-request">Enviar desafio à Astrion</button></div></div>`;
      }else{
        txt('recommendation-title',result.items.length>1?'Soluções para avaliar':'Nossa indicação para seu desafio');
        target.innerHTML=`<div class="assistant-choice-intro"><div class="choice-symbol" aria-hidden="true">✦</div><div><strong>Você decide o que incluir no orçamento</strong><p>O assistente não adicionou nenhum item automaticamente. Analise cada recomendação e escolha <b>Adicionar</b> ou <b>Não adicionar</b>.</p></div><a href="carrinho.html" class="btn btn-outline btn-small">Carrinho (<span id="recommendation-cart-count">${CART?.get().length||0}</span>) ↗</a></div>`;
        target.innerHTML+=result.items.map((r,i)=>recommendationCard(r,i===0?'Recomendação principal':'Frente complementar','')).join('');
        if(result.alternatives.length)target.innerHTML+=`<div class="assistant-alts"><h3>Outras possibilidades</h3><p>São alternativas opcionais. Escolha somente as que fizerem sentido.</p>${result.alternatives.map(r=>recommendationCard(r,'Alternativa','')).join('')}</div>`;
        if(result.questions.length)target.innerHTML+=`<div class="detail-panel"><h3>Informações para refinar o escopo</h3><ul class="bullet-list">${result.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></div>`;
        target.innerHTML+=`<div class="assistant-finish"><div><strong>Quer apresentar essa necessidade à Astrion?</strong><p>Você pode solicitar uma análise mesmo sem adicionar serviços ao carrinho.</p></div><button class="btn btn-gold" type="button" id="assistant-request">Enviar desafio para análise →</button></div>`;
      }
      txt('recommendation-mode','Análise própria Astrion · seleção opcional');
      const results=$('#assistant-results');results.hidden=false;updateCartVisuals();results.scrollIntoView({behavior:'smooth',block:'start'});
    });
    $('#assistant-results')?.addEventListener('click',e=>{
      const add=e.target.closest('[data-cart-id]');
      if(add){
        const exists=CART?.get().some(x=>x.type===add.dataset.cartType&&x.id===add.dataset.cartId);
        if(exists){toast('Este item já está no carrinho. Use “Retirar do carrinho” para removê-lo.');}
        else{addToCart(add.dataset.cartType,add.dataset.cartId);}
        const card=add.closest('.premium-result');card?.classList.remove('is-declined');const state=$('.decision-state',card);if(state)state.hidden=true;
        updateCartVisuals();return;
      }
      const skip=e.target.closest('[data-skip-id]');
      if(skip){
        const type=skip.dataset.skipType,id=skip.dataset.skipId;
        const exists=CART?.get().some(x=>x.type===type&&x.id===id);
        const card=skip.closest('.premium-result');const state=$('.decision-state',card);
        if(exists){CART.remove(type,id);toast('Serviço removido do carrinho.');card?.classList.remove('is-declined');if(state)state.hidden=true;}
        else{card?.classList.add('is-declined');if(state){state.hidden=false;state.innerHTML='<span>Esta indicação ficará fora do orçamento.</span> <button type="button" class="reconsider-link" data-reconsider>Reconsiderar</button>';}}
        updateCartVisuals();return;
      }
      const reconsider=e.target.closest('[data-reconsider]');if(reconsider){const card=reconsider.closest('.premium-result');card?.classList.remove('is-declined');const state=$('.decision-state',card);if(state)state.hidden=true;return;}
      if(e.target.closest('#assistant-request')){
        const record={need:input.value.trim(),at:Date.now()};
        try{sessionStorage.setItem('astrion-briefing-draft-v1',JSON.stringify(record));}catch(_){/* session storage can be disabled */}
        location.href='contato.html?origem=assistente';
      }
    });
    if(initial&&input.value.length>=12)form.requestSubmit();
  }
  function setupCart(){
    const list=$('#cart-items');if(!list||!CART)return;
    function render(){
      const s=CART.summary();cartCount();
      txt('cart-total-items',s.selected+' item'+(s.selected===1?'':'s')+' selecionado'+(s.selected===1?'':'s'));
      const empty=$('#cart-empty');empty.hidden=!!s.selected;
      const content=$('#cart-content');content.hidden=!s.selected;
      if(!s.selected){list.innerHTML='';return;}
      list.innerHTML=s.entries.map(e=>{
        const x=CART.describe(e);const href=e.type==='solucao'?solutionUrl(e.id):serviceUrl(e.id);
        return `<article class="cart-row"><div class="cart-row-main"><span class="pill">${e.type==='solucao'?'Solução comercial':'Serviço individual'}</span><h3><a href="${href}">${esc(x.name)}</a></h3><p>${esc(x.lineName)} · ${esc(x.price)}</p>${e.type==='solucao'&&x.codes.length?`<small>Inclui: ${esc(x.codes.join(' · '))}</small>`:''}</div><button class="cart-remove" type="button" data-remove-type="${e.type}" data-remove-id="${esc(e.id)}" aria-label="Remover ${esc(x.name)}">Remover ×</button></article>`;
      }).join('');
      txt('cart-projects',decBR(s.projects));txt('cart-monthly',decBR(s.monthly)+'/mês');
      txt('cart-consult',s.unpriced.length?s.unpriced.map(x=>x.name).join('; '):'Nenhum');
      const details=$('#cart-components');
      details.innerHTML=s.services.map(x=>`<div class="cart-component"><span><strong>${esc(x.code)}</strong> ${esc(x.name)}</span><span>${esc(x.price)}</span></div>`).join('');
      $('#cart-overlap').hidden=s.duplicates.length===0;
      txt('cart-overlap','Os serviços '+s.duplicates.join(', ')+' aparecem em mais de uma seleção e foram considerados apenas uma vez nos valores.');
    }
    list.addEventListener('click',e=>{const b=e.target.closest('[data-remove-id]');if(b){CART.remove(b.dataset.removeType,b.dataset.removeId);render();toast('Item retirado do carrinho.');}});
    $('#cart-clear')?.addEventListener('click',()=>{CART.clear();try{sessionStorage.removeItem('astrion-cart-context-v1');}catch(_){}; const context=$('#cart-context');if(context)context.value='';render();toast('Carrinho esvaziado.');});
    const cartContext=$('#cart-context');
    if(cartContext){
      try{cartContext.value=sessionStorage.getItem('astrion-cart-context-v1')||'';}catch(_){}
      cartContext.addEventListener('input',()=>{try{sessionStorage.setItem('astrion-cart-context-v1',cartContext.value.slice(0,1500));}catch(_){} });
    }
    $('#cart-copy')?.addEventListener('click',()=>copy(cartText(cartContext?.value||'')));
    render();
  }
  function setupBriefing(){
    const form=$('#briefing-form');if(!form)return;
    const objective=$('#brief-objective'), status=$('#briefing-preview'), send=$('#brief-send');
    const draftKey='astrion-briefing-draft-v1';
    const specified=params.get('solucao')||params.get('servico');
    if(specified)objective.value='Gostaria de avaliar a contratação de '+specified+'.\n\nObjetivo e contexto: ';
    const fromCart=!!(CART&&CART.get().length);
    if(fromCart)$('#brief-cart-review')?.removeAttribute('hidden');
    if(params.get('origem')==='assistente'){
      try{
        const data=JSON.parse(sessionStorage.getItem(draftKey)||'null');
        if(data?.need && Date.now()-data.at<60*60*1000){objective.value=data.need.slice(0,2500);$('#brief-assistant-review')?.removeAttribute('hidden');sessionStorage.removeItem(draftKey);}
      }catch(_){/* não há contexto armazenado */}
    }
    if(params.get('carrinho')==='1'&&fromCart&&!objective.value.trim()) objective.value='Gostaria de receber uma proposta para os serviços selecionados no carrinho. Minha necessidade é: ';
    const read=()=>({
      company:$('#brief-company').value.trim(),
      person:$('#brief-person').value.trim(),
      email:$('#brief-email').value.trim(),
      phone:$('#brief-phone').value.trim(),
      line:$('#brief-line').value,
      when:$('#brief-when').value,
      objective:objective.value.trim()
    });
    const compose=()=>{
      const x=read();const lines=['SOLICITAÇÃO DE PROPOSTA — ASTRION ASSESSORIA','',
        `Empresa: ${x.company||'Não informada'}`,`Responsável: ${x.person||'Não informado'}`,`E-mail: ${x.email||'Não informado'}`,`Telefone: ${x.phone||'Não informado'}`,`Linha comercial: ${x.line}`,`Prazo desejado: ${x.when}`,'',`OBJETIVO E CONTEXTO\n${x.objective}`];
      const count=CART?.get().length||0;
      if(count){let note='';try{note=sessionStorage.getItem('astrion-cart-context-v1')||'';}catch(_){}lines.push('','CARRINHO DE ORÇAMENTO',cartText(note));}
      else lines.push('','SERVIÇOS SELECIONADOS\nNenhum item selecionado; solicitação de análise do desafio.');
      lines.push('','Canal de origem: Catálogo digital Astrion',validPrice);
      return lines.join('\n');
    };
    const feedback=(message,kind)=>{status.hidden=false;status.className='request-feedback '+kind;status.textContent=message;status.scrollIntoView({behavior:'smooth',block:'nearest'});};
    $('#brief-copy')?.addEventListener('click',()=>{const summary=compose();copy(summary);feedback('O resumo foi copiado. Você pode compartilhá-lo por outro canal.','is-neutral');});
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(!form.reportValidity())return;
      if($('#brief-website').value)return; // honeypot
      const data=read();
      if(data.objective.length<10){feedback('Descreva a necessidade com pelo menos 10 caracteres.','is-error');objective.focus();return;}
      const endpoint=CFG.formEndpoint;
      if(!endpoint){feedback('O canal eletrônico ainda não está configurado. Utilize a opção de e-mail.','is-error');return;}
      const payload=new FormData();
      payload.append('_subject','Proposta Astrion | '+(data.company||data.person).slice(0,85).replace(/[\r\n]/g,' '));
      payload.append('nome',data.person);payload.append('email',data.email);
      payload.append('empresa',data.company);payload.append('telefone',data.phone);
      payload.append('linha_comercial',data.line);payload.append('prazo_desejado',data.when);
      payload.append('desafio',data.objective);
      payload.append('resumo_da_solicitacao',compose());
      payload.append('autorizacao_de_contato','Sim, pelo formulário do catálogo');
      payload.append('canal','Catálogo técnico-comercial Astrion');
      send.disabled=true;send.textContent='Enviando solicitação...';
      feedback('Enviando a solicitação. Você verá uma confirmação nesta página.','is-neutral');
      try{
        const response=await fetch(endpoint,{method:'POST',body:payload,headers:{Accept:'application/json'}});
        if(!response.ok)throw Error('HTTP '+response.status);
        const result=await response.json();
        if(result.errors?.length || result.ok===false)throw Error('Serviço de envio não confirmou o recebimento');
        feedback('Solicitação registrada com sucesso. O serviço de formulários confirmou o recebimento; nossa equipe poderá analisar o pedido e retornar pelo contato informado.','is-success');
        $('#brief-mailto').hidden=true;
        send.textContent='✓ Solicitação enviada';
        send.disabled=true;
        return;
      }catch(err){
        feedback('Não foi possível confirmar o envio automático. Sua solicitação permanece nesta página. Você pode tentar novamente ou abrir seu programa de e-mail.','is-error');
        const subject=encodeURIComponent('Solicitação de proposta | Astrion Assessoria');
        const body=encodeURIComponent(compose().slice(0,7000));
        const fallback=$('#brief-mailto');fallback.href=`mailto:${encodeURIComponent(CFG.contactEmail||'contato@astrion360.com.br')}?subject=${subject}&body=${body}`;
        fallback.hidden=false;
      }finally{
        if(send.textContent!=='✓ Solicitação enviada')send.disabled=false;
        if(!send.disabled)send.textContent='Tentar enviar novamente →';
      }
    });
  }
  function setupGlossary(){
    const el=$('#glossary-grid');if(!el)return;
    const dictionary=[
      ['B2B','Business-to-Business: relacionamento comercial entre empresas.'],
      ['B2B2C','Business-to-Business-to-Consumer: distribuição de produtos ao consumidor por meio de empresas parceiras.'],
      ['BP / Business Plan','Plano de negócios com projeções, custos, receitas, riscos e cenários.'],
      ['BPO','Business Process Outsourcing: terceirização de processos operacionais ou de suporte.'],
      ['WL / White Label','Modelo em que uma empresa comercializa ou oferece uma solução sob sua própria marca, conforme arranjo comercial e regulatório.'],
      ['RFP','Request for Proposal: processo formal de solicitação e avaliação de propostas.'],
      ['PMO','Project Management Office: estrutura de planejamento, acompanhamento e governança de projetos.'],
      ['KYC','Know Your Customer: procedimentos de conhecimento e verificação de clientes.'],
      ['PLD/FT','Prevenção à lavagem de dinheiro e ao financiamento do terrorismo.'],
      ['RACI','Matriz de responsáveis, aprovadores, consultados e informados pelas atividades.'],
      ['SLA','Service Level Agreement: nível de serviço estabelecido contratualmente.'],
      ['KPI','Key Performance Indicator: indicador-chave de desempenho.'],
      ['Unit economics','Análise econômica por unidade de negócio, venda, cota, cliente ou operação.'],
      ['MGA / MGU','Modelos de gestão ou subscrição de seguros com funções delegadas, sujeitos a arranjos e requisitos próprios.'],
      ['CRM','Customer Relationship Management: processo ou sistema de gestão do relacionamento comercial.'],
      ['Valuation','Estimativa de valor econômico de um negócio, operação ou carteira.'],
    ];
    el.innerHTML=dictionary.map(([term,desc])=>`<div class="plain-card"><h3>${esc(term)}</h3><p style="color:var(--muted);font-size:14px;margin-top:10px">${esc(desc)}</p></div>`).join('');
  }
  setupGlobal();setupHome();setupSolutions();setupServices();setupSolutionDetail();setupServiceDetail();setupAssistant();setupCart();setupBriefing();setupGlossary();
})();
