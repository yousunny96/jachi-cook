// 재료 한꺼번에 담기: 앱 안 인식(model.parseIngredientText) + AI 보조(/api/ingredients)
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../dist/model.js'),{createServer,validateIngredientMatches}=require('../server.cjs');

test('쉼표·띄어쓰기·조사·수량을 걸러 재료를 한꺼번에 찾음',()=>{
 assert.deepEqual(M.parseIngredientText('계란 2개, 대파랑 양파\n두부 한 모'),{ingredients:['egg','green-onion','onion','tofu'],condiments:[],unknown:[]});
 assert.deepEqual(M.parseIngredientText('달걀 한 판 파 양파 감자').ingredients,['egg','green-onion','onion','potato']);
 assert.deepEqual(M.parseIngredientText('연두부 1팩 우동사리 2봉').ingredients,['silken-tofu','udon']);
});
test('긴 이름을 먼저 맞추고(양파≠파, 고추장≠고추), 양념은 따로 돌려줌',()=>{
 const r=M.parseIngredientText('양파, 고추장, 간장 설탕 그리고 우유');
 assert.deepEqual(r.ingredients,['onion','milk']);assert.deepEqual(r.condiments,['gochujang','soy','sugar']);
});
test('모르는 말은 unknown으로 남기고 비슷한 재료로 바꾸지 않음',()=>{
 const r=M.parseIngredientText('계란이랑 국거리, 삼겹살');
 assert.deepEqual(r.ingredients,['egg']);assert.deepEqual(r.unknown,['국거리','삼겹살']);
 assert.deepEqual(M.parseIngredientText('').ingredients,[]);
});

async function call(server,input,extra={}){
 const req=require('node:stream').Readable.from([JSON.stringify(input)]);req.url='/api/ingredients';req.method='POST';req.headers={'content-type':'application/json',host:'localhost',...extra};
 return new Promise(resolve=>{const res={headersSent:false,writeHead(status){this.status=status;this.headersSent=true;},end(body){resolve({status:this.status,data:JSON.parse(body)});}};server.emit('request',req,res);});
}
test('AI 보조: 키 없음·잘못된 입력은 외부 호출 없이 거절',async()=>{
 const s=createServer({apiKey:'',fetchImpl:()=>{throw Error('must not fetch');}});
 assert.equal((await call(s,{words:['국거리']})).status,503);
 assert.equal((await call(s,{words:[]})).status,400);
 assert.equal((await call(s,{words:['a'],ingredients:['egg']})).status,400);
 assert.equal((await call(s,{words:Array(13).fill('x')})).status,400);
 assert.equal((await call(s,{words:['<b>']})).status,400);
 assert.equal((await call(s,{words:['국거리']},{origin:'https://other.example'})).status,403);
});
test('AI 보조: 등록된 식재료 ID·물어본 단어만 통과, 캐시됨',async()=>{
 let calls=0;const s=createServer({apiKey:'test-only',fetchImpl:async(url,o)=>{calls++;assert.ok(!o.body.includes('selectedCharacter'));return{ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({matches:[{word:'삼겹살',id:'pork'},{word:'삼겹살',id:'not-real'},{word:'안물어봄',id:'egg'},{word:'국거리',id:'beef'}]})}]}}]})};}});
 const r=await call(s,{words:['삼겹살','국거리']});assert.equal(r.status,200);
 assert.deepEqual(r.data.matches,[{word:'삼겹살',id:'pork'},{word:'국거리',id:'beef'}]);
 await call(s,{words:['국거리','삼겹살']});assert.equal(calls,1);
 assert.throws(()=>validateIngredientMatches({matches:'x'},['a']));
});
