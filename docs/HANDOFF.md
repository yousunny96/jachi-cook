# 소복 인수인계 (2026-11-02 기준)

혼자 사는 사람이 가진 재료·양념·조리 도구로 만들 수 있는 1인분 요리를 골라 주는 **모바일 웹 프로토타입**입니다.
일본어가 기본 언어이고 한국어로 바꿀 수 있습니다. 빌드 과정 없는 순수 HTML·CSS·JS이고, 서버 기능은 Node 하나(`server.cjs`)를 로컬 서버와 Vercel 함수가 같이 씁니다.

## 1. 링크

| 무엇 | 위치 |
|---|---|
| 저장소 | https://github.com/yousunny96/jachi-cook (`main`이 최신, 공개 저장소) |
| 미리 보기 | https://claude.ai/artifact/D7pGSYexk9RnUazQkUUoFa (화면 파일만 올린 정적 페이지. 서버 기능 없음) |
| 일본어 번역 검수 시트 | https://docs.google.com/spreadsheets/d/1ew7D0xyhm-SfzbtxxDm835rQ6RvW-L2A95gYynzy94Y/edit |
| 최근 PR | #1 도구 그림·의견 팝업·Vercel 구성·일본어 전환 · #2 룰렛·처음 설정 버튼 · #3 냉장고 검색 문구 · #4 마이 탭 (모두 머지됨) |
| 실제 서비스 | **아직 배포 안 함** (Vercel 연결 전) |

## 2. 지금 상태

**된 것**
- **화면 6개**: 내 집(픽셀 부엌), 냉장고, 내 주방, 요리책, 레시피 상세, 마이. 그 밖에 처음 화면과 친구 고르기가 있습니다.
- **데이터**: 요리 60개(한식 30 · 일본 가정식 30), 재료 61, 양념 20, 도구 6, 친구 8명.
- **언어**: 일본어 기본, 한국어 전환. 일본어는 전부 AI 초벌 번역이고 원어민 검수 전입니다.
- **의견 받기 팝업**: 레시피를 처음 보고 나왔을 때 한 번만 뜹니다. 서버가 있을 때만 뜹니다.
- **마이 탭**: 로그인 자리(아직 연결 안 함)와 즐겨찾기가 있습니다.
- **배포 준비**: Vercel 배포 구성(`vercel.json`, `api/*.js`)과 의견 저장소(Upstash Redis) 코드가 들어 있습니다.

**안 된 것 / 확인 못 한 것**
- 실제 Vercel 배포와 Upstash 연결. 코드와 테스트(가짜 응답)까지만 했습니다.
- 로그인. 버튼만 있고, 누르면 「곧 열릴 예정」 안내가 나옵니다(아래 6장).
- 일본어 원어민 검수. 시트를 공유해 검수받는 중입니다(아래 5장).
- 레시피 내용 검수. 분량·조리 순서 모두 AI 초안이고 사람이 직접 만들어 확인하지 않았습니다.

## 3. 실행 · 테스트 · 배포

```bash
node server.cjs                      # http://127.0.0.1:4173  (Node 22+, 설치할 패키지 없음)
node --test tests/*.test.cjs         # 테스트 49개, 모두 통과해야 함
node tools/build-single.cjs out.html # 파일 하나짜리 HTML(오프라인 공유용)
```

