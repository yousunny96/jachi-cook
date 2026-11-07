'use strict';
// Google 로그인 · 사용자 DB · 어드민.
// - 로그인: 브라우저가 Google에서 받은 ID 토큰(credential)을 서버가 Google tokeninfo로 확인하고,
//   서명한 세션 쿠키(HttpOnly)를 내준다. 비밀번호·Google 접근 토큰은 받지도 저장하지도 않는다.
// - DB: 의견과 같은 Upstash Redis(없으면 로컬 data/users.json). 사용자 한 명 = 문서 하나.
// - 어드민: ADMIN_EMAILS(쉼표로 구분)에 있는 Google 계정만 /api/admin을 볼 수 있다.
const crypto=require('node:crypto'),fs=require('node:fs/promises'),path=require('node:path');
const D=require('./dist/data.js');
const COOKIE='sobok_session',SESSION_DAYS=30;

const b64=buf=>Buffer.from(buf).toString('base64url');
function signSession(sub,secret,now){const body=b64(JSON.stringify({sub,exp:now+SESSION_DAYS*86400000}));return body+'.'+b64(crypto.createHmac('sha256',secret).update(body).digest());}
function readSession(cookieHeader,secret,now){
 if(!secret||!cookieHeader)return null;
 const raw=String(cookieHeader).split(/;\s*/).find(c=>c.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!raw)return null;
 const [body,sig]=raw.split('.');if(!body||!sig)return null;
 const want=crypto.createHmac('sha256',secret).update(body).digest(),got=Buffer.from(sig,'base64url');
 if(got.length!==want.length||!crypto.timingSafeEqual(got,want))return null;
 try{const p=JSON.parse(Buffer.from(body,'base64url').toString());return typeof p.sub==='string'&&p.exp>now?p:null;}catch{return null;}
}
function sessionCookie(value,secure,maxAge){return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?'; Secure':''}`;}

// Google ID 토큰 확인: 이 앱의 Client ID로 발급됐는지, Google이 발급했는지, 만료되지 않았는지, 이메일이 확인됐는지.
async function verifyGoogleToken(credential,clientId,fetchImpl,now){
 if(typeof credential!=='string'||credential.length>4096||!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(credential))throw Error('Invalid credential');
 const r=await fetchImpl('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(credential),{signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('Invalid credential');
 const p=await r.json();
 if(p.aud!==clientId||!['accounts.google.com','https://accounts.google.com'].includes(p.iss)||!(Number(p.exp)*1000>now)||!p.sub||!p.email||String(p.email_verified)!=='true')throw Error('Invalid credential');
 const clip=(s,n)=>typeof s==='string'?s.slice(0,n):'';
 return {sub:clip(p.sub,64),email:clip(p.email,254).toLowerCase(),name:clip(p.name,80),picture:/^https:\/\/[\w.-]+\.googleusercontent\.com\//.test(p.picture||'')?clip(p.picture,500):''};
}

const validFavorites=list=>Array.isArray(list)?Array.from(new Set(list.filter(id=>typeof id==='string'&&D.recipes.some(r=>r.id===id)))):null;

// 사용자 저장소. 문서 모양: {sub,email,name,picture,createdAt,lastLoginAt,loginCount,favorites}
function fileUserStore(file){
 let queue=Promise.resolve();
 const load=async()=>{try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw e;}};
 const save=async all=>{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(all,null,1));};
 const locked=fn=>(queue=queue.then(fn,fn));
 return{
  async get(sub){return (await load())[sub]||null;},
  put(user){return locked(async()=>{const all=await load();all[user.sub]=user;await save(all);});},
  async list(){return Object.values(await load()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 };
}
function redisUserStore(url,token,fetchImpl=fetch){
 const run=async commands=>{const r=await fetchImpl(url.replace(/\/$/,'')+'/pipeline',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(commands),signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('User store unavailable');const out=await r.json();if(out.some(x=>x.error))throw Error('User store error');return out.map(x=>x.result);};
 return{
  async get(sub){const [raw]=await run([['GET','sobok:user:'+sub]]);return raw?JSON.parse(raw):null;},
  async put(user){await run([['SET','sobok:user:'+user.sub,JSON.stringify(user)],['ZADD','sobok:users',String(Date.parse(user.createdAt)),user.sub]]);},
  async list(){const [subs]=await run([['ZRANGE','sobok:users','0','-1','REV']]);if(!subs.length)return [];const [rows]=await run([['MGET',...subs.map(s=>'sobok:user:'+s)]]);return rows.filter(Boolean).map(r=>JSON.parse(r));}
 };
}
function defaultUserStore(env=process.env){
 const url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;
 return url&&token?redisUserStore(url,token):fileUserStore(env.USERS_FILE||path.join(__dirname,'data','users.json'));
}

const publicUser=(u,admins)=>({email:u.email,name:u.name,picture:u.picture,favorites:u.favorites||[],isAdmin:admins.includes(u.email)});

// /api/auth, /api/me, /api/admin 처리. 해당 경로가 아니면 false를 돌려준다.
function createAuthRoutes({env=process.env,fetchImpl=fetch,now=Date.now,userStore=defaultUserStore(env),feedbackStore}={}){
 const clientId=env.GOOGLE_CLIENT_ID||'',secret=env.SESSION_SECRET||'',admins=String(env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
 const enabled=!!(clientId&&secret&&secret.length>=16);
 return async(req,res,url,{json,readJson,sameOrigin})=>{
  const p=url.pathname;if(!['/api/auth','/api/me','/api/admin'].includes(p))return false;
  const secure=req.headers['x-forwarded-proto']==='https'||!!req.socket?.encrypted;
  const current=async()=>{const s=enabled&&readSession(req.headers.cookie,secret,now());return s?await userStore.get(s.sub):null;};
  if(p==='/api/me'){
   if(req.method==='GET'){const u=await current();return json(200,{enabled,clientId:enabled?clientId:'',user:u?publicUser(u,admins):null}),true;}
   if(req.method!=='PUT')return json(405,{error:'GET or PUT'}),true;
   if(!sameOrigin())return json(403,{error:'Origin rejected'}),true;
   const u=await current();if(!u)return json(401,{error:'Login required'}),true;
   const input=await readJson(4096);if(!input)return true;
   const favorites=validFavorites(input.favorites);if(!favorites||Object.keys(input).some(k=>k!=='favorites'))return json(400,{error:'favorites: recipe ids only'}),true;
   const next={...u,favorites};await userStore.put(next);return json(200,{user:publicUser(next,admins)}),true;
  }
  if(p==='/api/auth'){
   if(!enabled)return json(503,{error:'Login not configured'}),true;
   if(req.method==='DELETE'){if(!sameOrigin())return json(403,{error:'Origin rejected'}),true;res.setHeader?.('Set-Cookie',sessionCookie('',secure,0));return json(200,{ok:true}),true;}
   if(req.method!=='POST')return json(405,{error:'POST or DELETE'}),true;
   if(!sameOrigin())return json(403,{error:'Origin rejected'}),true;
   const input=await readJson(6144);if(!input)return true;
   let g;try{g=await verifyGoogleToken(input.credential,clientId,fetchImpl,now());}catch{return json(401,{error:'Google login failed'}),true;}
   // 로그인 전 이 브라우저에서 고른 즐겨찾기는 계정에 합친다(지우지 않음).
   const local=validFavorites(input.favorites)||[],old=await userStore.get(g.sub),at=new Date(now()).toISOString();
   const user={...(old||{createdAt:at,loginCount:0,favorites:[]}),...g,lastLoginAt:at,loginCount:(old?.loginCount||0)+1};
   user.favorites=Array.from(new Set([...(user.favorites||[]),...local]));
   await userStore.put(user);
   res.setHeader?.('Set-Cookie',sessionCookie(signSession(g.sub,secret,now()),secure,SESSION_DAYS*86400));
   return json(200,{user:publicUser(user,admins)}),true;
  }
  // /api/admin: 어드민만. 사용자 목록과 쌓인 의견을 내려준다.
  if(req.method!=='GET')return json(405,{error:'GET required'}),true;
  if(!enabled)return json(503,{error:'Login not configured'}),true;
  const u=await current();if(!u)return json(401,{error:'Login required'}),true;
  if(!admins.includes(u.email))return json(403,{error:'Admins only'}),true;
  const users=await userStore.list(),feedback=feedbackStore?await feedbackStore.list():[];
  const count=(list,key)=>list.reduce((m,x)=>(x[key]&&(m[x[key]]=(m[x[key]]||0)+1),m),{});
  const favCount={};for(const x of users)for(const id of x.favorites||[])favCount[id]=(favCount[id]||0)+1;
  const day=now()-7*86400000;
  return json(200,{
   stats:{users:users.length,activeWeek:users.filter(x=>Date.parse(x.lastLoginAt)>day).length,feedback:feedback.length,answers:count(feedback,'answer'),liked:count(feedback,'liked')},
   topFavorites:Object.entries(favCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,n])=>({id,name:D.recipes.find(r=>r.id===id)?.name||id,count:n})),
   users:users.map(x=>({email:x.email,name:x.name,createdAt:x.createdAt,lastLoginAt:x.lastLoginAt,loginCount:x.loginCount,favorites:(x.favorites||[]).length,isAdmin:admins.includes(x.email)})),
   feedback:feedback.slice(-200).reverse()
  }),true;
 };
}
module.exports={createAuthRoutes,verifyGoogleToken,signSession,readSession,fileUserStore,redisUserStore,defaultUserStore,COOKIE};
