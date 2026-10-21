// 일본 가정식 30개 추가 확인 항목(요청서 1~8)
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../dist/data.js'),M=require('../dist/model.js');
const JP=D.recipes.filter(r=>r.cuisine==='japanese');
const has=(list,id)=>list.some(x=>x.id===id);
const own=(r,extra={})=>({version:1,onboardingComplete:true,selectedCharacter:'hachiware',ingredients:[...r.ingredients],condiments:[...r.condiments],tools:D.tools.map(t=>t.id),...extra});

test('1. 기존 30 + 일본식 30 = 60개, ID 모두 고유하고 기존 메뉴를 덮어쓰지 않음',()=>{
 assert.equal(D.recipes.length,60);assert.equal(new Set(D.recipes.map(r=>r.id)).size,60);
 assert.equal(D.recipes.filter(r=>r.cuisine==='korean').length,30);assert.equal(JP.length,30);
 assert.ok(D.recipes.some(r=>r.id==='curry-rice')&&D.recipes.some(r=>r.id==='jp-curry-rice'));
 assert.ok(D.recipes.some(r=>r.id==='omurice')&&D.recipes.some(r=>r.id==='jp-omurice'));
});

test('2. 모든 재료·양념·도구 ID가 선택 목록에 있고, 분량이 재료·양념과 1:1로 맞음',()=>{
 for(const r of D.recipes){
  r.ingredients.forEach(id=>assert.ok(has(D.ingredients,id),`${r.id} 재료 ${id}`));
  r.condiments.forEach(id=>assert.ok(has(D.condiments,id),`${r.id} 양념 ${id}`));
  r.tools.forEach(id=>assert.ok(has(D.tools,id),`${r.id} 도구 ${id}`));
  assert.deepEqual(Object.keys(r.amounts).sort(),[...r.ingredients,...r.condiments].sort(),r.id);
 }
 assert.equal(new Set(D.ingredients.map(x=>x.id)).size,D.ingredients.length);
 assert.equal(new Set(D.condiments.map(x=>x.id)).size,D.condiments.length);
 assert.equal(D.tools.length,6,'기본 6종 도구는 그대로');
});

test('3. 그림 30칸이 요청 순서대로 연결됨',()=>{
 const order=['오야코동','규동','부타동','닭고기 소보로동','치킨 데리야키 덮밥','일본식 카레라이스','하야시라이스','일본식 오므라이스','연어 오니기리','야키오니기리','키츠네우동','야키우동','카레우동','자루소바','야키소바','나폴리탄 스파게티','버섯 버터간장 파스타','타마고산도','오코노미야키','타마고야키','쇼가야키','치킨 데리야키','연어 데리야키','일본식 함박스테이크','니쿠자가','두부 미소국','돈지루','닭고기계란 조스이','히야얏코','시금치 참깨무침'];
 assert.deepEqual([...JP].sort((a,b)=>a.imageIndex-b.imageIndex).map(r=>r.name),order);
 assert.ok(JP.every(r=>r.atlas==='jp'));
});

test('4. 도구가 없으면 히야얏코는 추천되고 가열 메뉴는 빠짐',()=>{
 const st={...own(D.recipes.find(r=>r.id==='jp-hiyayakko')),tools:[],ingredients:D.ingredients.map(x=>x.id),condiments:D.condiments.map(x=>x.id)};
 const rec=M.recommendations(st),ids=[...rec.ready,...rec.almost].map(r=>r.id);
 assert.ok(ids.includes('jp-hiyayakko'));
 assert.ok(JP.filter(r=>r.tools.length).every(r=>!ids.includes(r.id)));
});

test('5. 물·선택 고명은 부족 개수에 넣지 않고, 비슷한 재료를 자동으로 같다고 보지 않음',()=>{
 assert.ok(!has(D.ingredients,'water'));
 for(const r of JP){assert.equal(M.recipeStatus(r,own(r)).missingCount,0,r.id);}
 const oy=D.recipes.find(r=>r.id==='jp-oyakodon');
 assert.equal(M.recipeStatus(oy,own(oy,{ingredients:['rice','egg','onion','chicken']})).missingCount,1,'닭고기만으로는 닭다리살이 아님');
 const cu=D.recipes.find(r=>r.id==='jp-curry-rice');
 assert.equal(M.recipeStatus(cu,own(cu,{ingredients:cu.ingredients.filter(i=>i!=='curry-roux').concat('curry-powder')})).missingCount,1,'카레가루 ≠ 고형 카레');
 const hm=D.recipes.find(r=>r.id==='jp-hambagu');
 assert.deepEqual(M.removeConsumed(own(hm),hm,['onion']).ingredients.includes('egg'),true,'체크한 재료만 빠짐');
});

test('6. 밥과 함께 먹는 반찬에는 밥과 함께 표시',()=>{
 const side=JP.filter(r=>r.course==='밥과 함께');assert.ok(side.length>=10);
 assert.ok(side.every(r=>r.mealType==='밥과 함께'));
 assert.ok(JP.filter(r=>r.course!=='밥과 함께').every(r=>!r.mealType));
});

test('7. 전체 카탈로그 기준 난이도별 6개 이상',()=>{
 for(const d of ['easy','medium','hard'])assert.ok(D.recipes.filter(r=>r.difficulty===d).length>=6,d);
});

test('8. 일본식은 AI 초안이며 검수 완료로 표시하지 않음 · 추천 정렬은 쉬움→보통→어려움, 시간 순',()=>{
 assert.ok(JP.every(r=>r.source==='ai-draft'&&r.humanReviewed===false&&r.steps.length>=4&&r.tip));
 const st={version:1,onboardingComplete:true,selectedCharacter:'hachiware',ingredients:D.ingredients.map(x=>x.id),condiments:D.condiments.map(x=>x.id),tools:D.tools.map(x=>x.id)};
 const o={easy:0,medium:1,hard:2},list=M.recommendations(st).ready;
 for(let i=1;i<list.length;i++){const a=list[i-1],b=list[i];assert.ok(o[a.difficulty]<o[b.difficulty]||(o[a.difficulty]===o[b.difficulty]&&a.minutes<=b.minutes));}
});
