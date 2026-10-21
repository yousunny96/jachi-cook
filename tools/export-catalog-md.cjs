// 냉장고 재료·양념·도구와 요리책 요리 목록을 md 표로 뽑는다(GPT 이미지 생성용).
// 실행: node tools/export-catalog-md.cjs [출력 경로]  (기본: docs/catalog-for-image-gen.md)
const fs = require('node:fs'), path = require('node:path');
const D = require('../dist/data.js');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'docs', 'catalog-for-image-gen.md'));

// 이미지 생성 프롬프트에 쓰기 좋게 영어 이름을 붙인다. 없는 항목이 생기면 바로 실패해서 빠뜨리지 않게 한다.
const EN = {
  egg: 'egg', rice: 'cooked white rice', 'green-onion': 'green onion (daepa)', onion: 'onion', carrot: 'carrot', kimchi: 'kimchi', potato: 'potato', mushroom: 'mushroom', tofu: 'firm tofu', pork: 'pork', chicken: 'chicken', beef: 'beef', ham: 'ham (Spam)', bacon: 'bacon', milk: 'milk', cheese: 'sliced cheese', butter: 'butter', cabbage: 'cabbage', zucchini: 'Korean zucchini (aehobak)', garlic: 'garlic', tomato: 'tomato', cucumber: 'cucumber', spinach: 'spinach', pepper: 'chili pepper', tuna: 'canned tuna', shrimp: 'shrimp', squid: 'squid', 'fish-cake': 'fish cake (eomuk)', noodles: 'thin wheat noodles (somyeon)', bread: 'sliced bread', seaweed: 'roasted seaweed (gim)', 'rice-cake': 'rice cakes (tteok)', 'king-oyster': 'king oyster mushroom', 'soft-tofu': 'soft tofu (sundubu)', pasta: 'pasta', 'tomato-sauce': 'tomato sauce', 'curry-powder': 'curry powder', 'jjajang-powder': 'black bean sauce powder (jjajang)', 'pancake-mix': 'Korean pancake mix', starch: 'potato starch', 'chicken-thigh': 'boneless chicken thigh', 'ground-chicken': 'ground chicken', 'beef-slice': 'thinly sliced beef (bulgogi cut)', 'ground-beef': 'ground beef', 'pork-slice': 'thinly sliced pork', 'ground-pork': 'ground pork', sausage: 'sausage', salmon: 'salmon fillet', ginger: 'ginger', radish: 'daikon radish', 'bell-pepper': 'green bell pepper', udon: 'udon noodles', soba: 'dried soba noodles', 'chuka-noodles': 'yakisoba noodles', 'seasoned-fried-tofu': 'seasoned fried tofu (inari age)', 'silken-tofu': 'silken tofu', wakame: 'dried wakame seaweed', flour: 'flour', panko: 'panko breadcrumbs', 'curry-roux': 'Japanese curry roux block', 'hayashi-roux': 'hayashi rice roux block',
  salt: 'salt', oil: 'cooking oil', soy: 'soy sauce', sugar: 'sugar', 'pepper-powder': 'black pepper', 'sesame-oil': 'sesame oil', gochujang: 'gochujang (red pepper paste)', doenjang: 'doenjang (soybean paste)', 'chili-powder': 'Korean chili flakes', vinegar: 'vinegar', ketchup: 'ketchup', mayonnaise: 'mayonnaise', mirin: 'mirin', dashi: 'dashi granules', mentsuyu: 'concentrated mentsuyu', miso: 'miso paste', sesame: 'sesame seeds', 'yakisoba-sauce': 'yakisoba sauce', 'okonomiyaki-sauce': 'okonomiyaki sauce', worcester: 'Worcestershire sauce',
  pan: 'frying pan', pot: 'pot', microwave: 'microwave', oven: 'oven', 'air-fryer': 'air fryer', 'rice-cooker': 'rice cooker',
  'demo-egg-rice': 'soy sauce egg rice', 'scallion-egg-rice': 'green onion egg fried rice', 'tuna-mayo-rice': 'tuna mayo rice bowl', 'spam-mayo-rice': 'Spam mayo rice bowl', 'tuna-rice-balls': 'tuna rice balls', 'microwave-eggs': 'microwave steamed egg', 'egg-soup': 'egg drop soup', 'demo-tofu': 'pan-fried tofu', 'cabbage-egg-pancake': 'cabbage egg pancake', 'egg-toast': 'egg toast', 'soy-noodles': 'soy sauce cold noodles', 'butter-mushroom': 'butter-grilled king oyster mushroom', 'kimchi-fried-rice': 'kimchi fried rice', 'demo-kimchi-stew': 'tuna kimchi stew', 'doenjang-stew': 'doenjang stew', 'soft-tofu-stew': 'soft tofu stew (sundubu-jjigae)', 'budae-stew': 'easy army stew (budae-jjigae)', tteokbokki: 'tteokbokki', 'curry-rice': 'Korean curry rice', 'jjajang-rice': 'jjajang rice bowl', 'one-pan-tomato': 'one-pan tomato pasta', 'one-pan-cream': 'one-pan milk cream pasta', 'braised-tofu': 'braised tofu', 'braised-potato': 'braised potatoes', 'demo-rolled-egg': 'Korean rolled omelette', omurice: 'omurice', 'kimchi-pancake': 'kimchi pancake', 'potato-pancake': 'shredded potato pancake', 'spicy-pork': 'spicy stir-fried pork (jeyuk)', 'spicy-chicken-stew': 'spicy braised chicken (dakbokkeumtang)',
  'jp-oyakodon': 'oyakodon', 'jp-gyudon': 'gyudon', 'jp-butadon': 'butadon', 'jp-soboro-don': 'chicken soboro don', 'jp-teriyaki-chicken-don': 'teriyaki chicken rice bowl', 'jp-curry-rice': 'Japanese curry rice', 'jp-hayashi-rice': 'hayashi rice', 'jp-omurice': 'Japanese omurice', 'jp-salmon-onigiri': 'salmon onigiri', 'jp-yaki-onigiri': 'yaki onigiri', 'jp-kitsune-udon': 'kitsune udon', 'jp-yaki-udon': 'yaki udon', 'jp-curry-udon': 'curry udon', 'jp-zaru-soba': 'zaru soba', 'jp-yakisoba': 'yakisoba', 'jp-napolitan': 'spaghetti Napolitan', 'jp-mushroom-soy-pasta': 'mushroom butter soy pasta', 'jp-tamago-sando': 'tamago sando', 'jp-okonomiyaki': 'okonomiyaki', 'jp-tamagoyaki': 'tamagoyaki', 'jp-shogayaki': 'pork shogayaki', 'jp-chicken-teriyaki': 'chicken teriyaki', 'jp-salmon-teriyaki': 'salmon teriyaki', 'jp-hambagu': 'Japanese hamburg steak', 'jp-nikujaga': 'nikujaga', 'jp-tofu-miso-soup': 'tofu miso soup', 'jp-tonjiru': 'tonjiru (pork miso soup)', 'jp-chicken-egg-zosui': 'chicken and egg zosui', 'jp-hiyayakko': 'hiyayakko (chilled tofu)', 'jp-spinach-goma-ae': 'spinach goma-ae'
};
const en = id => { if (!EN[id]) throw new Error('영어 이름 없음: ' + id); return EN[id]; };
const name = (list, id) => list.find(x => x.id === id).name;
const cell = s => String(s).replace(/\|/g, '\\|');
const table = (head, rows) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map(r => `| ${r.map(cell).join(' | ')} |`)].join('\n');
// 요리 그림판 dishes-1~3.webp: 각 4열 × 5줄 = 20칸. 한식 30 → 일본식 30 순서로 이어서 채운다.
const pos = g => `dishes-${Math.floor(g / 20) + 1} ${Math.floor(g % 20 / 4) + 1}행 ${g % 4 + 1}열`;

