# 소복 · 나의 작은 부엌

혼자 사는 사람이 지금 가진 재료·양념·조리 도구로 만들 수 있는 1인분 요리를 고르는 모바일 웹 프로토타입입니다. 픽셀 부엌에서 냉장고·조리대·요리책을 눌러 이동하고, 고른 친구 캐릭터가 말풍선으로 함께합니다.

미리 보기: https://claude.ai/artifact/D7pGSYexk9RnUazQkUUoFa (정적 페이지라 재료 AI 인식은 동작하지 않습니다. 공유하려면 페이지의 공유 메뉴에서 열어 주세요.)

## 화면과 기능

- **언어**: 일본어가 기본이고 오른쪽 위 `日本語 | 한국어` 버튼으로 바꿉니다(브라우저에 기억). 일본어 문장은 AI 초벌 번역이며 `dist/i18n/`의 파일만 고치면 바뀝니다 → [번역 수정 안내](docs/translation.md). 설정 화면은 없앴습니다.

- **내 집**: 픽셀 부엌 그림. 냉장고·조리대·요리책을 누르면 해당 화면으로 가고, 열린 그림으로 바뀝니다. 선택한 친구가 말풍선으로 인사합니다.
- **냉장고**: 재료 61종을 카테고리·검색으로 고릅니다. 여러 재료를 글로 한 번에 넣을 수 있고, 앱이 모르는 단어는 서버 AI가 등록된 재료 중에서 찾아 줍니다(선택 사항).
- **내 주방**: 조리 도구 6종(프라이팬·냄비·전자레인지·오븐·에어프라이어·전기밥솥)과 양념 20종을 고릅니다. 도구는 픽셀 그림으로 표시됩니다.
- **요리책**: 한식 30개 + 일본 가정식 30개, 모두 60개. 바로 만들 수 있는 요리·조금 부족한 요리로 나눠 보여 주고, 요리 종류·난이도 필터, 즐겨찾기, 랜덤 메뉴 돌리기를 지원합니다.
- **레시피 상세**: 1인분 분량, 재료 보유·부족 표시, 번호별 조리 단계, YouTube·네이버 블로그 검색 링크. 다 만들면 사용한 재료를 냉장고에서 뺄지 확인합니다.
- **친구 고르기**: 8명(치이카와·하치와레·우사기·시사·모몽가·랏코·쿠리만쥬·카니). 성격별 대사가 홈·추천·완료 화면에 나옵니다.
- **의견 받기**: 레시피 상세를 처음 보고 나오면 친구가 "정식으로 나오면 또 같이 요리할래?"를 한 번만 묻습니다. 응 → 제일 좋았던 것 하나, 잘 모르겠어 → 아쉬운 점 한 줄(건너뛰기 가능), 닫으면 '닫음'으로 기록합니다. 의견 API가 없는 정적 페이지에서는 자동으로 띄우지 않습니다.
- **마이 · Google 로그인**: 마이 탭에서 Google 계정으로 로그인합니다. 로그인하면 즐겨찾기가 계정(서버 DB)에 보관돼 다른 기기에서도 보입니다. 로그인 전에 이 브라우저에서 고른 즐겨찾기는 로그인할 때 계정에 합쳐집니다. 서버에 로그인 설정이 없으면(정적 미리 보기 등) 예전처럼 '곧 열릴 예정' 안내만 나옵니다.
- **어드민**(`/admin.html`): `ADMIN_EMAILS`에 넣은 Google 계정으로 로그인하면 가입자 수·최근 7일 로그인·사용자 목록·많이 즐겨찾기한 요리·받은 의견을 봅니다. 권한 확인은 서버가 합니다.
- 냉장고·주방 설정은 지금도 이 브라우저(localStorage)에만 저장됩니다. 저장이 안 되면 현재 탭에서만 계속 쓸 수 있습니다.

> 레시피 분량과 조리 단계는 모두 AI가 작성한 초안이며, 사람이 직접 만들어 검수하지 않았습니다.

## Vercel 배포

