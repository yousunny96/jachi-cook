const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../dist/data.js'),M=require('../dist/model.js');
const base={version:1,onboardingComplete:true,selectedCharacter:'hachiware',ingredients:[],tools:[],condiments:[]};

test('favorites toggle, persist only known recipes, and old saves are not treated as recovered',()=>{
 let s=M.toggleFavorite(base,'demo-egg-rice');assert.deepEqual(s.favorites,['demo-egg-rice']);
 s=M.toggleFavorite(s,'demo-tofu');assert.deepEqual(M.normalizeState({...s,favorites:[...s.favorites,'nope']}).favorites,['demo-egg-rice','demo-tofu']);
 s=M.toggleFavorite(s,'demo-egg-rice');assert.deepEqual(s.favorites,['demo-tofu']);
 const store={v:null,getItem(){return this.v;},setItem(k,v){this.v=v;}};
 store.v=JSON.stringify(M.normalizeState(base));assert.equal(M.readStorage(store).recovered,false);
 M.saveStorage(store,s);assert.deepEqual(M.readStorage(store).state.favorites,['demo-tofu']);
});

test('random pool: ready only when 5 or more, otherwise ready + almost',()=>{
 const r=n=>Array.from({length:n},(_,i)=>({id:'r'+i})),a=[{id:'a0'},{id:'a1'}];
 assert.deepEqual(M.randomPool({ready:r(5),almost:a}).map(x=>x.id),['r0','r1','r2','r3','r4']);
 assert.deepEqual(M.randomPool({ready:r(4),almost:a}).map(x=>x.id),['r0','r1','r2','r3','a0','a1']);
 assert.equal(M.pickRandom({ready:[],almost:[]}),null);
 assert.equal(M.pickRandom({ready:r(3),almost:a},()=>0.999).id,'a1');
 assert.notEqual(M.pickRandom({ready:r(2),almost:[]},()=>0,'r0').id,'r0');
});

test('random pick with real catalog never picks a dish that needs a missing tool or 3+ items',()=>{
 const st={...base,ingredients:D.demoInventory.ingredients,tools:D.demoInventory.tools,condiments:D.demoInventory.condiments};
 const rec=M.recommendations(st);
 for(let i=0;i<50;i++){const p=M.pickRandom(rec,Math.random);const s=M.recipeStatus(D.recipes.find(r=>r.id===p.id),st);assert.ok(s.hasTools&&s.missingCount<=2);if(rec.ready.length>=5)assert.equal(s.missingCount,0);}
});