const cats = D.categories.filter(c => c !== '전체');
const ingredients = cats.flatMap(c => D.ingredients.filter(i => i.category === c));
const byAtlas = atlas => D.recipes.filter(r => r.atlas === atlas).sort((a, b) => a.imageIndex - b.imageIndex);
const recipeRows = list => list.map(r => [r.imageIndex + 1, pos((r.atlas === 'jp' ? 30 : 0) + r.imageIndex), r.name, en(r.id), D.difficultyNames[r.difficulty], `${r.minutes}분`, r.ingredients.map(id => name(D.ingredients, id)).join(', '), r.tools.map(id => name(D.tools, id)).join(', ') || '가열 없이']);
const recipeHead = ['#', '그림판 위치', '요리', 'English', '난이도', '시간', '주재료', '도구'];

const md = `# 소복 재료·요리 목록 (이미지 생성용)

\`node tools/export-catalog-md.cjs\`로 \`dist/data.js\`에서 자동으로 만든 표예요. 데이터가 바뀌면 다시 실행하세요.

- 냉장고 재료 ${D.ingredients.length}개 · 양념 ${D.condiments.length}개 · 도구 ${D.tools.length}개
- 요리 ${D.recipes.length}개 (한식 ${byAtlas('kr').length} · 일본식 ${byAtlas('jp').length})
- 요리 그림판: **4열 × 5줄 그림판 3장**(한식 30개 → 일본식 30개 순서로 20개씩). 표의 \`#\` 순서대로 왼쪽 위부터 오른쪽으로, 줄이 끝나면 다음 줄로 채워요. 순서가 바뀌면 앱에서 다른 요리 그림이 나와요.

## 프롬프트 예시

**재료 아이콘**
> Cute pixel-art food icon of {English}, single item centered, soft pastel colors, thin dark brown outline, transparent background, cozy Korean kitchen game style, no text.

**요리 그림판**
> A 4 columns × 5 rows grid sprite sheet of cute pixel-art home dishes, each dish in a pastel bowl or plate seen from slightly above, same size and spacing in every cell, soft pastel colors, thin dark brown outline, plain light background, no text, no labels. Fill the cells left-to-right, top-to-bottom in this order: {English 목록을 # 순서대로}.

## 1. 내 냉장고 — 재료 ${D.ingredients.length}개

${cats.map(c => `### ${c} (${ingredients.filter(i => i.category === c).length})\n\n${table(['재료', 'English', '이모지', '다른 이름'], ingredients.filter(i => i.category === c).map(i => [i.name, en(i.id), i.emoji, i.aliases.join(', ') || '—']))}`).join('\n\n')}

## 2. 내 주방 — 양념 ${D.condiments.length}개

${table(['양념', 'English'], D.condiments.map(c => [c.name, en(c.id)]))}

## 3. 내 주방 — 도구 ${D.tools.length}개

${table(['도구', 'English'], D.tools.map(t => [t.name, en(t.id)]))}

## 4. 요리책 — 한식 ${byAtlas('kr').length}개 (그림판 \`dishes-1\`, \`dishes-2\` 앞쪽)

${table(recipeHead, recipeRows(byAtlas('kr')))}

## 5. 요리책 — 일본식 ${byAtlas('jp').length}개 (그림판 \`dishes-2\` 뒤쪽, \`dishes-3\`)

${table(recipeHead, recipeRows(byAtlas('jp')))}

## 6. 그림판 순서용 영어 목록 (프롬프트에 붙여 넣기)

**한식:** ${byAtlas('kr').map(r => `${r.imageIndex + 1}. ${en(r.id)}`).join(', ')}

**일본식:** ${byAtlas('jp').map(r => `${r.imageIndex + 1}. ${en(r.id)}`).join(', ')}
`;
fs.writeFileSync(out, md);
console.log(`wrote ${out}`);
