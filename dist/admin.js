// 소복 어드민: ADMIN_EMAILS에 있는 Google 계정으로 로그인하면 사용자 목록과 의견을 본다. 권한 확인은 서버(/api/admin)가 한다.
(function(){
  'use strict';
  const root=document.getElementById('root');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const when=iso=>iso?new Date(iso).toLocaleString('ko-KR',{dateStyle:'short',timeStyle:'short'}):'-';
  const ANSWER={yes:'또 쓰고 싶어',unsure:'잘 모르겠어',dismissed:'닫음'},LIKED={kitchen:'픽셀 부엌',fridge:'냉장고 재료',random:'랜덤 돌리기',recipe:'레시피 설명'};
  const charName=id=>window.SobokData?.characters.find(c=>c.id===id)?.name||id||'-';
  const msg=html=>{root.innerHTML=`<h1>소복 어드민</h1><p class="msg">${html}</p>`;};
  async function logout(){await fetch('/api/auth',{method:'DELETE'});location.reload();}
  function who(user){return `<div class="who">${user.picture?`<img src="${esc(user.picture)}" alt="" referrerpolicy="no-referrer">`:''}<span>${esc(user.name||'')} · ${esc(user.email)}</span><button data-logout>로그아웃</button></div>`;}
  function loginButton(clientId){
    msg('어드민 계정(Google)으로 로그인해 주세요.<div id="google-button"></div>');
    const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;
    s.onload=()=>{google.accounts.id.initialize({client_id:clientId,callback:async({credential})=>{const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential})});if(r.ok)location.reload();else msg('로그인에 실패했어요. 다시 시도해 주세요.');}});google.accounts.id.renderButton(document.getElementById('google-button'),{theme:'outline',size:'large',locale:'ko'});};
    document.head.appendChild(s);
  }
  const table=(heads,rows)=>rows.length?`<div class="table-wrap"><table><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="msg">아직 없어요.</p>';
  function dashboard(user,d){
    const s=d.stats;
    root.innerHTML=`<header><h1>소복 어드민</h1>${who(user)}</header>
      <section class="stats">
        <div class="stat"><b>${s.users}</b><span>가입한 사용자</span></div>
        <div class="stat"><b>${s.activeWeek}</b><span>최근 7일 로그인</span></div>
        <div class="stat"><b>${s.feedback}</b><span>받은 의견</span></div>
        <div class="stat"><b>${s.answers.yes||0} / ${s.answers.unsure||0} / ${s.answers.dismissed||0}</b><span>또 쓰고 싶어 / 잘 모르겠어 / 닫음</span></div>
      </section>
      <h2>사용자 (${d.users.length})</h2>
      ${table(['이메일','이름','가입','마지막 로그인','로그인 횟수','즐겨찾기'],d.users.map(u=>[esc(u.email)+(u.isAdmin?' <span class="tag">어드민</span>':''),esc(u.name),when(u.createdAt),when(u.lastLoginAt),u.loginCount||0,u.favorites]))}
      <h2>많이 즐겨찾기한 요리</h2>
      ${table(['요리','사용자 수'],d.topFavorites.map(f=>[esc(f.name),f.count]))}
      <h2>의견 (최근 ${d.feedback.length}건)</h2>
      ${table(['시각','답','좋았던 것','아쉬운 점','친구','경로'],d.feedback.map(f=>[when(f.at),esc(ANSWER[f.answer]||f.answer),esc(LIKED[f.liked]||f.liked||''),esc(f.comment||''),esc(charName(f.character)),esc(f.trigger)]))}`;
  }
  document.addEventListener('click',e=>{if(e.target.closest('[data-logout]'))logout();});
  (async()=>{
    try{
      const me=await (await fetch('/api/me')).json();
      if(!me.enabled)return msg('로그인이 아직 설정되지 않았어요. 서버 환경 변수 GOOGLE_CLIENT_ID · SESSION_SECRET · ADMIN_EMAILS를 넣어 주세요.');
      if(!me.user)return loginButton(me.clientId);
      const r=await fetch('/api/admin');
      if(r.status===403){root.innerHTML=`<header><h1>소복 어드민</h1>${who(me.user)}</header><p class="msg">이 계정은 어드민이 아니에요. ADMIN_EMAILS에 이메일을 추가해 주세요.</p>`;return;}
      if(!r.ok)throw Error();
      dashboard(me.user,await r.json());
    }catch{msg('서버에 연결하지 못했어요. 잠시 후 새로고침해 주세요.');}
  })();
})();
