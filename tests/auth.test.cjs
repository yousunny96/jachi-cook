// 구글 로그인: ID 토큰 검증 · 세션 쿠키 · 계정 상태 저장. 외부 호출은 가짜 fetch로 대체한다.
const test=require('node:test'),assert=require('node:assert/strict');
const crypto=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createServer,verifyIdToken,createKeyCache,signSession,readSession,fileUserStore,defaultUserStore}=require('../server.cjs');
const M=require('../dist/model.js');

const CLIENT='sobok-test.apps.googleusercontent.com',SECRET='test-session-secret',NOW=Date.UTC(2026,10,9);
const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'kid-1',alg:'RS256',use:'sig'};
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');

// 구글이 발급하는 모양의 토큰을 직접 만든다. header/claims를 덮어써 실패 경로를 만든다.
function token({header={},claims={},sign=true}={}){
 const h=b64({alg:'RS256',kid:'kid-1',typ:'JWT',...header});
 const p=b64({iss:'https://accounts.google.com',aud:CLIENT,sub:'google-user-1',name:'유선',email_verified:true,exp:Math.floor(NOW/1000)+3600,...claims});
 const s=sign?crypto.sign('RSA-SHA256',Buffer.from(h+'.'+p),privateKey).toString('base64url'):'not-a-signature';
 return h+'.'+p+'.'+s;
}
let certCalls=0;
const certFetch=async()=>{certCalls++;return {ok:true,headers:{get:()=>'public, max-age=3600'},json:async()=>({keys:[jwk]})};};
const verify=(tok,extra={})=>verifyIdToken(tok,{clientId:CLIENT,fetchImpl:certFetch,now:()=>NOW,googleKey:createKeyCache(),...extra});

test('ID 토큰: 서명과 iss·aud·exp·email_verified가 모두 맞을 때만 통과',async()=>{
 assert.deepEqual(await verify(token()),{sub:'google-user-1',name:'유선'});
 // 다른 사이트에서 받은 구글 토큰으로 로그인되면 안 된다.
 await assert.rejects(()=>verify(token({claims:{aud:'other-app.apps.googleusercontent.com'}})),/audience/);
 await assert.rejects(()=>verify(token({claims:{iss:'evil.example'}})),/audience/);
 await assert.rejects(()=>verify(token({claims:{exp:Math.floor(NOW/1000)-1}})),/expired/);
 await assert.rejects(()=>verify(token({claims:{email_verified:false}})),/claims/);
 await assert.rejects(()=>verify(token({claims:{sub:''}})),/claims/);
 await assert.rejects(()=>verify(token({sign:false})),/signature/);
 await assert.rejects(()=>verify(token({header:{alg:'none'}})),/alg/);
 await assert.rejects(()=>verify(token({header:{alg:'HS256'}})),/alg/);
 await assert.rejects(()=>verify(token({header:{kid:'unknown'}})),/key id/);
 for(const bad of [undefined,null,'','a.b','x'.repeat(5000),'a.b.c'])await assert.rejects(()=>verify(bad));
 // 클라이언트 ID가 없으면 검증 자체를 하지 않는다.
 await assert.rejects(()=>verifyIdToken(token(),{fetchImpl:certFetch,now:()=>NOW}),/Client id/);
});

test('공개키는 Cache-Control 동안 한 번만 받아 온다',async()=>{
 certCalls=0;
 const googleKey=createKeyCache();
 for(let i=0;i<3;i++)await verify(token(),{googleKey});
 assert.equal(certCalls,1);
 // 캐시가 만료되면 다시 받아 온다.
 await verifyIdToken(token({claims:{exp:Math.floor(NOW/1000)+90000}}),{clientId:CLIENT,fetchImpl:certFetch,now:()=>NOW+4000*1000,googleKey});
 assert.equal(certCalls,2);
});

