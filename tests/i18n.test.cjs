const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const DIST=path.join(__dirname,'../dist');
const read=f=>fs.readFileSync(path.join(DIST,f),'utf8');
function appWith(state,lang){
 const app={innerHTML:''},handlers={},saved={'sobok.lang':lang};
 const window={localStorage:{getItem:k=>k in saved?saved[k]:JSON.stringify(state),setItem:(k,v)=>{saved[k]=v;}},addEventListener(){},scrollTo(){}};
 const document={querySelector:s=>s==='#app'?app:null,addEventListener:(type,fn)=>handlers[type]=fn};
 const ctx=vm.createContext({window,document,history:{replaceState(){},pushState(){}},setTimeout,clearTimeout,console});
 for(const name of ['recipe-drafts','data-japanese','data','i18n/ja-ui','i18n/ja-catalog','i18n/ja-recipes','i18n','model','app'])vm.runInContext(read(name+'.js'),ctx);
 return {D:window.SobokData,M:window.SobokModel,I:window.SobokI18n,JA:window.SobokJa,saved,html:()=>app.innerHTML,click:(action,id,data={})=>handlers.click({target:{closest:()=>({dataset:{action,id,...data},disabled:false,closest:()=>null,classList:{contains:()=>false}})}})};
}
const HANGUL=/[가-힣]/;
// 일본어 화면에 남아도 되는 한국어: 언어 버튼의 '한국어'
// data-* 속성 값(예: data-category="전체")은 화면에 보이지 않는 내부 기준값이라 뺀다.
const visibleKorean=html=>html.replace(/<script[^]*?<\/script>/g,'').replace(/\sdata-[\w-]+="[^"]*"/g,'').replace(/lang="ko"[^>]*>한국어</g,'').match(/[^<>"]*[가-힣][^<>"]*/g)||[];

test('every UI sentence in the code has a Japanese translation',()=>{
 const {JA}=appWith({},'ja'),app=read('app.js'),keys=new Set();
 for(const m of app.matchAll(/\bt\((?:on\?)?'((?:[^'\\]|\\.)*)'(?:\s*:\s*'((?:[^'\\]|\\.)*)')?/g)){keys.add(m[1]);if(m[2])keys.add(m[2]);}
 for(const m of read('index.html').matchAll(/data-i18n>([^]*?)<\/(?:a|h1|p|span)>/g))keys.add(m[1]);
 // 배열에 담겨 있다가 t()로 번역되는 문장(메뉴 이름, 난이도 말, 요리책 탭, 의견 선택지)
 for(const m of app.matchAll(/\[\s*'[\w-]+'\s*,\s*'([^']*[가-힣][^']*)'/g))keys.add(m[1]);
 for(const m of app.matchAll(/LEVEL_WORD=\{([^}]*)\}/g))for(const w of m[1].matchAll(/'([^']+)'/g))keys.add(w[1]);
 keys.delete('한국어'); // 언어 버튼 이름은 번역하지 않는다
 const missing=[...keys].filter(k=>HANGUL.test(k)&&!(k in JA.ui));
 assert.deepEqual(missing,[]);
 // 자리 표시({n} 등)는 번역에도 그대로 있어야 한다
 for(const [ko,ja] of Object.entries(JA.ui)){const ph=s=>(s.match(/\{[A-Za-z]\w*\}/g)||[]).sort().join();assert.equal(ph(ja),ph(ko),ko);}
});

test('every ingredient, seasoning, tool, friend and recipe has Japanese text',()=>{
 const {D,JA}=appWith({},'ja'),C=JA.catalog,R=JA.recipes;
 for(const x of D.ingredients)assert.ok(C.ingredients[x.id],x.id);
 for(const x of D.condiments)assert.ok(C.condiments[x.id],x.id);
 for(const x of D.tools)assert.ok(C.tools[x.id],x.id);
 for(const c of D.characters){const j=C.characters[c.id];assert.ok(j,c.id);assert.equal(j.dialogues.length,c._ko.dialogues.length,c.id);assert.equal(j.subs.length,c._ko.pick.subs.length,c.id);}
 for(const r of D.recipes){const j=R[r.id];assert.ok(j?.name&&j.steps?.length&&j.tip,r.id);
  assert.deepEqual(Object.keys(j.amounts).sort(),Object.keys(r._ko.amounts).sort(),r.id);
  assert.equal(!!j.water,!!r._ko.water,r.id+' water');assert.equal(!!j.mealType,!!r._ko.mealType,r.id+' mealType');}
 for(const c of D.categories)assert.ok(C.categories[c],c);
});

test('Japanese is the default and no Korean is left on any screen',()=>{
 const state={version:1,onboardingComplete:true,selectedCharacter:'hachiware',ingredients:['egg','rice','green-onion'],tools:['pan','pot','microwave'],condiments:['salt','soy','oil']};
 const app=appWith(state,undefined);
 assert.equal(app.I.lang,'ja');
 assert.deepEqual(visibleKorean(app.html()),[],'home');
 for(const page of ['fridge','kitchen','recipes','characters']){app.click('nav',undefined,{page});assert.deepEqual(visibleKorean(app.html()),[],page);}
 for(const r of app.D.recipes){app.click('recipe',r.id);assert.deepEqual(visibleKorean(app.html()),[],r.id);}
 const welcome=appWith({...state,onboardingComplete:false},'ja');assert.deepEqual(visibleKorean(welcome.html()),[],'welcome');
});

test('language button switches between Japanese and Korean and is remembered',()=>{
 const state={version:1,onboardingComplete:true,selectedCharacter:'chiikawa',ingredients:['egg'],tools:['pan'],condiments:['soy']};
 const app=appWith(state,'ja');
 assert.ok(app.html().includes('data-action="lang" data-id="ja" lang="ja" aria-pressed="true"'));
 assert.equal(app.D.recipes.find(r=>r.id==='jp-oyakodon').name,'親子丼');
 app.click('lang','ko');
 assert.equal(app.saved['sobok.lang'],'ko');assert.equal(app.I.lang,'ko');
 assert.equal(app.D.recipes.find(r=>r.id==='jp-oyakodon').name,'오야코동');
 assert.equal(app.D.ingredients.find(x=>x.id==='egg').name,'계란');
 assert.ok(app.html().includes('치이카와와 함께'));
 app.click('lang','ja');
 assert.ok(app.html().includes('ちいかわといっしょ'));
});

test('Japanese ingredient text is recognised, and Korean names still work in Japanese mode',()=>{
 const {M}=appWith({},'ja');
 const p=M.parseIngredientText('卵2個と玉ねぎ、豚こま200g、醤油');
 assert.deepEqual([...p.ingredients].sort(),['egg','onion','pork-slice']);
 assert.deepEqual([...p.condiments],['soy']);
 assert.deepEqual([...p.unknown],[]);
 assert.deepEqual(Array.from(M.searchIngredients('たまご'),x=>x.id),['egg']);
 assert.deepEqual(Array.from(M.searchIngredients('계란'),x=>x.id),['egg']);
});
