// 언어 전환(일본어 기본 · 한국어). 번역 문장은 i18n/ja-*.js에 있고, 여기서는 고르기만 한다.
// - 화면 문장: t('한국어 원문', {n:3}) → 일본어면 i18n/ja-ui.js에서 같은 원문을 찾아 바꾸고, 없으면 한국어 그대로.
// - 데이터(재료·요리·친구): applyData가 이름·분량·조리 순서를 고른 언어로 바꿔 끼운다. 한국어 원본은 _ko에 둔다.
(function (root) {
  'use strict';
  const KEY = 'sobok.lang', LANGS = ['ja', 'ko'], DEFAULT = 'ja';
  const JA = () => root.SobokJa || {};
  let store = null; try { store = root.localStorage || null; } catch { store = null; }
  let lang = DEFAULT;
  try { const saved = store?.getItem(KEY); if (LANGS.includes(saved)) lang = saved; } catch {}

  const fill = (s, vars) => vars ? s.replace(/\{([A-Za-z]\w*)\}/g, (m, k) => k in vars ? vars[k] : m) : s;
  function t(ko, vars) { return fill(lang === 'ja' ? (JA().ui?.[ko] ?? ko) : ko, vars); }
  const category = ko => lang === 'ja' ? (JA().catalog?.categories?.[ko] ?? ko) : ko;

  // 처음 부를 때 한국어 원본을 _ko에 저장해 두고, 언어가 바뀔 때마다 원본 또는 일본어로 덮어쓴다.
  function keep(item, fields) { if (!item._ko) { const ko = {}; fields.forEach(f => { ko[f] = item[f]; }); Object.defineProperty(item, '_ko', { value: ko }); } return item._ko; }
  function applyData(D) {
    if (!D) return;
    const ja = lang === 'ja', C = JA().catalog || {}, R = JA().recipes || {};
    D.ingredients.forEach(x => {
      const ko = keep(x, ['name', 'aliases']), j = ja && C.ingredients?.[x.id];
      x.name = j ? j[0] : ko.name;
      // 일본어 화면에서도 한국어 이름으로 찾을 수 있게 한국어 이름·별칭을 뒤에 붙인다.
      x.aliases = j ? [...(j[1] || []), ko.name, ...ko.aliases] : ko.aliases;
    });
    ['condiments', 'tools'].forEach(type => D[type].forEach(x => { const ko = keep(x, ['name']); x.name = (ja && C[type]?.[x.id]) || ko.name; }));
    D.characters.forEach(c => {
      const ko = keep(c, ['name', 'personality', 'dialogues', 'pick']), j = ja && C.characters?.[c.id];
      c.name = j?.name || ko.name; c.personality = j?.personality || ko.personality; c.dialogues = j?.dialogues || ko.dialogues;
      c.pick = { quotes: j?.quotes || ko.pick.quotes, subs: j?.subs || ko.pick.subs };
    });
    D.recipes.forEach(r => {
      const ko = keep(r, ['name', 'mealType', 'amounts', 'steps', 'tip', 'water']), j = ja && R[r.id];
      ['name', 'mealType', 'steps', 'tip', 'water'].forEach(f => { r[f] = (j && j[f]) || ko[f]; });
      r.amounts = j?.amounts ? { ...ko.amounts, ...j.amounts } : ko.amounts;
    });
    const names = (obj, src) => { if (!obj) return; if (!obj._ko) Object.defineProperty(obj, '_ko', { value: { ...obj } }); Object.keys(obj._ko).forEach(k => { obj[k] = (ja && src?.[k]) || obj._ko[k]; }); };
    names(D.difficultyNames, C.difficulty);
    names(D.cuisineNames, C.cuisine);
  }

  // index.html의 고정 문장(data-i18n)과 탭 제목·언어 표시
  function applyPage(doc) {
    if (!doc?.querySelectorAll) return;
    doc.documentElement?.setAttribute('lang', lang);
    doc.querySelectorAll('[data-i18n]').forEach(el => { if (el.dataset.ko == null) el.dataset.ko = el.innerHTML; el.innerHTML = t(el.dataset.ko); });
    if (doc.title != null) { if (root.__sobokTitle == null) root.__sobokTitle = doc.title; doc.title = t(root.__sobokTitle); }
  }

  function setLang(next) {
    if (!LANGS.includes(next)) return;
    lang = next;
    try { store?.setItem(KEY, next); } catch {}
    applyData(root.SobokData); applyPage(root.document);
  }

  root.SobokI18n = { t, category, setLang, applyData, applyPage, get lang() { return lang; }, LANGS };
  applyData(root.SobokData);
})(typeof window !== 'undefined' ? window : globalThis);
