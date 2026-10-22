// 일본어 번역을 검수용 표로 뽑는다.
//   node tools/i18n-sheet.cjs export > rows.json   시트별 행(JSON)
//   node tools/i18n-sheet.cjs csv                 docs/i18n-review/*.csv (구글 시트 IMPORTDATA로 불러오기용)
// 행: [키, 구분/위치, 한국어 원문, 일본어(AI), 수정안, 메모]. 키는 시트에서 번역 파일로 되돌릴 때 쓰는 주소라 바꾸지 않는다.
const fs = require('node:fs'), path = require('node:path');
const DIST = path.join(__dirname, '..', 'dist');
const D = require(path.join(DIST, 'data.js'));
for (const f of ['ja-ui', 'ja-catalog', 'ja-recipes']) require(path.join(DIST, 'i18n', f + '.js'));
const JA = globalThis.SobokJa;

function uiRows() {
  // ja-ui.js의 '// 화면 이름' 주석을 위치로 쓴다.
  const rows = []; let group = '';
  for (const line of fs.readFileSync(path.join(DIST, 'i18n', 'ja-ui.js'), 'utf8').split('\n')) {
    const c = line.match(/^ {4}\/\/ (.+)$/); if (c) { group = c[1]; continue; }
    const m = line.match(/^ {4}("(?:[^"\\]|\\.)*"): ("(?:[^"\\]|\\.)*"),?$/);
    if (m) { const ko = JSON.parse(m[1]); rows.push([`ui|${ko}`, group, ko, JSON.parse(m[2]), '', '']); }
  }
  return rows;
}
function catalogRows() {
  const C = JA.catalog, rows = [];
  for (const x of D.ingredients) {
    const [name, aliases] = C.ingredients[x.id] || ['', []];
    rows.push([`ingredients|${x.id}|name`, '재료 · ' + x.category, x.name, name, '', '']);
    rows.push([`ingredients|${x.id}|aliases`, '재료 검색용 다른 이름(쉼표로 구분)', x.aliases.join(', '), (aliases || []).join(', '), '', '']);
  }
  for (const x of D.condiments) rows.push([`condiments|${x.id}`, '양념', x.name, C.condiments[x.id] || '', '', '']);
  for (const x of D.tools) rows.push([`tools|${x.id}`, '조리 도구', x.name, C.tools[x.id] || '', '', '']);
  for (const k of D.categories) rows.push([`categories|${k}`, '냉장고 분류', k, C.categories[k] || '', '', '']);
  for (const [k, v] of Object.entries(D.difficultyNames)) rows.push([`difficulty|${k}`, '난이도', v, C.difficulty[k] || '', '', '']);
  for (const [k, v] of Object.entries(D.cuisineNames)) rows.push([`cuisine|${k}`, '요리 종류', v, C.cuisine[k] || '', '', '']);
  return rows;
}
function characterRows() {
  const rows = [], C = JA.catalog.characters;
  for (const c of D.characters) {
    const j = C[c.id] || {}, who = c.name;
    rows.push([`characters|${c.id}|name`, `${who} · 이름`, c.name, j.name || '', '', '']);
    rows.push([`characters|${c.id}|personality`, `${who} · 성격`, c.personality, j.personality || '', '', '']);
    const labels = ['홈 인사', '요리 고를 때', '다 만든 뒤'];
    c.dialogues.forEach((s, i) => rows.push([`characters|${c.id}|dialogues|${i}`, `${who} · 대사(${labels[i] || i + 1})`, s, j.dialogues?.[i] || '', '', '']));
    c.pick.quotes.forEach((s, i) => rows.push([`characters|${c.id}|quotes|${i}`, `${who} · 추천 카드 큰 말 ${i + 1}`, s, j.quotes?.[i] || '', '', '']));
    c.pick.subs.forEach((s, i) => rows.push([`characters|${c.id}|subs|${i}`, `${who} · 추천 카드 설명 ${i + 1}`, s, j.subs?.[i] || '', '', '']));
  }
  return rows;
}
function recipeRows() {
  const rows = [], R = JA.recipes, name = (type, id) => D[type].find(x => x.id === id)?.name || id;
  for (const r of D.recipes) {
    const j = R[r.id] || {}, dish = `${r.name}`;
    rows.push([`recipes|${r.id}|name`, `${dish} · 요리 이름`, r.name, j.name || '', '', '']);
    if (r.mealType) rows.push([`recipes|${r.id}|mealType`, `${dish} · 곁들임 표시`, r.mealType, j.mealType || '', '', '']);
    for (const [id, s] of Object.entries(r.amounts || {})) {
      const type = r.condiments.includes(id) ? 'condiments' : 'ingredients';
      rows.push([`recipes|${r.id}|amounts|${id}`, `${dish} · 분량(${name(type, id)})`, s, j.amounts?.[id] || '', '', '']);
    }
    (r.steps || []).forEach((s, i) => rows.push([`recipes|${r.id}|steps|${i}`, `${dish} · ${i + 1}단계`, s, j.steps?.[i] || '', '', '']));
    if (r.tip) rows.push([`recipes|${r.id}|tip`, `${dish} · 팁`, r.tip, j.tip || '', '', '']);
    if (r.water) rows.push([`recipes|${r.id}|water`, `${dish} · 물`, r.water, j.water || '', '', '']);
  }
  return rows;
}

const HEAD = ['키(수정 금지)', '위치', '한국어 원문', '일본어(AI 번역)', '수정안', '메모'];
const SHEETS = () => ({ ui: ['화면 문장', uiRows()], catalog: ['재료·양념·도구', catalogRows()], characters: ['친구 대사', characterRows()], recipes: ['요리 60개', recipeRows()] });
const csvCell = v => /[",\n\r]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
if (process.argv[2] === 'export') {
  process.stdout.write(JSON.stringify(Object.fromEntries(Object.values(SHEETS()).map(([title, rows]) => [title, [HEAD, ...rows]]))));
} else if (process.argv[2] === 'csv') {
  const dir = path.join(__dirname, '..', 'docs', 'i18n-review'); fs.mkdirSync(dir, { recursive: true });
  for (const [file, [title, rows]] of Object.entries(SHEETS())) {
    fs.writeFileSync(path.join(dir, file + '.csv'), [HEAD, ...rows].map(r => r.map(csvCell).join(',')).join('\n') + '\n');
    console.log(`${file}.csv  ${title}  ${rows.length}행`);
  }
} else {
  console.error('사용법: node tools/i18n-sheet.cjs export | csv');
  process.exit(1);
}
