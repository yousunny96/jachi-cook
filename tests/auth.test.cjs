const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createServer,fileFeedbackStore}=require('../server.cjs');
const {fileUserStore,redisUserStore,signSession,readSession}=require('../auth.cjs');

const CLIENT='test-client.apps.googleusercontent.com',SECRET='0123456789abcdef0123456789abcdef',NOW=Date.UTC(2026,10,7);
const env={GOOGLE_CLIENT_ID:CLIENT,SESSION_SECRET:SECRET,ADMIN_EMAILS:'Boss@Example.com'};
const tmpDir=()=>fs.mkdtempSync(path.join(os.tmpdir(),'sobok-auth-'));
// Google tokeninfo 모의: 토큰 'ok.<sub>.<email>' 모양만 통과
function googleFetch(overrides={}){return async url=>{const tok=decodeURIComponent(String(url).split('id_token=')[1]||'');const [h,sub,email]=tok.split('.');if(h!=='ok')return {ok:false,json:async()=>({})};return {ok:true,json:async()=>({aud:CLIENT,iss:'https://accounts.google.com',exp:String(NOW/1000+3600),sub,email:email+'@example.com',email_verified:'true',name:'테스트',picture:'https://lh3.googleusercontent.com/a/x',...overrides})};};}
function call(server,method,url,input,headers={}){
 const req=require('node:stream').Readable.from(input===undefined?[]:[JSON.stringify(input)]);Object.assign(req,{url,method,headers:{'content-type':'application/json',host:'localhost',...headers}});
 return new Promise(resolve=>{const set={};const res={headersSent:false,setHeader(k,v){set[k.toLowerCase()]=v;},writeHead(status){this.status=status;this.headersSent=true;},end(body){resolve({status:this.status,data:JSON.parse(body),cookie:set['set-cookie']});}};server.emit('request',req,res);});
}
function setup(extra={}){const dir=tmpDir(),users=fileUserStore(path.join(dir,'users.json')),fb=fileFeedbackStore(path.join(dir,'fb.jsonl'),()=>NOW);
 return {users,fb,server:createServer({env,now:()=>NOW,fetchImpl:googleFetch(extra.google),userStore:users,feedbackStore:fb})};}
const cookieOf=r=>r.cookie.split(';')[0];

test('session cookies are signed and expire',()=>{
 const v=signSession('u1',SECRET,NOW);
 assert.equal(readSession('sobok_session='+v,SECRET,NOW).sub,'u1');
 assert.equal(readSession('sobok_session='+v,'another-secret-another-secret',NOW),null);
 assert.equal(readSession('sobok_session='+v.replace(/^./,'x'),SECRET,NOW),null);
 assert.equal(readSession('sobok_session='+v,SECRET,NOW+31*86400000),null);
});

test('without Google settings login stays off and /api/me says so',async()=>{
 const server=createServer({env:{},now:()=>NOW,userStore:fileUserStore(path.join(tmpDir(),'u.json'))});
 assert.deepEqual((await call(server,'GET','/api/me')).data,{enabled:false,clientId:'',user:null});
 assert.equal((await call(server,'POST','/api/auth',{credential:'ok.a.b'})).status,503);
});

test('Google login creates a user, merges local favorites and keeps them in the DB',async()=>{
 const {server,users}=setup();
 assert.deepEqual((await call(server,'GET','/api/me')).data,{enabled:true,clientId:CLIENT,user:null});
 const login=await call(server,'POST','/api/auth',{credential:'ok.sub1.me',favorites:['jp-oyakodon','not-a-recipe']});
 assert.equal(login.status,200);
 assert.match(login.cookie,/^sobok_session=.+; Path=\/; HttpOnly; SameSite=Lax; Max-Age=2592000$/);
 assert.deepEqual(login.data.user,{email:'me@example.com',name:'테스트',picture:'https://lh3.googleusercontent.com/a/x',favorites:['jp-oyakodon'],isAdmin:false});
 const cookie=cookieOf(login);
 assert.equal((await call(server,'GET','/api/me',undefined,{cookie})).data.user.email,'me@example.com');
 assert.equal((await call(server,'PUT','/api/me',{favorites:['jp-oyakodon','jp-oyakodon']},{cookie})).data.user.favorites.length,1);
 assert.equal((await call(server,'PUT','/api/me',{favorites:'x'},{cookie})).status,400);
 assert.equal((await call(server,'PUT','/api/me',{favorites:[]},{cookie,origin:'https://evil.example'})).status,403);
 assert.equal((await call(server,'PUT','/api/me',{favorites:[]})).status,401);
 // 두 번째 로그인: 기록은 이어지고 즐겨찾기는 합쳐진다
 const again=await call(server,'POST','/api/auth',{credential:'ok.sub1.me',favorites:[]});
 assert.deepEqual(again.data.user.favorites,['jp-oyakodon']);
 const saved=await users.get('sub1');
 assert.equal(saved.loginCount,2);assert.equal(saved.createdAt,new Date(NOW).toISOString());
 const out=await call(server,'DELETE','/api/auth',undefined,{cookie});
 assert.match(out.cookie,/Max-Age=0/);
});

