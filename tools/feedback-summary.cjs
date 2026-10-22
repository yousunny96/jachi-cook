// 쌓인 의견(data/feedback.jsonl)을 세어 보여 준다. 실행: node tools/feedback-summary.cjs [파일 경로]
const fs = require('node:fs'), path = require('node:path');
const file = path.resolve(process.argv[2] || process.env.FEEDBACK_FILE || path.join(__dirname, '..', 'data', 'feedback.jsonl'));
if (!fs.existsSync(file)) { console.log(`아직 의견이 없어요 (${file})`); process.exit(0); }
const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
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
