const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createServer,validateFeedback,fileFeedbackStore,redisFeedbackStore,defaultFeedbackStore}=require('../server.cjs');
function call(server,method,input,extra={}){
 const req=require('node:stream').Readable.from(input===undefined?[]:[typeof input==='string'?input:JSON.stringify(input)]);req.url='/api/feedback';req.method=method;req.headers={'content-type':'application/json',host:'localhost',...extra};
 return new Promise(resolve=>{const res={headersSent:false,writeHead(status){this.status=status;this.headersSent=true;},end(body){resolve({status:this.status,data:JSON.parse(body)});}};server.emit('request',req,res);});
}
const tmp=()=>path.join(fs.mkdtempSync(path.join(os.tmpdir(),'sobok-fb-')),'feedback.jsonl');

test('feedback accepts only known answers, likes, triggers and characters',()=>{
 assert.deepEqual(validateFeedback({answer:'yes',trigger:'auto',liked:'fridge',character:'hachiware'}),{answer:'yes',trigger:'auto',liked:'fridge',character:'hachiware'});
 assert.deepEqual(validateFeedback({answer:'unsure',trigger:'settings',comment:'  재료가\n없어요 '}),{answer:'unsure',trigger:'settings',comment:'재료가 없어요'});
 for(const bad of [null,[],{answer:'maybe',trigger:'auto'},{answer:'yes',trigger:'popup'},{answer:'yes',trigger:'auto',liked:'x'},{answer:'yes',trigger:'auto',character:'nobody'},{answer:'yes',trigger:'auto',comment:'x'.repeat(301)},{answer:'yes',trigger:'auto',email:'a@b.c'}])assert.throws(()=>validateFeedback(bad));
});

test('feedback endpoint appends one JSON line per answer and never returns stored answers',async()=>{
 const file=tmp(),now=()=>Date.UTC(2026,9,22),server=createServer({now,feedbackStore:fileFeedbackStore(file,now)});
 assert.deepEqual(await call(server,'GET'),{status:200,data:{ok:true}});
 assert.equal((await call(server,'POST',{answer:'yes',trigger:'auto',liked:'kitchen'})).status,200);
 assert.equal((await call(server,'POST',{answer:'dismissed',trigger:'auto'})).status,200);
 const lines=fs.readFileSync(file,'utf8').trim().split('\n').map(l=>JSON.parse(l));
 assert.deepEqual(lines,[{at:'2026-10-22T00:00:00.000Z',answer:'yes',trigger:'auto',liked:'kitchen'},{at:'2026-10-22T00:00:00.000Z',answer:'dismissed',trigger:'auto'}]);
});

test('feedback endpoint rejects bad input, other origins and floods',async()=>{
 const file=tmp(),now=()=>0,server=createServer({now,feedbackStore:fileFeedbackStore(file,now)});
 assert.equal((await call(server,'POST','{oops')).status,400);
 assert.equal((await call(server,'POST',{answer:'nope',trigger:'auto'})).status,400);
 assert.equal((await call(server,'POST',{answer:'yes',trigger:'auto'},{origin:'https://evil.example'})).status,403);
 assert.equal((await call(server,'POST',{answer:'yes',trigger:'auto'},{'content-type':'text/plain'})).status,415);
 assert.equal((await call(server,'DELETE')).status,405);
 for(let i=0;i<30;i++)assert.equal((await call(server,'POST',{answer:'yes',trigger:'auto'})).status,200);
 assert.equal((await call(server,'POST',{answer:'yes',trigger:'auto'})).status,429);
 assert.equal(fs.readFileSync(file,'utf8').trim().split('\n').length,30);
});

test('Vercel uses Upstash Redis when its env vars exist, and sends only list/rate commands',async()=>{
 assert.equal(typeof defaultFeedbackStore({},()=>0).list,'function');
 const sent=[],list=[];
 const fetchImpl=async(url,opts)=>{sent.push({url,auth:opts.headers.Authorization,body:JSON.parse(opts.body)});const cmds=JSON.parse(opts.body);return {ok:true,json:async()=>cmds.map(([c,...a])=>({result:c==='INCR'?1:c==='RPUSH'?(list.push(a[1]),list.length):c==='LRANGE'?list:1}))};};
 const store=redisFeedbackStore('https://x.upstash.io/','tok',()=>120000,fetchImpl);
 const server=createServer({now:()=>120000,feedbackStore:store});
 assert.equal((await call(server,'POST',{answer:'unsure',trigger:'auto',comment:'재료가 없어요'})).status,200);
 assert.equal(sent[0].url,'https://x.upstash.io/pipeline');assert.equal(sent[0].auth,'Bearer tok');
 assert.deepEqual(sent[0].body,[['INCR','sobok:feedback:rate:2'],['EXPIRE','sobok:feedback:rate:2','120']]);
 assert.equal(sent[1].body[0][0],'RPUSH');
 assert.deepEqual(await store.list(),[{at:'1970-01-01T00:02:00.000Z',answer:'unsure',trigger:'auto',comment:'재료가 없어요'}]);
});

test('Vercel function files export the shared handler',()=>{
 for(const n of ['feedback','recipe','ingredients'])assert.equal(typeof require('../api/'+n+'.js'),'function');
});
