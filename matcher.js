// 재료 매칭 로직 (브라우저/Node 공용)

// 같은 재료를 다르게 부르는 경우를 하나로 모은다.
const ALIASES = {
  "달걀": "계란", "계란후라이": "계란",
  "참치": "참치캔",
  "삼겹살": "돼지고기", "대패삼겹살": "돼지고기", "앞다리살": "돼지고기", "목살": "돼지고기", "돼지": "돼지고기",
  "소": "소고기", "불고기감": "소고기", "다진소고기": "소고기",
  "닭": "닭고기", "닭다리": "닭고기",
  "스파게티": "파스타면", "파스타": "파스타면", "스파게티면": "파스타면",
  "소시지": "햄", "비엔나": "햄",
  "파": "대파", "쪽파": "대파",
  "깐마늘": "마늘",
  "팽이버섯": "버섯", "새송이": "버섯", "표고버섯": "버섯", "양송이": "버섯",
  "슬라이스치즈": "치즈", "모짜렐라": "치즈", "파마산": "치즈",
  "떡볶이떡": "떡", "가래떡": "떡",
  "빵": "식빵",
  "국수": "소면",
  "카레": "카레가루",
  "밀가루": "부침가루",
  "호박": "애호박",
  "케찹": "케첩",
  "마요": "마요네즈",
  "올리브오일": "올리브유",
};

function normalize(name) {
  const key = String(name).trim().replace(/\s+/g, "");
  if (!key) return "";
  return ALIASES[key] || key;
}

/**
 * @param {string[]} owned 사용자가 가진 재료
 * @param {object[]} recipes 레시피 목록
 * @param {object} opts { pantry: string[], usePantry: boolean, maxMissing: number }
 * @returns {{ ready: object[], almost: object[] }}
 *   ready  : 필수 재료가 다 있는 요리
 *   almost : 필수 재료가 maxMissing 개 이하로 부족한 요리
 */
function matchRecipes(owned, recipes, opts = {}) {
  const { pantry = [], usePantry = true, maxMissing = 1 } = opts;
  const mine = new Set(owned.map(normalize).filter(Boolean));
  const have = new Set(mine);
  if (usePantry) pantry.forEach((p) => have.add(p));

  const ready = [];
  const almost = [];

  for (const r of recipes) {
    const missingMain = r.main.filter((i) => !have.has(i));
    const usedMain = r.main.filter((i) => have.has(i));
    const usedSub = r.sub.filter((i) => have.has(i));
    const missingSub = r.sub.filter((i) => !have.has(i));

    // 사용자가 직접 입력한 재료(기본양념 제외)를 하나도 안 쓰는 요리는 제외
    if (![...r.main, ...r.sub].some((i) => mine.has(i))) continue;

    const result = {
      ...r,
      missingMain, usedMain, usedSub, missingSub,
      // 부재료까지 얼마나 갖췄는지 (정렬용)
      score: (usedMain.length * 2 + usedSub.length) / (r.main.length * 2 + r.sub.length),
    };

    if (missingMain.length === 0) ready.push(result);
    else if (missingMain.length <= maxMissing) almost.push(result);
  }

  const byLevelThenScore = (a, b) => a.level - b.level || b.score - a.score || a.time - b.time;
  ready.sort(byLevelThenScore);
  almost.sort((a, b) => a.missingMain.length - b.missingMain.length || byLevelThenScore(a, b));
  return { ready, almost };
}

if (typeof module !== "undefined") module.exports = { normalize, matchRecipes, ALIASES };
