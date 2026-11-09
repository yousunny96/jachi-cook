'use strict';
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const D=require('./dist/data.js');
const M=require('./dist/model.js');
const ROOT=path.join(__dirname,'dist');
function validate(d,r){
 const ids=[...r.ingredients,...r.condiments].sort();
 const text=(s,n)=>typeof s==='string'&&s.trim().length>0&&s.length<=n&&!/[<>]/.test(s);
 if(!d||d.servings!==1||!d.amounts||Array.isArray(d.amounts)||JSON.stringify(Object.keys(d.amounts).sort())!==JSON.stringify(ids)||!Object.values(d.amounts).every(s=>text(s,100))||!Array.isArray(d.steps)||d.steps.length<3||d.steps.length>10||!d.steps.every(s=>text(s,500))||!text(d.tip,500)||!(d.water===undefined||d.water===''||text(d.water,100))||!Array.isArray(d.tools)||JSON.stringify([...d.tools].sort())!==JSON.stringify([...r.tools].sort()))throw Error('Invalid recipe response');
 return {servings:1,amounts:d.amounts,steps:d.steps,tip:d.tip,water:d.water||'',source:'gemini'};
}
// AI가 고른 재료: 입력 단어에 대한 것만, 등록된 식재료 ID만, 중복 없이.
function validateIngredientMatches(d,words){
 if(!d||!Array.isArray(d.matches)||d.matches.length>24)throw Error('Invalid ingredient response');
 const ids=new Set(D.ingredients.map(x=>x.id)),asked=new Set(words.map(w=>w.trim())),out=[];
 for(const m of d.matches){if(!m||typeof m.word!=='string'||typeof m.id!=='string')throw Error('Invalid ingredient response');if(asked.has(m.word.trim())&&ids.has(m.id)&&!out.some(o=>o.id===m.id))out.push({word:m.word.trim(),id:m.id});}
 return {matches:out,source:'gemini'};
}
// 의견: 정해진 값만 받아 한 줄 JSON으로 쌓는다. IP·기기 정보는 남기지 않는다.
const FEEDBACK_ANSWERS=['yes','unsure','dismissed'],FEEDBACK_LIKED=['kitchen','fridge','random','recipe'],FEEDBACK_TRIGGERS=['auto','settings'];
function validateFeedback(d){
 if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).some(k=>!['answer','liked','comment','trigger','character'].includes(k)))throw Error('Invalid feedback');
 if(!FEEDBACK_ANSWERS.includes(d.answer)||!FEEDBACK_TRIGGERS.includes(d.trigger))throw Error('Invalid feedback');
 if(d.liked!==undefined&&!FEEDBACK_LIKED.includes(d.liked))throw Error('Invalid feedback');
 if(d.character!==undefined&&!D.characters.some(c=>c.id===d.character))throw Error('Invalid feedback');
 if(d.comment!==undefined&&(typeof d.comment!=='string'||d.comment.length>300))throw Error('Invalid feedback');
 const comment=(d.comment||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
 return {answer:d.answer,trigger:d.trigger,...(d.liked?{liked:d.liked}:{}),...(comment?{comment}:{}),...(d.character?{character:d.character}:{})};
}
// 의견 저장소: Upstash Redis(Vercel 배포) 환경 변수가 있으면 Redis, 없으면 로컬 파일. 둘 다 분당 30건까지만 받는다.
function fileFeedbackStore(file,now){let times=[];return{
 async allow(){times=times.filter(t=>now()-t<60000);if(times.length>=30)return false;times.push(now());return true;},
 async append(entry){await fs.mkdir(path.dirname(file),{recursive:true});await fs.appendFile(file,JSON.stringify(entry)+'\n');},
 async list(){try{return (await fs.readFile(file,'utf8')).split('\n').filter(Boolean).map(l=>JSON.parse(l));}catch(e){if(e.code==='ENOENT')return [];throw e;}}
};}
// Upstash REST 파이프라인. 의견과 계정 상태가 같이 쓴다.
function redisPipeline(url,token,fetchImpl=fetch){
 return async commands=>{const r=await fetchImpl(url.replace(/\/$/,'')+'/pipeline',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(commands),signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('Store unavailable');const out=await r.json();if(out.some(x=>x.error))throw Error('Store error');return out.map(x=>x.result);};
}
function redisFeedbackStore(url,token,now,fetchImpl=fetch){
 const run=redisPipeline(url,token,fetchImpl);
 return{
  async allow(){const key='sobok:feedback:rate:'+Math.floor(now()/60000);const [count]=await run([['INCR',key],['EXPIRE',key,'120']]);return count<=30;},
  async append(entry){await run([['RPUSH','sobok:feedback',JSON.stringify(entry)]]);},
  async list(){const [rows]=await run([['LRANGE','sobok:feedback','0','-1']]);return rows.map(l=>JSON.parse(l));}
 };
}
function defaultFeedbackStore(env=process.env,now=Date.now){
 const url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;
 return url&&token?redisFeedbackStore(url,token,now):fileFeedbackStore(env.FEEDBACK_FILE||path.join(__dirname,'data','feedback.jsonl'),now);
}

/* ---------- 구글 로그인 ----------
 * 흐름: 브라우저가 구글에서 받은 ID 토큰 → /api/login에서 검증 → 서명한 세션 쿠키.
 * 계정에는 Google 식별자(sub)와 normalizeState를 통과한 상태만 둔다. 이메일은 저장하지 않는다. */

// 계정 상태 저장소: Redis가 있으면 Redis, 없으면 로컬 파일(로컬 검토용).
function redisUserStore(run){return{
 async read(sub){const [raw]=await run([['GET','sobok:user:'+sub]]);return raw?JSON.parse(raw):null;},
 async write(sub,state){await run([['SET','sobok:user:'+sub,JSON.stringify(state)]]);}
};}
function fileUserStore(file){
 const all=async()=>{try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw e;}};
 return{
  async read(sub){return (await all())[sub]||null;},
  async write(sub,state){const map=await all();map[sub]=state;await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(map));}
 };
}
function defaultUserStore(env=process.env){
 const url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;
 if(url&&token)return redisUserStore(redisPipeline(url,token));
 // Vercel 함수는 파일을 쓸 수 없다. Redis가 없으면 동기화를 끈다(로그인 자체는 된다).
 // 조용히 실패하면 저장된 줄 알게 되므로, 저장소가 없으면 /api/state가 503으로 거절한다.
 if(env.VERCEL)return null;
 return fileUserStore(env.USER_FILE||path.join(__dirname,'data','users.json'));
}

