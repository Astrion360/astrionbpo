/* Carrinho de orçamento: seleção local, sem cadastro, sem servidor e sem checkout. */
(function(root){
 'use strict';
 const STORAGE_KEY='astrion-orcamento-v1';
 function makeStore(catalog,storage){
   const byService=new Map((catalog.services||[]).map(s=>[s.code,s]));
   const bySolution=new Map((catalog.solutions||[]).map(s=>[s.id,s]));
   let rows=[];
   function valid(e){return !!e&&((e.type==='servico'&&byService.has(e.id))||(e.type==='solucao'&&bySolution.has(e.id)));}
   function hydrate(){try{const saved=JSON.parse(storage?.getItem(STORAGE_KEY)||'[]');if(Array.isArray(saved))rows=saved.filter(valid).slice(0,40).map(e=>({type:e.type,id:e.id,source:e.source==='assistant'?'assistant':'manual'}));}catch(_){rows=[];} }
   function persist(){try{storage?.setItem(STORAGE_KEY,JSON.stringify(rows));}catch(_){/* navegador em modo privado: mantém na sessão atual */} }
   hydrate();
   function get(){return rows.map(x=>({...x}));}
   function add(type,id,source='manual'){
     const entry={type,id,source};if(!valid(entry))return false;
     if(rows.some(x=>x.type===type&&x.id===id))return false;
     if(rows.length>=40)return false;
     rows.push(entry);persist();return true;
   }
   function remove(type,id){const old=rows.length;rows=rows.filter(x=>x.type!==type||x.id!==id);if(rows.length!==old)persist();return old!==rows.length;}
   function clear(){rows=[];persist();}
   function describe(entry){return entry.type==='servico'?byService.get(entry.id):bySolution.get(entry.id);}
   function summary(){
     const seen=new Set(),unique=[],unpriced=[],duplicates=[];
     let projects=0,monthly=0;
     for(const entry of rows){
       const item=describe(entry);if(!item)continue;
       const codes=entry.type==='servico'?[entry.id]:item.codes||[];
       if(!codes.length){unpriced.push({type:entry.type,id:entry.id,name:item.name});continue;}
       for(const code of codes){
         const service=byService.get(code);if(!service)continue;
         if(seen.has(code)){duplicates.push(code);continue;}
         seen.add(code);unique.push(service);
         if(service.priceType==='projeto'&&Number.isFinite(service.priceValue))projects+=service.priceValue;
         else if(service.priceType==='mensal'&&Number.isFinite(service.priceValue))monthly+=service.priceValue;
         else unpriced.push({type:'servico',id:code,name:service.name});
       }
     }
     return {entries:get(),services:unique,projects,monthly,unpriced,duplicates:[...new Set(duplicates)],selected:rows.length};
   }
   return {get,add,remove,clear,describe,summary};
 }
 const api={makeStore};
 if(root.ASTRION_DATA){root.ASTRION_CART=makeStore(root.ASTRION_DATA,(()=>{try{return root.localStorage;}catch(_){return null;}})());}
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
