// node test.js
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const { normalize, matchRecipes } = require("./matcher");

const ctx = {};
vm.runInNewContext(fs.readFileSync(__dirname + "/recipes.js", "utf8") + ";this.RECIPES=RECIPES;this.PANTRY=PANTRY;", ctx);
const { RECIPES, PANTRY } = ctx;

assert.strictEqual(normalize(" 달걀 "), "계란");
assert.strictEqual(normalize("스파게티"), "파스타면");

// 계란 + 밥 → 간장계란밥 바로 가능
let { ready, almost } = matchRecipes(["달걀", "밥"], RECIPES, { pantry: PANTRY });
assert.ok(ready.some((r) => r.name === "간장계란밥"));
// 초간단이 먼저 나온다
assert.ok(ready.every((r, i) => i === 0 || ready[i - 1].level <= r.level));
// 오므라이스는 밥+계란만 필수라 가능
assert.ok(ready.some((r) => r.name === "오므라이스"));
// 김치볶음밥은 김치가 없으니 '하나만 더'
assert.ok(almost.some((r) => r.name === "김치볶음밥" && r.missingMain[0] === "김치"));

// 기본양념 끄면 된장찌개는 불가
({ ready } = matchRecipes(["두부"], RECIPES, { pantry: PANTRY, usePantry: false }));
assert.ok(!ready.some((r) => r.name === "된장찌개"));
({ ready } = matchRecipes(["두부"], RECIPES, { pantry: PANTRY }));
assert.ok(ready.some((r) => r.name === "된장찌개"));

// 아무 재료도 없으면 아무것도 추천 안 함
({ ready, almost } = matchRecipes([], RECIPES, { pantry: PANTRY }));
assert.strictEqual(ready.length + almost.length, 0);

console.log("✅ all tests passed");