test('세션 쿠키: 서명이 맞고 만료 전일 때만 읽힌다',()=>{
 const value=signSession({sub:'google-user-1',exp:Math.floor(NOW/1000)+60},SECRET);
 const withCookie=raw=>({headers:{cookie:'other=1; sobok_session='+raw}});
 assert.equal(readSession(withCookie(value),SECRET,()=>NOW).sub,'google-user-1');
 assert.equal(readSession(withCookie(value),'다른-비밀값',()=>NOW),null);
 assert.equal(readSession(withCookie(value),SECRET,()=>NOW+120000),null);           // 만료
 assert.equal(readSession(withCookie(value.replace(/.$/,'X')),SECRET,()=>NOW),null); // 서명 위조
 assert.equal(readSession(withCookie(value.split('.')[0]),SECRET,()=>NOW),null);     // 서명 없음
 assert.equal(readSession(withCookie(b64({sub:'x',exp:9e9})+'.aaaa'),SECRET,()=>NOW),null);
 assert.equal(readSession({headers:{}},SECRET,()=>NOW),null);
 assert.equal(readSession(withCookie(value),null,()=>NOW),null);                     // 비밀값 미설정
});

/* ---- 라우트 ---- */
const tmpUsers=()=>path.join(fs.mkdtempSync(path.join(os.tmpdir(),'sobok-user-')),'users.json');
function call(server,method,url,input,extra={}){
 const req=require('node:stream').Readable.from(input===undefined?[]:[typeof input==='string'?input:JSON.stringify(input)]);
 req.url=url;req.method=method;req.headers={'content-type':'application/json',host:'localhost',...extra};
 return new Promise(resolve=>{
  const headers={};
  const res={headersSent:false,setHeader(k,v){headers[k]=v;},writeHead(status){this.status=status;this.headersSent=true;},
   end(body){resolve({status:this.status,headers,data:body?JSON.parse(body):null});}};
  server.emit('request',req,res);
 });
}
const serve=(extra={})=>createServer({now:()=>NOW,fetchImpl:certFetch,clientId:CLIENT,sessionSecret:SECRET,googleKey:createKeyCache(),userStore:fileUserStore(tmpUsers()),...extra});
const cookieOf=r=>String(r.headers['Set-Cookie']||'').split(';')[0];

test('로그인: 토큰을 검증하고 HttpOnly 세션 쿠키를 내려준다',async()=>{
 const server=serve();
 const r=await call(server,'POST','/api/login',{credential:token()});
 assert.equal(r.status,200);
 assert.deepEqual(r.data,{account:{name:'유선'},state:null});   // 계정에 아직 아무것도 없다
 const cookie=String(r.headers['Set-Cookie']);
 assert.match(cookie,/^sobok_session=.+/);
 assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);assert.match(cookie,/Path=\//);
 assert.doesNotMatch(cookie,/Secure/);                          // 로컬 http
 assert.equal(readSession({headers:{cookie:cookieOf(r)}},SECRET,()=>NOW).sub,'google-user-1');
 // 이메일은 응답에도 쿠키에도 담지 않는다.
 assert.doesNotMatch(JSON.stringify(r.data)+cookie,/email/i);
});

test('로그인: https 뒤에서는 Secure를 붙인다',async()=>{
 const r=await call(serve(),'POST','/api/login',{credential:token()},{'x-forwarded-proto':'https'});
 assert.match(String(r.headers['Set-Cookie']),/Secure/);
});

test('로그인 거절: 나쁜 토큰·다른 출처·설정 누락',async()=>{
 const server=serve();
 assert.equal((await call(server,'POST','/api/login',{credential:token({sign:false})})).status,401);
 assert.equal((await call(server,'POST','/api/login',{credential:'x'})).status,401);
 assert.equal((await call(server,'POST','/api/login',{})).status,401);
 assert.equal((await call(server,'POST','/api/login','{oops')).status,401);
 assert.equal((await call(server,'POST','/api/login',{credential:token()},{origin:'https://evil.example'})).status,403);
 assert.equal((await call(server,'POST','/api/login',{credential:token()},{'content-type':'text/plain'})).status,415);
 assert.equal((await call(server,'GET','/api/login')).status,405);
 assert.equal((await call(serve({clientId:undefined}),'POST','/api/login',{credential:token()})).status,503);
 assert.equal((await call(serve({sessionSecret:undefined}),'POST','/api/login',{credential:token()})).status,503);
});