- 환경 변수
  - `PORT`, `HOST`(외부에서 접속하려면 `0.0.0.0`)
  - `GEMINI_API_KEY`, `GEMINI_MODEL`(선택, AI 기능)
  - `FEEDBACK_FILE`(로컬 의견 파일 위치)
  - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`(Vercel)
- **Vercel 배포 절차**
  1. 저장소를 Import합니다. 빌드 없이 `dist/`가 화면, `api/*.js`가 함수로 올라갑니다.
  2. Storage → Marketplace에서 Upstash Redis를 연결합니다.
  3. 필요하면 `GEMINI_API_KEY`를 넣습니다.
  4. 확인: `/api/feedback`이 `{"ok":true}`를 돌려주면 서버가 살아 있는 겁니다. 레시피를 하나 보고 나와서 의견 팝업에 답한 뒤, `vercel env pull .env.local && node --env-file=.env.local tools/feedback-summary.cjs`로 집계해 봅니다.
- 미리 보기 링크는 Claude(claude.ai) 아티팩트입니다. 저장소와 자동으로 맞춰지지 않아서 따로 올려야 바뀝니다.

## 4. 코드 구조

| 파일 | 역할 |
|---|---|
| `dist/index.html` | 진입점. 스크립트 순서: 데이터 → 번역 → `i18n.js` → `model.js` → `voxel.js` → `app.js` |
| `dist/app.js` | 화면 전부. 하나의 IIFE 안에 화면 함수(`home`·`fridge`·`kitchen`·`recipes`·`detail`·`characters`·`my`·`welcome`)가 HTML 문자열을 만들고 `render()`가 `#app`에 넣습니다 |
| `dist/model.js` | 추천 규칙, 저장, 재료 글 인식(한국어·일본어 단위·조사 처리), 랜덤 후보 |
| `dist/data.js` · `data-japanese.js` · `recipe-drafts.js` | 한국어 원본 데이터(재료·양념·도구·친구·요리·AI 조리 초안) |
| `dist/i18n.js` | 언어 상태와 `t()`. 데이터 이름은 `applyData`가 일본어로 바꿔 끼웁니다(한국어 원본은 각 항목의 `_ko`) |
| `dist/i18n/ja-*.js` | 일본어 번역. 사람이 직접 고치는 파일입니다(5장) |
| `dist/voxel.js` | 홈 부엌 그림, 가구를 누를 때 열리는 연출 |
| `dist/styles.css` | 스타일 전부. 뒤쪽에 덧붙인 규칙일수록 최근 변경입니다 |
| `server.cjs` | `createHandler()` 하나로 `/api/recipe`·`/api/ingredients`·`/api/feedback`를 처리하고, 로컬에서는 정적 파일도 내줍니다 |
| `api/*.js` | Vercel 함수. `server.cjs`의 처리기를 그대로 씁니다 |
| `tools/` | 의견 집계, 단일 HTML, 카탈로그 md, 번역 검수 CSV |

**알아 두면 편한 규칙**
- **클릭:** 모든 버튼은 `data-action`(+`data-id`)으로 구분하고, `document`의 click 처리기 하나가 받습니다(`app.js` 아래쪽).
- **화면 이동:** `navigate(page)`가 맡습니다. `history.pushState`로 브라우저 뒤로가기도 됩니다.
- **저장:** localStorage `sobok.prototype.v1`(재료·도구·양념·친구·즐겨찾기), `sobok.lang`(언어), `sobok.feedback.v1`(의견 팝업을 이미 띄웠는지).
- **그림:** 재료·요리·도구·캐릭터 그림은 큰 그림판 한 장에서 좌표로 잘라 SVG로 그립니다. 좌표는 `data.js`의 `icon`·`sprite`·`crop`·`face`와 `app.js`의 `DISH` 표에 있습니다.
- **헤더:** 냉장고·요리책·내 주방·마이 화면은 헤더에 언어 버튼만 둡니다. 내 집은 앱 이름, 레시피 상세는 「뒤로가기」를 보여 줍니다.

## 5. 번역 운영

- **고칠 파일**
  - `dist/i18n/ja-ui.js`: 화면 문장. 왼쪽 한국어 원문이 열쇠입니다.
  - `ja-catalog.js`: 재료·친구 이름과 대사
  - `ja-recipes.js`: 요리 60개
  - 자세한 규칙은 [docs/translation.md](translation.md)에 있습니다.
- **새 문장 추가:** 코드에 `t('한국어 원문', {n})`처럼 쓰고, 같은 원문을 `ja-ui.js`에 넣습니다. 빠지면 `tests/i18n.test.cjs`가 실패합니다. 이 테스트는 모든 화면과 요리 60개를 일본어로 그려서 한국어가 남았는지도 검사합니다.
- **검수 시트:** `node tools/i18n-sheet.cjs csv`로 `docs/i18n-review/*.csv`를 만들어 시트에 넣었습니다. 칸은 키 · 위치 · 한국어 · 일본어(AI) · **수정안** · 메모입니다.
  - 검수자는 수정안(노란 칸)만 채웁니다.
  - **시트 → 번역 파일로 되돌리는 도구는 아직 없습니다.** 키 열(`ui|원문`, `recipes|id|steps|0` 같은 주소)로 찾아 넣으면 됩니다.
  - 구글 시트가 앞뒤 공백을 지워서, 「` 外 {n}개`」처럼 원문 앞에 공백이 있는 문장은 되돌릴 때 공백을 살려야 합니다.
- **시트가 코드보다 늦은 부분(PR #4 이후):** 시트 「화면 문장」 탭에 마이 탭 문장 6줄이 없고, 없어진 문장 4줄(「즐겨찾기」, 「하트를 누른 요리를 모아 봤어요…」, 「카드 오른쪽 위 하트를…」, 「부엌으로 돌아가기」)이 남아 있습니다. 다시 내보내 맞추면 됩니다. 수정안이 이미 적혀 있으면 덮어쓰지 않게 주의하세요.

## 6. 로그인을 붙일 때

- **버튼:** 마이 화면의 로그인 버튼은 `data-action="login"`입니다. 지금은 click 처리기에서 안내 토스트만 띄웁니다(`app.js`의 `action==='login'`).
- **즐겨찾기 저장 위치:** `state.favorites`(요리 id 배열)에 있고 localStorage에만 저장됩니다. 읽기는 `M.favoritesOf`, 바꾸기는 `M.toggleFavorite`, 화면은 `my()` 함수입니다.
- **할 일:** 로그인하면 기존 브라우저 즐겨찾기를 계정으로 옮기고(합치기), 그다음부터 계정에서 읽고 쓰게 하면 됩니다.
- **로그인 뒤 화면:** 마이 화면의 로그인 카드(`.login-card`)를 계정 정보로 바꾸면 됩니다.
- **서버:** 사용자 데이터를 다루는 API가 아직 없습니다. 지금 서버는 의견 저장과 AI 보조만 합니다.

## 7. 의견 수집

- **팝업이 뜨는 조건:** 레시피 상세를 처음 보고 나오면 1.2초 뒤에 한 번만 뜹니다. `GET /api/feedback`이 성공할 때만 뜨므로 미리 보기 링크(정적 페이지)에서는 안 뜹니다.
- **저장하는 값:** 답(yes / unsure / dismissed), 좋았던 것, 아쉬운 점(300자), 친구, 표시 경로. IP는 저장하지 않고, 전체 분당 30건까지만 받습니다.
- **어디에 쌓이나:** Upstash 환경 변수가 있으면 Redis 목록 `sobok:feedback`, 없으면 `data/feedback.jsonl`(git 제외)입니다.
- **설정 화면에서 다시 보내기:** 설정 화면을 없애면서 이 진입점도 없어졌습니다. 서버의 `trigger: 'settings'` 값은 호환용으로 남아 있습니다.

## 8. 알려진 이슈 · 남은 일

1. **AI 기능 횟수 제한(공개 전 필수):** 제한·캐시가 함수 인스턴스 메모리에 있어서 Vercel에서는 인스턴스마다 따로 셉니다. 공개 전에 Gemini 키 쪽 사용량 한도를 걸어야 합니다.
2. **AI 조리 단계 생성(`/api/recipe`):** 결과가 한국어로만 나옵니다. 지금 화면에서는 호출하지 않습니다.
3. **캐릭터 그림 용량:** `dist/assets/characters-pixel.png`가 1.2MB라 모바일에서 가끔 못 받아올 때가 있었습니다. WebP로 바꾸면 좋습니다.
4. **일본어 둥근 글꼴(M PLUS Rounded 1c):** Google Fonts에서 불러옵니다. 오프라인 단일 HTML에는 들어가지 않습니다.
5. **오래된 문서:** `docs/sobok-developer-spec.md`는 v1.1(친구 12명, AI 레시피 6개 시절) 명세라 지금과 다릅니다. 최신 기준은 README와 이 문서입니다.
6. **favicon 없음:** 서버 로그에 404가 하나 찍힙니다.
7. **오래된 그림 파일:** `dist/assets/`의 `reference-home.png`, `kitchen-room.png`, `character-sheet.png`, `characters-transparent.png`는 코드에서 쓰지 않는 예전 그림입니다. 단일 HTML에는 쓰는 그림만 들어갑니다.

## 9. 작업 방식

- **브랜치:** `main`에서 브랜치를 따서 PR로 올리고, 머지 커밋으로 합쳤습니다. 커밋 메시지는 한국어로 "무엇을 왜"를 적습니다.
- **올리기 전:** `node --test tests/*.test.cjs`를 반드시 돌립니다. 화면을 바꾸면 한국어·일본어 둘 다 직접 띄워서 확인합니다. 일본어는 글자가 넓어서 넘치기 쉽습니다.
- **자동 검사 없음:** 저장소에 CI가 없어서 로컬 테스트가 유일한 확인 절차입니다.
