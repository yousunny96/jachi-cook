const test=require('node:test'),assert=require('node:assert/strict');
const {validate,createServer}=require('../server.cjs');
const D=require('../dist/data.js');
const r=D.recipes[0];const valid=()=>({...r,tools:r.tools});
test('AI payload rejects missing, additional ingredients, tools and oversized steps',()=>{
 assert.equal(validate(valid(),r).steps.length,4);
 for(const patch of [{amounts:{}},{amounts:{...r.amounts,garlic:'마늘'}},{tools:['oven']},{steps:['x']},{steps:Array(11).fill('x')},{tip:'<script>'},{servings:2}])assert.throws(()=>validate({...valid(),...patch},r));
});
async function call(server,input,extra={}){
 const req=require('node:stream').Readable.from([JSON.stringify(input)]);req.url='/api/recipe';req.method='POST';req.headers={'content-type':'application/json',host:'localhost',...extra};
 return new Promise(resolve=>{const res={headersSent:false,writeHead(status){this.status=status;this.headersSent=true;},end(body){resolve({status:this.status,data:JSON.parse(body)});}};server.emit('request',req,res);});
}
test('missing key and invalid input fail without provider request',async()=>{
 const s=createServer({apiKey:'',fetchImpl:()=>{throw Error('must not fetch');}});
 assert.equal((await call(s,{recipeId:r.id})).status,503);
 assert.equal((await call(s,{recipeId:'unknown'})).status,400);
 assert.equal((await call(s,{recipeId:r.id,ingredients:[]})).status,400);
 assert.equal((await call(s,{recipeId:r.id},{origin:'https://other.example'})).status,403);
});
test('provider response validated, cached and sent no user inventory',async()=>{
 let calls=0;const s=createServer({apiKey:'test-only',fetchImpl:async(url,options)=>{calls++;assert.equal(options.headers['x-goog-api-key'],'test-only');assert.ok(!options.body.includes('selectedCharacter'));return{ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(valid())}]}}]})};}});
 assert.equal((await call(s,{recipeId:r.id})).status,200);
 assert.equal((await call(s,{recipeId:r.id})).data.source,'gemini');assert.equal(calls,1);
});
test('provider failures are bounded by local request limit',async()=>{
 let calls=0;const s=createServer({apiKey:'test-only',fetchImpl:async()=>{calls++;return{ok:false};}});
 for(let i=0;i<5;i++)assert.equal((await call(s,{recipeId:r.id})).status,502);
 assert.equal((await call(s,{recipeId:r.id})).status,429);assert.equal(calls,5);
});