test('계정 상태: 로그인해야 읽고 쓸 수 있고, 등록된 값만 저장된다',async()=>{
 const server=serve();
 assert.equal((await call(server,'GET','/api/state')).status,401);
 assert.equal((await call(server,'PUT','/api/state',{version:1})).status,401);
 const cookie=cookieOf(await call(server,'POST','/api/login',{credential:token()}));
 const auth={cookie};
 const sent={version:1,onboardingComplete:true,selectedCharacter:'usagi',ingredients:['egg','없는재료'],tools:['pan'],condiments:['salt'],favorites:['demo-egg-rice','없는요리'],몰래:'끼워넣기'};
 assert.equal((await call(server,'PUT','/api/state',sent,auth)).status,200);
 const got=(await call(server,'GET','/api/state',undefined,auth)).data.state;
 assert.deepEqual(got,M.normalizeState(sent));
 assert.deepEqual(got.ingredients,['egg']);                 // 모르는 재료는 걸러진다
 assert.deepEqual(got.favorites,['demo-egg-rice']);
 assert.equal('몰래' in got,false);                          // 넣지 않은 필드는 남지 않는다
 assert.equal(got.selectedCharacter,'usagi');
 // 다시 로그인하면 저장해 둔 상태가 함께 내려온다.
 assert.deepEqual((await call(server,'POST','/api/login',{credential:token()})).data.state,got);
 assert.equal((await call(server,'PUT','/api/state','{oops',auth)).status,400);
 assert.equal((await call(server,'PUT','/api/state',sent,{...auth,'content-type':'text/plain'})).status,415);
 assert.equal((await call(server,'DELETE','/api/state',undefined,auth)).status,405);
 assert.equal((await call(server,'PUT','/api/state','{"x":"'+'y'.repeat(5000)+'"}',auth)).status,413);
});

test('계정은 서로 섞이지 않는다',async()=>{
 const server=serve();
 const a=cookieOf(await call(server,'POST','/api/login',{credential:token()}));
 const b=cookieOf(await call(server,'POST','/api/login',{credential:token({claims:{sub:'google-user-2',name:'다른사람'}})}));
 await call(server,'PUT','/api/state',{...M.initialState(),ingredients:['egg']},{cookie:a});
 await call(server,'PUT','/api/state',{...M.initialState(),ingredients:['tofu']},{cookie:b});
 assert.deepEqual((await call(server,'GET','/api/state',undefined,{cookie:a})).data.state.ingredients,['egg']);
 assert.deepEqual((await call(server,'GET','/api/state',undefined,{cookie:b})).data.state.ingredients,['tofu']);
});

test('로그아웃은 쿠키를 지우고, 지워진 쿠키로는 상태를 읽을 수 없다',async()=>{
 const server=serve();
 const cookie=cookieOf(await call(server,'POST','/api/login',{credential:token()}));
 assert.equal((await call(server,'GET','/api/state',undefined,{cookie})).status,200);
 const out=await call(server,'POST','/api/logout',undefined,{cookie});
 assert.equal(out.status,200);
 assert.match(String(out.headers['Set-Cookie']),/sobok_session=; .*Max-Age=0/);
 assert.equal((await call(server,'GET','/api/state',undefined,{cookie:cookieOf(out)})).status,401);
 assert.equal((await call(server,'GET','/api/logout')).status,405);
});

test('Redis 환경 변수가 있으면 계정 저장소도 Redis를 쓴다',async()=>{
 const store=defaultUserStore({UPSTASH_REDIS_REST_URL:'https://x.upstash.io/',UPSTASH_REDIS_REST_TOKEN:'tok'});
 assert.equal(typeof store.read,'function');assert.equal(typeof store.write,'function');
 assert.equal(typeof defaultUserStore({USER_FILE:tmpUsers()}).read,'function');
});

test('Vercel 함수 파일이 공용 처리기를 내보낸다',()=>{
 for(const n of ['login','logout','state'])assert.equal(typeof require('../api/'+n+'.js'),'function');
});
