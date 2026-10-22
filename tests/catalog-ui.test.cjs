const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const D=require('../dist/data.js');
function appWith(state){
 const app={innerHTML:''},handlers={};
 const window={localStorage:{getItem:k=>k==='sobok.lang'?'ko':JSON.stringify(state),setItem(){}},addEventListener(){},scrollTo(){}};
 const document={querySelector:s=>s==='#app'?app:null,addEventListener:(type,fn)=>handlers[type]=fn};
 const ctx=vm.createContext({window,document,history:{replaceState(){},pushState(){}},setTimeout,clearTimeout,console});
 for(const name of ['recipe-drafts','data-japanese','data','i18n/ja-ui','i18n/ja-catalog','i18n/ja-recipes','i18n','model','app'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',name+'.js'),'utf8'),ctx);
 return {html:()=>app.innerHTML,click:(action,id)=>handlers.click({target:{closest:()=>({dataset:{action,id},disabled:false})}})};
}
const state={version:1,onboardingComplete:true,selectedCharacter:'hachiware',ingredients:D.ingredients.map(x=>x.id),tools:D.tools.map(x=>x.id),condiments:D.condiments.map(x=>x.id)};
test('all 60 detail screens render own image crop, quantities and numbered steps',()=>{
 const app=appWith(state);assert.equal(D.recipes.length,60);
 const crops=new Set();for(const r of D.recipes){app.click('recipe',r.id);const h=app.html();assert.ok(h.includes(r.name));assert.ok(h.includes('cooking-steps'));const m=h.match(/class="food-art" viewBox="([^"]+)"[^]*?<image href="(assets\/dishes-[123]\.webp)"/);assert.ok(m,r.id);crops.add(m[2]+' '+m[1]);}
 assert.equal(crops.size,60);
});
test('no-tool home includes no-heat dishes and catalog exposes all menus',()=>{
 const app=appWith({...state,tools:[]});assert.ok(app.html().includes('참치마요덮밥'));assert.ok(app.html().includes('가열 없이'));app.click('recipes');assert.ok(app.html().includes('전체 메뉴 60개 둘러보기'));assert.ok(app.html().includes('필요 도구:'));
});
