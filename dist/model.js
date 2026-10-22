(function(root) {
  'use strict';
  const D=typeof module==='object'&&module.exports?require('./data.js'):root.SobokData;
  const STORAGE_KEY='sobok.prototype.v1';
  const initialState=()=>({version:1,onboardingComplete:false,selectedCharacter:'hachiware',tools:[],condiments:[],ingredients:[]});
  const validIds=(values,catalog)=>Array.from(new Set(values.filter(x=>catalog.some(item=>item.id===x))));
  function normalizeState(value) {
    if (!value || typeof value!=='object' || value.version!==1 || typeof value.onboardingComplete!=='boolean' || !['ingredients','tools','condiments'].every(k=>Array.isArray(value[k]))) return initialState();
    // favorites(찜한 요리 id)는 나중에 추가된 선택 필드다. 없던 저장값도 '복구'로 보지 않도록 있을 때만 넣는다.
    return {...initialState(),onboardingComplete:value.onboardingComplete,selectedCharacter:D.characters.some(x=>x.id===value.selectedCharacter)?value.selectedCharacter:'hachiware',ingredients:validIds(value.ingredients,D.ingredients),tools:validIds(value.tools,D.tools),condiments:validIds(value.condiments,D.condiments),...(Array.isArray(value.favorites)?{favorites:validIds(value.favorites,D.recipes)}:{})};
  }
  const compact=value=>String(value||'').normalize('NFKC').trim().replace(/\s+/g,'').toLocaleLowerCase('ko');
  function searchIngredients(query,category='전체') {
    const q=compact(query);
    return D.ingredients.filter(item=>q?[item.name,...item.aliases].some(n=>compact(n).includes(q)):category==='전체'||item.category===category);
  }
  function recipeStatus(recipe,state) {
    const missingIngredients=Array.from(new Set(recipe.ingredients)).filter(id=>!state.ingredients.includes(id));
    const missingCondiments=Array.from(new Set(recipe.condiments)).filter(id=>!state.condiments.includes(id));
    return {missingIngredients,missingCondiments,missingCount:missingIngredients.length+missingCondiments.length,hasTools:recipe.tools.every(id=>state.tools.includes(id))};
  }
  // 여러 재료를 한 번에 적은 글("계란 2개, 대파랑 양파\n두부 한 모")에서 재료 ID를 찾는다.
  // 수량·단위·조사를 지우고, 이름·별칭 중 가장 긴 것부터 맞춘다. 양념은 따로 돌려준다(내 주방에서 담는 것).
  // 일본어 단위(個·本·枚…)도 함께 지운다.
  const UNITS='개|알|판|단|봉지|봉|팩|모|장|쪽|줄기|줄|덩이|덩어리|컵|근|마리|통|캔|병|인분|큰술|작은술|숟가락|g|kg|ml|l|그램|킬로|個|コ|本|枚|パック|袋|丁|玉|缶|切れ|束|株|房|かけ|片|杯|人分|グラム';
  const NUM_WORDS='한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|반|몇';
  function parseIngredientText(text) {
    const dict=[];
    const add=(term,id,type)=>{const k=compact(term);if(k)dict.push({k,id,type});};
    D.ingredients.forEach(x=>{add(x.name,x.id,'ingredients');x.aliases.forEach(a=>add(a,x.id,'ingredients'));});
    D.condiments.forEach(x=>add(x.name,x.id,'condiments'));
    dict.sort((a,b)=>b.k.length-a.k.length);
    const ingredients=[],condiments=[],unknown=[];
    const cleaned=String(text||'').normalize('NFKC').toLocaleLowerCase('ko')
      .replace(new RegExp(`\\d+(?:[.,]\\d+)?\\s*(?:${UNITS})?`,'g'),' ')
      .replace(new RegExp(`(?:^|\\s)(?:${NUM_WORDS})\\s*(?:${UNITS})`,'g'),' ');
    const chunks=cleaned.split(/[,，、\/·;|\n\r\t+&]|\s(?:그리고|및|또)\s|이랑|하고|랑/).map(c=>c.trim()).filter(Boolean);
    const PARTICLE=/^(?:이랑|랑|하고|과|와|도|은|는|이|가|을|를|만|좀|조금|약간|정도|있어|있음|남음|남았어|있어요|요|と|や|も|が|を|は|に|の|少し|少々|ちょっと|あり|ある|あります|です)+$/;
    for(const chunk of chunks){
      const s=compact(chunk);let i=0,rest='';
      const flush=()=>{const r=rest.replace(/[^\p{L}]/gu,'').replace(/^(?:이랑|랑|하고)/,'');if(r&&!PARTICLE.test(r)&&r.length>=1)unknown.push(r);rest='';};
      while(i<s.length){
        const hit=dict.find(d=>s.startsWith(d.k,i));
        if(hit){flush();(hit.type==='ingredients'?ingredients:condiments).push(hit.id);i+=hit.k.length;}
        else{rest+=s[i];i++;}
      }
      flush();
    }
    const uniq=a=>Array.from(new Set(a));
    return {ingredients:uniq(ingredients),condiments:uniq(condiments),unknown:uniq(unknown)};
  }
  const difficultyOrder={easy:0,medium:1,hard:2};
  function recommendations(state,difficulty='all',recipes=D.recipes) {
    const eligible=recipes.map(recipe=>({...recipe,status:recipeStatus(recipe,state)})).filter(recipe=>recipe.status.hasTools&&recipe.status.missingCount<=2&&(difficulty==='all'||recipe.difficulty===difficulty)).sort((a,b)=>difficultyOrder[a.difficulty]-difficultyOrder[b.difficulty]||a.minutes-b.minutes||a.id.localeCompare(b.id));
    return {ready:eligible.filter(r=>r.status.missingCount===0),almost:eligible.filter(r=>r.status.missingCount>0)};
  }
  const favoritesOf=state=>Array.isArray(state.favorites)?state.favorites:[];
  function toggleFavorite(state,recipeId) {
    const list=favoritesOf(state);
    return {...state,favorites:list.includes(recipeId)?list.filter(id=>id!==recipeId):[...list,recipeId]};
  }
  // 랜덤 뽑기: 바로 만들 수 있는 요리가 5개 이상이면 그중에서, 5개 미만이면 1~2개만 사면 되는 요리까지 섞어서 뽑는다.
  function randomPool(rec){return rec.ready.length>=5?rec.ready:[...rec.ready,...rec.almost];}
  function pickRandom(rec,rand=Math.random,excludeId=null) {
    const pool=randomPool(rec);if(!pool.length)return null;
    const candidates=pool.length>1&&excludeId?pool.filter(r=>r.id!==excludeId):pool;
    return candidates[Math.min(candidates.length-1,Math.floor(rand()*candidates.length))];
  }
  function removeConsumed(state,recipe,selected) {
    const removable=new Set(selected.filter(id=>recipe.ingredients.includes(id)&&state.ingredients.includes(id)));
    return {...state,ingredients:state.ingredients.filter(id=>!removable.has(id))};
  }
  function readStorage(storage) {
    try {
      if (!storage) throw new Error('unavailable');
      const raw=storage.getItem(STORAGE_KEY);
      if (!raw) return {state:initialState(),available:true,recovered:false};
      const parsed=JSON.parse(raw),state=normalizeState(parsed);
      return {state,available:true,recovered:JSON.stringify(state)!==JSON.stringify(parsed)};
    } catch(error) {
      if (error instanceof SyntaxError) return {state:initialState(),available:true,recovered:true};
      return {state:initialState(),available:false,recovered:false};
    }
  }
  function saveStorage(storage,state) {
    try { if(!storage) return false; storage.setItem(STORAGE_KEY,JSON.stringify(normalizeState(state)));return true; }catch {return false;}
  }
  const model={STORAGE_KEY,initialState,normalizeState,searchIngredients,parseIngredientText,recipeStatus,recommendations,removeConsumed,readStorage,saveStorage,favoritesOf,toggleFavorite,randomPool,pickRandom};
  if(typeof module==='object'&&module.exports)module.exports=model;else root.SobokModel=model;
})(typeof window!=='undefined'?window:globalThis);