test('bad Google tokens are rejected',async()=>{
 assert.equal((await call(setup().server,'POST','/api/auth',{credential:'bad.x.y'})).status,401);
 assert.equal((await call(setup().server,'POST','/api/auth',{credential:'not a jwt'})).status,401);
 assert.equal((await call(setup({google:{aud:'someone-else'}}).server,'POST','/api/auth',{credential:'ok.s.a'})).status,401);
 assert.equal((await call(setup({google:{email_verified:'false'}}).server,'POST','/api/auth',{credential:'ok.s.a'})).status,401);
 assert.equal((await call(setup({google:{exp:String(NOW/1000-1)}}).server,'POST','/api/auth',{credential:'ok.s.a'})).status,401);
});

test('admin page data is only for ADMIN_EMAILS',async()=>{
 const {server,fb}=setup();
 await fb.append({at:new Date(NOW).toISOString(),answer:'yes',trigger:'auto',liked:'fridge'});
 assert.equal((await call(server,'GET','/api/admin')).status,401);
 const user=cookieOf(await call(server,'POST','/api/auth',{credential:'ok.u.me',favorites:['jp-oyakodon']}));
 assert.equal((await call(server,'GET','/api/admin',undefined,{cookie:user})).status,403);
 const boss=await call(server,'POST','/api/auth',{credential:'ok.b.Boss'});
 assert.equal(boss.data.user.isAdmin,true);
 const r=await call(server,'GET','/api/admin',undefined,{cookie:cookieOf(boss)});
 assert.equal(r.status,200);
 assert.deepEqual(r.data.stats,{users:2,activeWeek:2,feedback:1,answers:{yes:1},liked:{fridge:1}});
 assert.deepEqual(r.data.users.map(u=>u.email).sort(),['boss@example.com','me@example.com']);
 assert.equal(r.data.topFavorites[0].id,'jp-oyakodon');
 assert.equal(r.data.feedback[0].liked,'fridge');
});

test('on Vercel users go to Upstash Redis',async()=>{
 const db={},z=[],sent=[];
 const fetchImpl=async(url,opts)=>{const cmds=JSON.parse(opts.body);sent.push(...cmds.map(c=>c[0]));return {ok:true,json:async()=>cmds.map(([c,...a])=>({result:c==='SET'?(db[a[0]]=a[1],'OK'):c==='GET'?db[a[0]]??null:c==='ZADD'?(z.includes(a[2])||z.push(a[2]),1):c==='ZRANGE'?[...z]:c==='MGET'?a.map(k=>db[k]??null):null}))};};
 const store=redisUserStore('https://x.upstash.io','tok',fetchImpl);
 await store.put({sub:'s1',email:'a@b.c',createdAt:'2026-11-07T00:00:00.000Z',favorites:[]});
 assert.equal((await store.get('s1')).email,'a@b.c');
 assert.equal((await store.list()).length,1);
 assert.deepEqual([...new Set(sent)].sort(),['GET','MGET','SET','ZADD','ZRANGE']);
});

test('Vercel function files exist for login, me and admin',()=>{
 for(const n of ['auth','me','admin'])assert.equal(typeof require('../api/'+n+'.js'),'function');
});
