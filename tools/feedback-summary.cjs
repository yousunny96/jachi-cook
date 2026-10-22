// 쌓인 의견을 세어 보여 준다. 실행: node tools/feedback-summary.cjs [로컬 파일 경로]
const path = require('node:path');
// Vercel에 쌓인 의견은 `vercel env pull .env.local` 후 `node --env-file=.env.local tools/feedback-summary.cjs`로 본다.
const { defaultFeedbackStore, fileFeedbackStore } = require('../server.cjs');
const store = process.argv[2] ? fileFeedbackStore(path.resolve(process.argv[2]), Date.now) : defaultFeedbackStore();
(async () => {
const rows = await store.list();
if (!rows.length) { console.log('아직 의견이 없어요'); return; }
const count = (key, list = rows) => list.reduce((m, r) => (r[key] && (m[r[key]] = (m[r[key]] || 0) + 1), m), {});
const ANSWER = { yes: '또 쓰고 싶어', unsure: '잘 모르겠어', dismissed: '닫음' };
const LIKED = { kitchen: '픽셀 부엌과 친구들', fridge: '냉장고 재료로 요리 찾기', random: '랜덤 메뉴 돌리기', recipe: '레시피 설명' };
const answered = rows.filter(r => r.answer !== 'dismissed');
console.log(`전체 ${rows.length}건 (자동 팝업 ${rows.filter(r => r.trigger === 'auto').length} · 설정 ${rows.filter(r => r.trigger === 'settings').length})`);
for (const [k, n] of Object.entries(count('answer'))) console.log(`- ${ANSWER[k]}: ${n}${k === 'yes' && answered.length ? ` (답한 사람 중 ${Math.round(n / answered.length * 100)}%)` : ''}`);
console.log('\n제일 좋았던 것');
for (const [k, n] of Object.entries(count('liked')).sort((a, b) => b[1] - a[1])) console.log(`- ${LIKED[k]}: ${n}`);
const comments = rows.filter(r => r.comment);
console.log(`\n아쉬운 점 ${comments.length}건`);
for (const r of comments) console.log(`- [${r.at.slice(0, 10)}] ${r.comment}`);
})().catch(e => { console.error('의견을 읽지 못했어요:', e.message); process.exit(1); });
