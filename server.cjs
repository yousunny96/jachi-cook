'use strict';
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const D=require('./dist/data.js');
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
function createServer({apiKey=process.env.GEMINI_API_KEY,model=process.env.GEMINI_MODEL||'gemini-2.5-flash-lite',fetchImpl=fetch,now=Date.now}={}){
 const cache=new Map(),inflight=new Map();let requests=[],daily=[];
 return http.createServer(async(req,res)=>{
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try{
   const url=new URL(req.url,'http://localhost');
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
    const prompt='사용자가 냉장고 재료라고 적은 한국어 단어들이 아래 식재료 목록의 어느 항목인지 고르세요. 목록에 확실히 대응하는 것만 고르고, 애매하거나 목록에 없으면 고르지 마세요. 비슷한 다른 재료로 바꾸지 마세요(예: 닭고기와 닭다리살은 다름). JSON 형식: {"matches":[{"word":"입력 단어","id":"목록의 id"}]}. 마크다운 금지. 단어: '+JSON.stringify(words)+' 목록: '+JSON.stringify(catalog);
    const response=await fetchImpl('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0,maxOutputTokens:800}}),signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('Provider unavailable');
    const payload=await response.json(),candidate=payload.candidates?.[0];if(candidate?.finishReason!=='STOP')throw Error('Incomplete');
    const raw=candidate.content?.parts?.map(p=>p.text||'').join('')||'';if(raw.length>4000)throw Error('Invalid size');
    const data=validateIngredientMatches(JSON.parse(raw),words);cache.set(key,{time:now(),data});return json(200,data);
   }
   if(!['GET','HEAD'].includes(req.method))return json(405,{error:'Method not allowed'});
   const relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);const file=path.resolve(ROOT,'.'+relative);
   if(!file.startsWith(ROOT+path.sep))return json(403,{error:'Forbidden'});
   const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.json':'application/json'})[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
  }catch(error){if(!res.headersSent)json(error.code==='ENOENT'?404:502,{error:'Unable to complete request'});else res.end();}
 });
}
if(require.main===module)createServer().listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+(Number(process.env.PORT)||4173)));
module.exports={createServer,validate,validateIngredientMatches};