1. Vercel에서 이 저장소를 가져옵니다(Import). 설정은 `vercel.json`에 있어서 빌드 없이 `dist/`가 화면, `api/*.js`가 함수로 올라갑니다.
2. 프로젝트의 **Storage → Marketplace**에서 **Upstash Redis**(무료 요금제)를 연결합니다. 연결하면 `UPSTASH_REDIS_REST_URL`·`UPSTASH_REDIS_REST_TOKEN`(또는 `KV_REST_API_URL`·`KV_REST_API_TOKEN`)이 환경 변수로 자동으로 들어가고, 의견은 Redis 목록 `sobok:feedback`에 쌓입니다.
3. AI 기능을 쓰려면 환경 변수에 `GEMINI_API_KEY`를 넣습니다(선택).
4. **Google 로그인**: [Google Cloud Console → API 및 서비스 → 사용자 인증 정보](https://console.cloud.google.com/apis/credentials)에서 *OAuth 클라이언트 ID*(웹 애플리케이션)를 만들고, **승인된 JavaScript 원본**에 배포 주소(예: `https://내프로젝트.vercel.app`)를 넣습니다. 로컬에서 쓰려면 `http://localhost`와 `http://localhost:4173`도 넣습니다(`127.0.0.1`은 Google이 받지 않습니다). 그다음 Vercel 환경 변수에 넣습니다.
   - `GOOGLE_CLIENT_ID`: 위에서 만든 클라이언트 ID(`….apps.googleusercontent.com`)
   - `SESSION_SECRET`: 로그인 쿠키 서명용 임의 문자열 16자 이상(예: `openssl rand -hex 32`)
   - `ADMIN_EMAILS`: 어드민으로 쓸 Google 이메일, 여러 개면 쉼표로 구분
5. 의견 확인: 어드민 페이지 `/admin.html`, 또는 `vercel env pull .env.local` 후 `node --env-file=.env.local tools/feedback-summary.cjs`.

사용자 DB는 의견과 같은 Upstash Redis를 씁니다. 사용자 한 명이 `sobok:user:<Google sub>`(JSON 문자열) 하나이고, 가입 순서는 정렬 집합 `sobok:users`에 들어갑니다. 저장하는 값은 Google 계정 ID·이메일·이름·프로필 사진 주소·가입/마지막 로그인 시각·로그인 횟수·즐겨찾기뿐이고, 비밀번호나 Google 접근 토큰은 받지 않습니다. 로그인 쿠키(`sobok_session`, HttpOnly, 30일)는 `SESSION_SECRET`으로 서명하며, 이 값을 바꾸면 모두 로그아웃됩니다.

의견은 정해진 값(답·좋았던 것·아쉬운 점 300자·친구·표시 경로)만 받고 IP는 저장하지 않으며, 전체 분당 30건까지 받습니다. AI 기능의 횟수 제한·캐시는 함수 인스턴스 메모리에 있어서 Vercel에서는 인스턴스마다 따로 셉니다. 공개 전 Gemini 키는 무료 한도 키로 두거나 공급자 쪽 한도를 걸어 두세요.

## 로컬 실행

- **개발 서버**: Node.js 22 이상에서 `node server.cjs` 실행 후 http://127.0.0.1:4173 접속 (`PORT`로 포트, `HOST=0.0.0.0`으로 외부 접속 허용). Redis 환경 변수가 없으면 의견은 `data/feedback.jsonl`(`FEEDBACK_FILE`로 변경), 사용자는 `data/users.json`(`USERS_FILE`로 변경)에 쌓입니다. 로그인을 시험하려면 위의 `GOOGLE_CLIENT_ID`·`SESSION_SECRET`·`ADMIN_EMAILS`를 넣고 `http://localhost:4173`으로 접속합니다.
- **파일 하나로 묶기**: `node tools/build-single.cjs [출력 경로]` → 스타일·스크립트·사용 중인 그림을 넣은 `sobok-prototype.html` 생성(기본 위치는 저장소 바깥 상위 폴더). 브라우저로 바로 열면 됩니다.
- **AI 기능(선택)**: 서버 환경에 `GEMINI_API_KEY`를 설정합니다. 키는 대화·소스·HTML에 붙여 넣지 않습니다. `GEMINI_MODEL` 기본값은 `gemini-2.5-flash-lite`이며 유료 모델로 자동 전환하지 않습니다. 키가 없거나 한도가 차면 번들 초안을 그대로 씁니다.

## 서버 API

| 경로 | 하는 일 |
|---|---|
| `POST /api/recipe` | recipeId만 받아 서버가 카탈로그의 재료·도구로 레시피를 다시 생성. 응답의 ID·형식·길이를 검사하고 화면에는 텍스트로만 출력 |
| `GET·POST /api/feedback` | GET은 의견 서버가 있는지만 확인(저장된 의견은 내려주지 않음). POST는 의견 한 건 저장 |
| `GET·PUT /api/me` | GET은 로그인 사용 여부·Client ID·로그인한 사용자. PUT은 즐겨찾기 저장(등록된 요리 ID만) |
| `POST·DELETE /api/auth` | POST는 Google ID 토큰을 확인해 사용자를 만들거나 갱신하고 로그인 쿠키를 줌. DELETE는 로그아웃 |
| `GET /api/admin` | 어드민만. 통계·사용자 목록·많이 즐겨찾기한 요리·최근 의견 200건 |
| `POST /api/ingredients` | 앱이 못 알아본 단어(최대 12개)를 등록된 재료 ID 중에서만 매칭. 냉장고 정보는 보내지 않음 |

성공 캐시 24시간, 외부 호출 분당 5회·24시간 30회, 요청 제한 20초입니다. 메모리 기반이라 재시작하면 초기화됩니다. 로컬 검토용 서버이므로 공개 배포 전 인증·사용량 제한·콘텐츠 검수를 추가해야 합니다.

## 파일 구조

| 파일 | 내용 |
|---|---|
| `dist/index.html` | 화면 진입점 |
| `dist/app.js` | 화면 그리기와 동작 |
| `dist/styles.css` | 스타일 |
| `dist/data.js` | 재료·양념·도구·캐릭터·한식 카탈로그 |
| `dist/data-japanese.js` | 일본 가정식 30개와 추가 재료·양념 |
| `dist/recipe-drafts.js` | 한식 30개의 AI 분량·조리 단계 초안 |
| `dist/model.js` | 추천 규칙과 저장 |
| `dist/i18n.js` | 언어 전환(일본어 기본 · 한국어) |
| `dist/i18n/ja-ui.js` · `ja-catalog.js` · `ja-recipes.js` | 일본어 번역: 화면 문장 · 재료/친구 이름 · 요리 60개. 사람이 직접 고치는 파일 |
| `dist/voxel.js` | 픽셀 부엌 장면 |
| `dist/assets/` | 부엌·캐릭터·재료(`ingredients-1~3`)·요리(`dishes-1~3`)·도구(`tools`) 그림판, Jua 글꼴(OFL) |
| `server.cjs` | API 처리기(로컬 서버·Vercel 공용) + 로컬 정적 파일 |
| `auth.cjs` | Google 로그인 확인·로그인 쿠키·사용자 DB(Redis/파일)·어드민 API |
| `dist/admin.html` · `dist/admin.js` | 어드민 화면 |
| `api/*.js`, `vercel.json` | Vercel 함수와 배포 설정 |
| `tools/feedback-summary.cjs` | 쌓인 의견 집계 |
| `tools/build-single.cjs` | 단일 HTML 묶기 |
| `tools/export-catalog-md.cjs` | 카탈로그를 이미지 생성용 md 표로 출력(`docs/catalog-for-image-gen.md`) |
| `docs/` | 개발 인계 명세(`sobok-developer-spec.md`), 캐릭터 대사, 작업 기록 |

## 검증

```
node --test tests/*.test.cjs
```

추천 규칙, 카탈로그·화면, 즐겨찾기·랜덤, 일본 가정식 데이터, 재료 일괄 입력, 번역 누락·일본어 화면의 한국어 잔여, 의견 저장(파일·Redis 모의), Google 로그인(모의 토큰으로 가짜·만료·다른 앱 토큰 거부, 쿠키 서명, 즐겨찾기 합치기, 어드민 권한, Redis 사용자 저장), AI 응답 검사(모의 응답으로 키 없음·잘못된 ID·구조·캐시·한도)를 확인합니다. 실제 API 호출과 운영 배포는 포함하지 않습니다.

무료 구간 참고: https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-lite