// 구글 공개키(JWKS): kid로 찾고, Cache-Control이 허락하는 동안 메모리에 둔다.
const GOOGLE_CERTS='https://www.googleapis.com/oauth2/v3/certs';
function createKeyCache(){
 let keys=[],until=0;
 return async function googleKey(kid,fetchImpl,now){
  if(now()>=until){
   const r=await fetchImpl(GOOGLE_CERTS,{signal:AbortSignal.timeout(5000)});
   if(!r.ok)throw Error('JWKS unavailable');
   const age=/max-age=(\d+)/.exec(r.headers?.get?.('cache-control')||'')?.[1];
   keys=(await r.json()).keys||[];until=now()+Math.min(Number(age)||3600,86400)*1000;
  }
  const jwk=keys.find(k=>k.kid===kid);
  if(!jwk)throw Error('Unknown key id');
  return crypto.createPublicKey({key:jwk,format:'jwk'});
 };
}
const GOOGLE_ISS=['accounts.google.com','https://accounts.google.com'];
// ID 토큰: RS256 서명 → iss·aud·exp·email_verified. 하나라도 어긋나면 던진다.
// aud 검사를 빼면 다른 사이트에서 받은 구글 토큰으로도 로그인되므로 절대 빼지 않는다.
async function verifyIdToken(token,{clientId,fetchImpl=fetch,now=Date.now,googleKey=createKeyCache()}={}){
 if(!clientId)throw Error('Client id missing');
 if(typeof token!=='string'||token.length>4096)throw Error('Invalid token');
 const [h,p,s]=token.split('.');
 if(!h||!p||!s)throw Error('Invalid token');
 let header,claims;
 try{header=JSON.parse(Buffer.from(h,'base64url'));claims=JSON.parse(Buffer.from(p,'base64url'));}catch{throw Error('Invalid token');}
 if(header.alg!=='RS256'||typeof header.kid!=='string')throw Error('Invalid alg');
 const key=await googleKey(header.kid,fetchImpl,now);
 if(!crypto.verify('RSA-SHA256',Buffer.from(h+'.'+p),key,Buffer.from(s,'base64url')))throw Error('Bad signature');
 if(!GOOGLE_ISS.includes(claims.iss)||claims.aud!==clientId)throw Error('Invalid audience');
 if(!(Number(claims.exp)*1000>now()))throw Error('Token expired');
 if(claims.email_verified!==true||typeof claims.sub!=='string'||!claims.sub)throw Error('Invalid claims');
 // 이름은 화면 표시용으로만 받는다.
 return {sub:claims.sub,name:String(claims.name||'').slice(0,40)};
}

