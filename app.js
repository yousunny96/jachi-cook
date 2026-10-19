const LEVEL_LABEL = { 1: "⭐ 초간단", 2: "⭐⭐ 보통", 3: "⭐⭐⭐ 도전" };
const QUICK = ["계란", "밥", "김치", "라면", "참치캔", "스팸", "두부", "양파", "대파", "감자", "돼지고기", "치즈"];
const STORAGE_KEY = "jachi-cook:ingredients";

const state = {
  owned: load(),
  level: 0,
};

const $ = (id) => document.getElementById(id);

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.owned)); } catch {}
}

function addIngredient(raw) {
  raw.split(/[,，\s]+/).map(normalize).filter(Boolean).forEach((name) => {
    if (!state.owned.includes(name)) state.owned.push(name);
  });
  save();
  render();
}

function removeIngredient(name) {
  state.owned = state.owned.filter((i) => i !== name);
  save();
  render();
}

function chip(text, onClick, cls = "") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `chip ${cls}`;
  b.textContent = text;
  b.onclick = onClick;
  return b;
}

function card(r, showMissing) {
  const el = document.createElement("details");
  el.className = `card level-${r.level}`;
  const tags = [
    ...r.usedMain.map((i) => `<span class="tag have">${i}</span>`),
    ...r.usedSub.map((i) => `<span class="tag have sub">${i}</span>`),
    ...(showMissing ? r.missingMain.map((i) => `<span class="tag need">+ ${i}</span>`) : []),
  ].join("");
  el.innerHTML = `
    <summary>
      <div class="card-head">
        <strong>${r.name}</strong>
        <span class="level">${LEVEL_LABEL[r.level]}</span>
      </div>
      <div class="meta">⏱ ${r.time}분</div>
      <div class="tags">${tags}</div>
    </summary>
    <ol>${r.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
    ${r.missingSub.length ? `<p class="optional">있으면 더 맛있어요: ${r.missingSub.join(", ")}</p>` : ""}
  `;
  return el;
}

function renderList(container, countEl, list, showMissing, emptyMsg) {
  const filtered = state.level ? list.filter((r) => r.level === state.level) : list;
  container.replaceChildren(...filtered.map((r) => card(r, showMissing)));
  countEl.textContent = filtered.length ? `${filtered.length}개` : "";
  if (!filtered.length) container.innerHTML = `<p class="empty">${emptyMsg}</p>`;
}

function render() {
  $("chips").replaceChildren(...state.owned.map((i) => chip(`${i} ✕`, () => removeIngredient(i), "owned")));
  $("quick-chips").replaceChildren(
    ...QUICK.filter((q) => !state.owned.includes(q)).map((q) => chip(`+ ${q}`, () => addIngredient(q)))
  );

  const { ready, almost } = matchRecipes(state.owned, RECIPES, {
    pantry: PANTRY,
    usePantry: $("use-pantry").checked,
  });
  const hint = state.owned.length ? "해당하는 요리가 없어요." : "위에 재료를 넣어보세요!";
  renderList($("ready"), $("ready-count"), ready, false, hint);
  renderList($("almost"), $("almost-count"), almost, true, hint);
}

// 자동완성 목록
const allIngredients = new Set([...RECIPES.flatMap((r) => [...r.main, ...r.sub]), ...Object.keys(ALIASES)]);
$("ingredient-list").replaceChildren(...[...allIngredients].sort().map((i) => Object.assign(document.createElement("option"), { value: i })));

$("ingredient-form").addEventListener("submit", (e) => {
  e.preventDefault();
  addIngredient($("ingredient-input").value);
  $("ingredient-input").value = "";
});
$("use-pantry").addEventListener("change", render);
$("level-filter").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  state.level = Number(btn.dataset.level);
  [...$("level-filter").children].forEach((b) => b.classList.toggle("active", b === btn));
  render();
});

render();
