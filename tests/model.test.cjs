const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../dist/data.js');
const M = require('../dist/model.js');
const state = patch => ({...M.initialState(),onboardingComplete:true,...patch});
const recipe = patch => ({id:'fixture',difficulty:'easy',minutes:10,tools:['pan'],ingredients:['egg'],condiments:['salt'],...patch});

test('missing ingredients and condiments are one combined count; 0, 1, 2 pass and 3 are excluded',()=>{
  const input=state({ingredients:['egg'],condiments:['salt'],tools:['pan']});
  const fixtures=[recipe({id:'zero'}),recipe({id:'one',ingredients:['egg','tofu']}),recipe({id:'two',ingredients:['egg','tofu'],condiments:['salt','oil']}),recipe({id:'three',ingredients:['egg','tofu','pork'],condiments:['salt','oil']})];
  const r=M.recommendations(input,'all',fixtures);
  assert.deepEqual(r.ready.map(x=>x.id),['zero']);
  assert.deepEqual(r.almost.map(x=>x.id),['one','two']);
  assert.deepEqual(r.almost[1].status.missingCondiments,['oil']);
});
test('a missing required tool excludes the recipe even with all ingredients',()=>{
  const r=M.recommendations(state({ingredients:['egg'],condiments:['salt'],tools:['pan']}),'all',[recipe({tools:['pan','pot']})]);
  assert.deepEqual(r,{ready:[],almost:[]});
});
test('all groups sort by difficulty, then time, then stable ID',()=>{
  const fixtures=[recipe({id:'hard',difficulty:'hard',minutes:1}),recipe({id:'medium',difficulty:'medium',minutes:2}),recipe({id:'z',minutes:15}),recipe({id:'a',minutes:15}),recipe({id:'fast',minutes:5})];
  const r=M.recommendations(state({ingredients:['egg'],condiments:['salt'],tools:['pan']}),'all',fixtures);
  assert.deepEqual(r.ready.map(x=>x.id),['fast','a','z','medium','hard']);
});
test('difficulty filtering does not reintroduce unavailable tools or missing 3+',()=>{
  const fixtures=[recipe({id:'medium-ok',difficulty:'medium'}),recipe({id:'medium-tool',difficulty:'medium',tools:['oven']}),recipe({id:'easy'})];
  assert.deepEqual(M.recommendations(state({ingredients:['egg'],condiments:['salt'],tools:['pan']}),'medium',fixtures).ready.map(x=>x.id),['medium-ok']);
});
test('a fully empty inventory is safe and has no recipe with these tools',()=>{
  assert.deepEqual(M.recommendations(M.initialState()),{ready:[],almost:[]});
});
test('missing count is based on a set rather than repeated entries',()=>{
  assert.equal(M.recipeStatus(recipe({ingredients:['tofu','tofu'],condiments:['oil','oil']}),M.initialState()).missingCount,2);
});
test('alias search crosses category boundaries and Unicode normalizes',()=>{
  assert.deepEqual(M.searchIngredients('달걀','고기').map(x=>x.id),['egg']);
  assert.deepEqual(M.searchIngredients(' 파 ','달걀·유제품').map(x=>x.id),['green-onion','onion','pasta','tomato-sauce']);
  assert.deepEqual(M.searchIngredients('대 파','고기').map(x=>x.id),['green-onion']);
  assert.deepEqual(M.searchIngredients('달걀','고기').map(x=>x.id),['egg']);
  assert.ok(M.searchIngredients('','고기').every(x=>x.category==='고기'));
  assert.deepEqual(M.searchIngredients('찾을수없는재료'),[]);
});
test('completion removes only selected currently owned used ingredients; preserves leftovers and all tools/condiments',()=>{
  const input=state({ingredients:['egg','rice','onion'],condiments:['salt','oil'],tools:['pan']});
  const result=M.removeConsumed(input,recipe({ingredients:['egg','rice']}),['egg','onion','salt','pan','tofu']);
  assert.deepEqual(result.ingredients,['rice','onion']);assert.deepEqual(result.condiments,['salt','oil']);assert.deepEqual(result.tools,['pan']);
  assert.deepEqual(input.ingredients,['egg','rice','onion']);
});
test('completion with none selected leaves inventory unchanged',()=>{
  const input=state({ingredients:['egg']});assert.deepEqual(M.removeConsumed(input,recipe({}),[]),input);
});
test('all twelve choices exist with complete distinct personality dialogue',()=>{
  assert.equal(D.characters.length,8);assert.equal(new Set(D.characters.map(x=>x.id)).size,8);
  for(const c of D.characters){assert.equal(c.dialogues.length,3);assert.ok(c.dialogues.every(x=>x.length>3));assert.equal(c.crop.length,4);}
});
test('thirty AI recipe drafts per cuisine contain steps and catalog remains separate',()=>{
  assert.equal(D.recipes.length,60);assert.ok(D.recipes.every(r=>r.isDemo&&r.steps.length>=4&&r.servings===1&&Object.keys(r.amounts).length===r.ingredients.length+r.condiments.length));
  assert.equal(new Set(D.recipes.map(r=>r.id)).size,60);
  for (const cuisine of ['korean','japanese']) assert.deepEqual(D.recipes.filter(r=>r.cuisine===cuisine).map(r=>r.imageIndex).sort((a,b)=>a-b),Array.from({length:30},(_,i)=>i));
  for (const difficulty of ['easy','medium','hard']) assert.ok(D.recipes.filter(r=>r.difficulty===difficulty).length>=6);
  for (const r of D.recipes) {
    for (const type of ['ingredients','condiments','tools']) assert.ok(r[type].every(id=>D[type].some(item=>item.id===id)),`${r.id}: unknown ${type}`);
    assert.deepEqual(Object.keys(r.amounts).sort(),[...r.ingredients,...r.condiments].sort());
  }
  assert.deepEqual(require('../dist/recipes.production.json'),[]);
});
test('corrupt and incompatible storage recovers to safe initial state',()=>{
  assert.equal(M.readStorage({getItem:()=>'{broken'}).recovered,true);
  assert.deepEqual(M.readStorage({getItem:()=>JSON.stringify({version:99})}).state,M.initialState());
  assert.equal(M.readStorage({getItem:()=>JSON.stringify({version:99})}).recovered,true);
});
test('stored IDs are allowlisted and duplicated IDs removed without losing valid data',()=>{
  const input=state({ingredients:['egg','invented','egg'],tools:['pan',null],condiments:['salt'],selectedCharacter:'alien'});
  assert.deepEqual(M.normalizeState(input).ingredients,['egg']);assert.deepEqual(M.normalizeState(input).tools,['pan']);assert.equal(M.normalizeState(input).selectedCharacter,'hachiware');
});
test('storage failures fall back to memory mode without throwing',()=>{
  assert.equal(M.readStorage(null).available,false);assert.equal(M.readStorage({getItem(){throw new Error('denied');}}).available,false);
  assert.equal(M.saveStorage({setItem(){throw new Error('quota');}},state({})),false);
});
test('storage round-trip preserves onboarding, inventory and chosen character',()=>{
  const values={};const fake={getItem:k=>values[k]||null,setItem:(k,v)=>{values[k]=v;}};
  const input=state({...D.demoInventory,selectedCharacter:'kani'});assert.equal(M.saveStorage(fake,input),true);assert.deepEqual(M.readStorage(fake).state,input);
});

test('no-tool inventory still recommends cold meals and excludes heated meals',()=>{
  const input=state({ingredients:['rice','tuna','seaweed'],condiments:['mayonnaise','soy','sesame-oil','salt'],tools:[]});
  const result=M.recommendations(input);
  assert.ok(result.ready.some(r=>r.id==='tuna-mayo-rice'));
  assert.ok(result.ready.some(r=>r.id==='tuna-rice-balls'));
  assert.ok([...result.ready,...result.almost].every(r=>r.tools.length===0));
});