// 세션 쿠키: 상태를 서버에 두지 않고 payload에 서명만 한다.
const SESSION_COOKIE='sobok_session',SESSION_TTL=30*24*3600;
function signSession(payload,secret){
 const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
 return body+'.'+crypto.createHmac('sha256',secret).update(body).digest('base64url');
}
function readSession(req,secret,now=Date.now){
 if(!secret)return null;
 const raw=/(?:^|;\s*)sobok_session=([^;]+)/.exec(req.headers?.cookie||'')?.[1];
 if(!raw)return null;
 const [body,sig]=raw.split('.');
 if(!body||!sig)return null;
 const want=crypto.createHmac('sha256',secret).update(body).digest('base64url');
 const a=Buffer.from(sig),b=Buffer.from(want);
 // timingSafeEqual은 길이가 다르면 던지므로 길이를 먼저 본다.
 if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
 try{const p=JSON.parse(Buffer.from(body,'base64url'));return p.exp>now()/1000?p:null;}catch{return null;}
}
// 로컬 http에서 Secure를 켜면 쿠키가 아예 붙지 않는다.
const sessionCookie=(req,value,maxAge)=>
 `${SESSION_COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`+(req.headers?.['x-forwarded-proto']==='https'?'; Secure':'');

// 요청 처리기 하나를 로컬 서버(createServer)와 Vercel 함수(api/*.js)가 같이 쓴다.
function createHandler({apiKey=process.env.GEMINI_API_KEY,model=process.env.GEMINI_MODEL||'gemini-2.5-flash-lite',fetchImpl=fetch,now=Date.now,feedbackStore=defaultFeedbackStore(process.env,now),clientId=process.env.GOOGLE_CLIENT_ID,sessionSecret=process.env.SESSION_SECRET,userStore=defaultUserStore(process.env),googleKey=createKeyCache()}={}){
 const cache=new Map(),inflight=new Map();let requests=[],daily=[];
 return async(req,res)=>{
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/api/feedback'){
    // GET은 앱이 '의견을 받을 수 있는 서버인지'만 확인한다. 쌓인 의견은 내려주지 않는다.
    if(req.method==='GET')return json(200,{ok:true});
    if(req.method!=='POST')return json(405,{error:'POST required'});
    const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)return json(403,{error:'Origin rejected'});
    if(!String(req.headers['content-type']).startsWith('application/json'))return json(415,{error:'JSON required'});
    let body='';for await(const chunk of req){body+=chunk;if(body.length>2048)return json(413,{error:'Request too large'});}
    let entry;try{entry=validateFeedback(JSON.parse(body));}catch{return json(400,{error:'Invalid feedback'});}
    if(!(await feedbackStore.allow()))return json(429,{error:'Too many feedback requests'});
    await feedbackStore.append({at:new Date(now()).toISOString(),...entry});
    return json(200,{ok:true});
   }
   if(url.pathname==='/api/recipe'){
    if(req.method!=='POST')return json(405,{error:'POST required'});
    const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)return json(403,{error:'Origin rejected'});
    if(!String(req.headers['content-type']).startsWith('application/json'))return json(415,{error:'JSON required'});
    let body='';for await(const chunk of req){body+=chunk;if(body.length>1024)return json(413,{error:'Request too large'});}
    let input;try{input=JSON.parse(body);}catch{return json(400,{error:'Invalid JSON'});}
    const r=D.recipes.find(r=>r.id===input?.recipeId);
    if(!r||Object.keys(input).some(k=>k!=='recipeId'))return json(400,{error:'Registered recipeId only'});
    if(!apiKey)return json(503,{error:'AI server key not configured'});
    const key=model+':'+r.id,hit=cache.get(key);if(hit&&now()-hit.time<86400000)return json(200,hit.data);
    if(inflight.has(key))return json(200,await inflight.get(key));
    requests=requests.filter(t=>now()-t<60000);daily=daily.filter(t=>now()-t<86400000);
    if(requests.length>=5||daily.length>=30)return json(429,{error:'Local generation limit'});
    requests.push(now());daily.push(now());
    const task=(async()=>{
     const names=ids=>ids.map(id=>({id,name:[...D.ingredients,...D.condiments,...D.tools].find(x=>x.id===id).name}));
     const prompt='한국어 1인분 요리 레시피를 JSON으로 작성. 등록된 재료·양념·도구만 사용. 물과 칼·도마·그릇·주걱 같은 기본 손도구는 허용. 새로운 식재료나 가열기구는 추가하지 말 것. 식재료별 분량, 단계별 불 세기·시간·익힘 확인을 포함. 육류와 계란은 완전히 익히고 교차오염 예방. JSON 필드: servings:1, amounts:{재료및양념ID:한국어이름과분량}, tools:[등록된도구ID], water:물분량문자열, steps:[3~10개 단계 문자열], tip:짧은팁. 마크다운 금지. 등록 정보: '+JSON.stringify({name:r.name,ingredients:names(r.ingredients),condiments:names(r.condiments),tools:names(r.tools)});
     const response=await fetchImpl('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0.3,maxOutputTokens:3500}}),signal:AbortSignal.timeout(20000)});
     if(!response.ok)throw Error('Provider unavailable');
     const payload=await response.json(),candidate=payload.candidates?.[0];if(candidate?.finishReason!=='STOP')throw Error('Incomplete generation');
     const raw=candidate.content?.parts?.map(p=>p.text||'').join('');if(!raw||raw.length>16000)throw Error('Invalid size');
     const data=validate(JSON.parse(raw),r);cache.set(key,{time:now(),data});return data;
    })();inflight.set(key,task);try{return json(200,await task);}finally{inflight.delete(key);}
   }
   if(url.pathname==='/api/ingredients'){
    // 재료 글 인식 보조: 앱이 못 알아본 단어만 받아, 등록된 식재료 ID 중에서만 고르게 한다. 냉장고 정보는 받지 않는다.
    if(req.method!=='POST')return json(405,{error:'POST required'});
    const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)return json(403,{error:'Origin rejected'});
    if(!String(req.headers['content-type']).startsWith('application/json'))return json(415,{error:'JSON required'});
    let body='';for await(const chunk of req){body+=chunk;if(body.length>1024)return json(413,{error:'Request too large'});}
    let input;try{input=JSON.parse(body);}catch{return json(400,{error:'Invalid JSON'});}
    const words=input?.words;
    if(!Array.isArray(words)||!words.length||words.length>12||Object.keys(input).some(k=>k!=='words')||!words.every(w=>typeof w==='string'&&w.trim()&&w.length<=30&&!/[<>]/.test(w)))return json(400,{error:'words: 1~12 short strings only'});
    if(!apiKey)return json(503,{error:'AI server key not configured'});
    const key='ing:'+model+':'+words.map(w=>w.trim()).sort().join('|'),hit=cache.get(key);if(hit&&now()-hit.time<86400000)return json(200,hit.data);
    requests=requests.filter(t=>now()-t<60000);daily=daily.filter(t=>now()-t<86400000);
    if(requests.length>=5||daily.length>=30)return json(429,{error:'Local generation limit'});
    requests.push(now());daily.push(now());
    const catalog=D.ingredients.map(x=>({id:x.id,name:x.name}));
    const prompt='사용자가 냉장고 재료라고 적은 한국어 또는 일본어 단어들이 아래 식재료 목록의 어느 항목인지 고르세요. 목록에 확실히 대응하는 것만 고르고, 애매하거나 목록에 없으면 고르지 마세요. 비슷한 다른 재료로 바꾸지 마세요(예: 닭고기와 닭다리살은 다름). JSON 형식: {"matches":[{"word":"입력 단어","id":"목록의 id"}]}. 마크다운 금지. 단어: '+JSON.stringify(words)+' 목록: '+JSON.stringify(catalog);
    const response=await fetchImpl('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0,maxOutputTokens:800}}),signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('Provider unavailable');
    const payload=await response.json(),candidate=payload.candidates?.[0];if(candidate?.finishReason!=='STOP')throw Error('Incomplete');
    const raw=candidate.content?.parts?.map(p=>p.text||'').join('')||'';if(raw.length>4000)throw Error('Invalid size');
    const data=validateIngredientMatches(JSON.parse(raw),words);cache.set(key,{time:now(),data});return json(200,data);
   }
   /* ---------- 로그인 ---------- */
   if(url.pathname==='/api/login'||url.pathname==='/api/logout'||url.pathname==='/api/state'){
    // 외부 사이트에서 쿠키를 들고 호출하지 못하게 한다(SameSite=Lax와 이중 방어).
    const origin=req.headers.origin;
    if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)return json(403,{error:'Origin rejected'});
    const body=async limit=>{let b='';for await(const c of req){b+=c;if(b.length>limit)return null;}return b;};
    const wantsJson=()=>String(req.headers['content-type']).startsWith('application/json');

    if(url.pathname==='/api/login'){
     if(req.method!=='POST')return json(405,{error:'POST required'});
     if(!clientId||!sessionSecret)return json(503,{error:'Login not configured'});
     if(!wantsJson())return json(415,{error:'JSON required'});
     const raw=await body(8192);if(raw===null)return json(413,{error:'Request too large'});
     let account;
     try{account=await verifyIdToken(JSON.parse(raw)?.credential,{clientId,fetchImpl,now,googleKey});}
     catch{return json(401,{error:'Sign-in rejected'});}
     const saved=userStore?await userStore.read(account.sub).catch(()=>null):null;
     res.setHeader('Set-Cookie',sessionCookie(req,signSession({sub:account.sub,exp:Math.floor(now()/1000)+SESSION_TTL},sessionSecret),SESSION_TTL));
     return json(200,{account:{name:account.name},state:saved});
    }

    if(url.pathname==='/api/logout'){
     if(req.method!=='POST')return json(405,{error:'POST required'});
     res.setHeader('Set-Cookie',sessionCookie(req,'',0));
     return json(200,{ok:true});
    }

    // 계정에 담긴 상태 읽기·쓰기. 들어온 값은 normalizeState를 통과한 것만 저장한다.
    const session=readSession(req,sessionSecret,now);
    if(!session)return json(401,{error:'Sign-in required'});
    if(!userStore)return json(503,{error:'Sync not configured'});
    if(req.method==='GET')return json(200,{state:await userStore.read(session.sub)});
    if(req.method!=='PUT')return json(405,{error:'GET or PUT required'});
    if(!wantsJson())return json(415,{error:'JSON required'});
    const raw=await body(4096);if(raw===null)return json(413,{error:'Request too large'});
    let state;try{state=M.normalizeState(JSON.parse(raw));}catch{return json(400,{error:'Invalid state'});}
    await userStore.write(session.sub,state);
    return json(200,{ok:true});
   }

   if(!['GET','HEAD'].includes(req.method))return json(405,{error:'Method not allowed'});
   const relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);const file=path.resolve(ROOT,'.'+relative);
   if(!file.startsWith(ROOT+path.sep))return json(403,{error:'Forbidden'});
   const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.json':'application/json'})[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
  }catch(error){if(!res.headersSent)json(error.code==='ENOENT'?404:502,{error:'Unable to complete request'});else res.end();}
 };
}
function createServer(options){return http.createServer(createHandler(options));}
// 다른 사람이 접속하게 하려면 HOST=0.0.0.0 으로 실행한다.
if(require.main===module){const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT)||4173;createServer().listen(port,host,()=>console.log(`Local: http://${host}:${port}`));}
module.exports={createServer,createHandler,defaultFeedbackStore,fileFeedbackStore,redisFeedbackStore,validate,validateIngredientMatches,validateFeedback,
 verifyIdToken,createKeyCache,signSession,readSession,defaultUserStore,fileUserStore,redisUserStore,redisPipeline,SESSION_TTL};
