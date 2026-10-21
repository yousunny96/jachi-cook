# 소복 재료·요리 목록 (이미지 생성용)

`node tools/export-catalog-md.cjs`로 `dist/data.js`에서 자동으로 만든 표예요. 데이터가 바뀌면 다시 실행하세요.

- 냉장고 재료 61개 · 양념 20개 · 도구 6개
- 요리 60개 (한식 30 · 일본식 30)
- 요리 그림판: **4열 × 5줄 그림판 3장**(한식 30개 → 일본식 30개 순서로 20개씩). 표의 `#` 순서대로 왼쪽 위부터 오른쪽으로, 줄이 끝나면 다음 줄로 채워요. 순서가 바뀌면 앱에서 다른 요리 그림이 나와요.

## 프롬프트 예시

**재료 아이콘**
> Cute pixel-art food icon of {English}, single item centered, soft pastel colors, thin dark brown outline, transparent background, cozy Korean kitchen game style, no text.

**요리 그림판**
> A 4 columns × 5 rows grid sprite sheet of cute pixel-art home dishes, each dish in a pastel bowl or plate seen from slightly above, same size and spacing in every cell, soft pastel colors, thin dark brown outline, plain light background, no text, no labels. Fill the cells left-to-right, top-to-bottom in this order: {English 목록을 # 순서대로}.

## 1. 내 냉장고 — 재료 61개

### 채소 (16)

| 재료 | English | 이모지 | 다른 이름 |
| --- | --- | --- | --- |
| 대파 | green onion (daepa) | 🌱 | 파, 파채 |
| 양파 | onion | 🧅 | — |
| 당근 | carrot | 🥕 | — |
| 감자 | potato | 🥔 | — |
| 버섯 | mushroom | 🍄 | 느타리버섯, 양송이 |
| 양배추 | cabbage | 🥬 | — |
| 애호박 | Korean zucchini (aehobak) | 🥒 | 호박 |
| 마늘 | garlic | 🧄 | 다진마늘 |
| 토마토 | tomato | 🍅 | — |
| 오이 | cucumber | 🥒 | — |
| 시금치 | spinach | 🥬 | — |
| 고추 | chili pepper | 🌶️ | 청양고추 |
| 새송이버섯 | king oyster mushroom | 🍄 | 새송이 |
| 생강 | ginger | 🌿 | — |
| 무 | daikon radish | ⚪ | 무우 |
| 피망 | green bell pepper | 🫑 | — |

### 고기 (12)

| 재료 | English | 이모지 | 다른 이름 |
| --- | --- | --- | --- |
| 돼지고기 | pork | 🥩 | 돼지, 돈육 |
| 닭고기 | chicken | 🍗 | 닭, 닭가슴살 |
| 소고기 | beef | 🥩 | 쇠고기 |
| 햄 | ham (Spam) | 🥓 | 스팸 |
| 베이컨 | bacon | 🥓 | — |
| 뼈 없는 닭다리살 | boneless chicken thigh | 🍗 | 닭다리살, 순살 닭다리 |
| 다진 닭고기 | ground chicken | 🍗 | 닭 다짐육 |
| 소고기 불고기용 | thinly sliced beef (bulgogi cut) | 🥩 | 불고기용 소고기, 소불고기감 |
| 다진 소고기 | ground beef | 🥩 | 소고기 다짐육 |
| 얇게 썬 돼지고기 | thinly sliced pork | 🥩 | 대패삼겹살, 돼지고기 슬라이스 |
| 다진 돼지고기 | ground pork | 🥩 | 돼지고기 다짐육 |
| 소시지 | sausage | 🌭 | 비엔나소시지, 소세지 |

### 생선·해산물 (5)

| 재료 | English | 이모지 | 다른 이름 |
| --- | --- | --- | --- |
| 참치캔 | canned tuna | 🐟 | 참치 |
| 새우 | shrimp | 🦐 | — |
| 오징어 | squid | 🦑 | — |
| 어묵 | fish cake (eomuk) | 🍢 | 오뎅 |
| 연어 | salmon fillet | 🐟 | 생연어, 연어 필렛 |

### 달걀·유제품 (4)

| 재료 | English | 이모지 | 다른 이름 |
| --- | --- | --- | --- |
| 계란 | egg | 🥚 | 달걀, 달걀들 |
| 우유 | milk | 🥛 | — |
| 치즈 | sliced cheese | 🧀 | — |
| 버터 | butter | 🧈 | — |

### 곡물·기타 (24)

| 재료 | English | 이모지 | 다른 이름 |
| --- | --- | --- | --- |
| 밥 | cooked white rice | 🍚 | 쌀밥, 공기밥, 즉석밥 |
| 김치 | kimchi | 🥬 | 배추김치 |
| 두부 | firm tofu | ◻️ | — |
| 소면 | thin wheat noodles (somyeon) | 🍜 | 국수, 면 |
| 식빵 | sliced bread | 🍞 | 빵 |
| 김 | roasted seaweed (gim) | ◼️ | — |
| 떡 | rice cakes (tteok) | 🍡 | 떡볶이떡 |
| 순두부 | soft tofu (sundubu) | ◻️ | — |
| 파스타면 | pasta | 🍝 | 스파게티, 스파게티면 |
| 토마토소스 | tomato sauce | 🍅 | 파스타소스 |
| 카레가루 | curry powder | 🍛 | 카레 |
| 짜장가루 | black bean sauce powder (jjajang) | 🥣 | 짜장 |
| 부침가루 | Korean pancake mix | 🌾 | — |
| 감자전분 | potato starch | 🌾 | 전분 |
| 우동면 | udon noodles | 🍜 | 우동, 우동사리 |
| 건메밀면 | dried soba noodles | 🍜 | 메밀면, 메밀국수, 소바 |
| 볶음용 중화면 | yakisoba noodles | 🍜 | 야키소바면, 중화면 |
| 조미 유부 | seasoned fried tofu (inari age) | 🟫 | 조미유부, 유부초밥용 유부 |
| 연두부 | silken tofu | ◻️ | — |
| 건미역 | dried wakame seaweed | 🥬 | 미역, 마른미역 |
| 밀가루 | flour | 🌾 | 중력분 |
| 빵가루 | panko breadcrumbs | 🍞 | — |
| 고형 카레 | Japanese curry roux block | 🍛 | 카레 블록, 카레 루 |
| 고형 하야시 루 | hayashi rice roux block | 🍛 | 하야시 블록, 하야시 |

## 2. 내 주방 — 양념 20개

| 양념 | English |
| --- | --- |
| 소금 | salt |
| 식용유 | cooking oil |
| 간장 | soy sauce |
| 설탕 | sugar |
| 후추 | black pepper |
| 참기름 | sesame oil |
| 고추장 | gochujang (red pepper paste) |
| 된장 | doenjang (soybean paste) |
| 고춧가루 | Korean chili flakes |
| 식초 | vinegar |
| 케첩 | ketchup |
| 마요네즈 | mayonnaise |
| 미림 | mirin |
| 과립 다시 | dashi granules |
| 농축 멘츠유 | concentrated mentsuyu |
| 미소 | miso paste |
| 깨 | sesame seeds |
| 야키소바 소스 | yakisoba sauce |
| 오코노미야키 소스 | okonomiyaki sauce |
| 우스터소스 | Worcestershire sauce |

## 3. 내 주방 — 도구 6개

| 도구 | English |
| --- | --- |
| 프라이팬 | frying pan |
| 냄비 | pot |
| 전자레인지 | microwave |
| 오븐 | oven |
| 에어프라이어 | air fryer |
| 전기밥솥 | rice cooker |

## 4. 요리책 — 한식 30개 (그림판 `dishes-1`, `dishes-2` 앞쪽)

| # | 그림판 위치 | 요리 | English | 난이도 | 시간 | 주재료 | 도구 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | dishes-1 1행 1열 | 간장계란밥 | soy sauce egg rice | 쉬움 | 10분 | 밥, 계란 | 프라이팬 |
| 2 | dishes-1 1행 2열 | 대파 계란볶음밥 | green onion egg fried rice | 쉬움 | 15분 | 밥, 계란, 대파 | 프라이팬 |
| 3 | dishes-1 1행 3열 | 참치마요덮밥 | tuna mayo rice bowl | 쉬움 | 10분 | 밥, 참치캔, 김 | 가열 없이 |
| 4 | dishes-1 1행 4열 | 스팸마요덮밥 | Spam mayo rice bowl | 쉬움 | 15분 | 밥, 햄, 계란 | 프라이팬 |
| 5 | dishes-1 2행 1열 | 참치주먹밥 | tuna rice balls | 쉬움 | 10분 | 밥, 참치캔, 김 | 가열 없이 |
| 6 | dishes-1 2행 2열 | 전자레인지 계란찜 | microwave steamed egg | 쉬움 | 10분 | 계란, 대파 | 전자레인지 |
| 7 | dishes-1 2행 3열 | 계란국 | egg drop soup | 쉬움 | 10분 | 계란, 대파 | 냄비 |
| 8 | dishes-1 2행 4열 | 두부부침 | pan-fried tofu | 쉬움 | 15분 | 두부 | 프라이팬 |
| 9 | dishes-1 3행 1열 | 양배추 계란전 | cabbage egg pancake | 쉬움 | 15분 | 양배추, 계란 | 프라이팬 |
| 10 | dishes-1 3행 2열 | 계란 토스트 | egg toast | 쉬움 | 10분 | 식빵, 계란 | 프라이팬 |
| 11 | dishes-1 3행 3열 | 간장비빔국수 | soy sauce cold noodles | 쉬움 | 15분 | 소면, 대파 | 냄비 |
| 12 | dishes-1 3행 4열 | 새송이버섯 버터구이 | butter-grilled king oyster mushroom | 쉬움 | 10분 | 새송이버섯, 버터 | 프라이팬 |
| 13 | dishes-1 4행 1열 | 김치볶음밥 | kimchi fried rice | 보통 | 15분 | 밥, 김치, 대파 | 프라이팬 |
| 14 | dishes-1 4행 2열 | 참치김치찌개 | tuna kimchi stew | 보통 | 20분 | 김치, 참치캔, 두부 | 냄비 |
| 15 | dishes-1 4행 3열 | 된장찌개 | doenjang stew | 보통 | 20분 | 두부, 애호박, 양파 | 냄비 |
| 16 | dishes-1 4행 4열 | 순두부찌개 | soft tofu stew (sundubu-jjigae) | 보통 | 20분 | 순두부, 계란, 대파 | 냄비 |
| 17 | dishes-1 5행 1열 | 간단 부대찌개 | easy army stew (budae-jjigae) | 보통 | 25분 | 햄, 김치, 두부, 대파 | 냄비 |
| 18 | dishes-1 5행 2열 | 떡볶이 | tteokbokki | 보통 | 20분 | 떡, 어묵, 대파 | 냄비 |
| 19 | dishes-1 5행 3열 | 카레라이스 | Korean curry rice | 보통 | 30분 | 밥, 감자, 양파, 카레가루 | 냄비 |
| 20 | dishes-1 5행 4열 | 짜장덮밥 | jjajang rice bowl | 보통 | 25분 | 밥, 양파, 양배추, 짜장가루 | 프라이팬 |
| 21 | dishes-2 1행 1열 | 원팬 토마토 파스타 | one-pan tomato pasta | 보통 | 20분 | 파스타면, 토마토소스, 양파 | 프라이팬 |
| 22 | dishes-2 1행 2열 | 원팬 우유 크림 파스타 | one-pan milk cream pasta | 보통 | 25분 | 파스타면, 우유, 치즈, 베이컨 | 프라이팬 |
| 23 | dishes-2 1행 3열 | 두부조림 | braised tofu | 보통 | 20분 | 두부, 양파, 대파 | 프라이팬 |
| 24 | dishes-2 1행 4열 | 감자조림 | braised potatoes | 보통 | 25분 | 감자, 양파 | 냄비 |
| 25 | dishes-2 2행 1열 | 계란말이 | Korean rolled omelette | 어려움 | 20분 | 계란, 대파, 당근 | 프라이팬 |
| 26 | dishes-2 2행 2열 | 오므라이스 | omurice | 어려움 | 30분 | 밥, 계란, 양파, 햄 | 프라이팬 |
| 27 | dishes-2 2행 3열 | 김치전 | kimchi pancake | 어려움 | 25분 | 김치, 부침가루 | 프라이팬 |
| 28 | dishes-2 2행 4열 | 감자채전 | shredded potato pancake | 어려움 | 25분 | 감자, 감자전분 | 프라이팬 |
| 29 | dishes-2 3행 1열 | 제육볶음 | spicy stir-fried pork (jeyuk) | 어려움 | 30분 | 돼지고기, 양파, 대파, 마늘 | 프라이팬 |
| 30 | dishes-2 3행 2열 | 닭볶음탕 | spicy braised chicken (dakbokkeumtang) | 어려움 | 45분 | 닭고기, 감자, 양파, 대파, 마늘 | 냄비 |

## 5. 요리책 — 일본식 30개 (그림판 `dishes-2` 뒤쪽, `dishes-3`)

| # | 그림판 위치 | 요리 | English | 난이도 | 시간 | 주재료 | 도구 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | dishes-2 3행 3열 | 오야코동 | oyakodon | 보통 | 20분 | 밥, 뼈 없는 닭다리살, 계란, 양파 | 프라이팬 |
| 2 | dishes-2 3행 4열 | 규동 | gyudon | 보통 | 20분 | 밥, 소고기 불고기용, 양파 | 프라이팬 |
| 3 | dishes-2 4행 1열 | 부타동 | butadon | 보통 | 20분 | 밥, 얇게 썬 돼지고기, 양파 | 프라이팬 |
| 4 | dishes-2 4행 2열 | 닭고기 소보로동 | chicken soboro don | 보통 | 20분 | 밥, 다진 닭고기, 계란 | 프라이팬 |
| 5 | dishes-2 4행 3열 | 치킨 데리야키 덮밥 | teriyaki chicken rice bowl | 보통 | 25분 | 밥, 뼈 없는 닭다리살 | 프라이팬 |
| 6 | dishes-2 4행 4열 | 일본식 카레라이스 | Japanese curry rice | 보통 | 35분 | 밥, 돼지고기, 감자, 당근, 양파, 고형 카레 | 냄비 |
| 7 | dishes-2 5행 1열 | 하야시라이스 | hayashi rice | 보통 | 30분 | 밥, 소고기 불고기용, 양파, 버섯, 고형 하야시 루 | 냄비 |
| 8 | dishes-2 5행 2열 | 일본식 오므라이스 | Japanese omurice | 어려움 | 30분 | 밥, 계란, 뼈 없는 닭다리살, 양파, 버터 | 프라이팬 |
| 9 | dishes-2 5행 3열 | 연어 오니기리 | salmon onigiri | 보통 | 20분 | 밥, 연어, 김 | 프라이팬 |
| 10 | dishes-2 5행 4열 | 야키오니기리 | yaki onigiri | 쉬움 | 15분 | 밥 | 프라이팬 |
| 11 | dishes-3 1행 1열 | 키츠네우동 | kitsune udon | 쉬움 | 10분 | 우동면, 조미 유부, 대파 | 냄비 |
| 12 | dishes-3 1행 2열 | 야키우동 | yaki udon | 보통 | 20분 | 우동면, 얇게 썬 돼지고기, 양배추, 당근, 양파 | 프라이팬 |
| 13 | dishes-3 1행 3열 | 카레우동 | curry udon | 쉬움 | 15분 | 우동면, 양파, 대파, 고형 카레 | 냄비 |
| 14 | dishes-3 1행 4열 | 자루소바 | zaru soba | 쉬움 | 15분 | 건메밀면, 김, 대파 | 냄비 |
| 15 | dishes-3 2행 1열 | 야키소바 | yakisoba | 보통 | 20분 | 볶음용 중화면, 얇게 썬 돼지고기, 양배추, 당근, 양파 | 프라이팬 |
| 16 | dishes-3 2행 2열 | 나폴리탄 스파게티 | spaghetti Napolitan | 보통 | 25분 | 파스타면, 소시지, 양파, 피망, 버터 | 냄비, 프라이팬 |
| 17 | dishes-3 2행 3열 | 버섯 버터간장 파스타 | mushroom butter soy pasta | 보통 | 20분 | 파스타면, 버섯, 마늘, 버터 | 냄비, 프라이팬 |
| 18 | dishes-3 2행 4열 | 타마고산도 | tamago sando | 쉬움 | 20분 | 식빵, 계란 | 냄비 |
| 19 | dishes-3 3행 1열 | 오코노미야키 | okonomiyaki | 어려움 | 30분 | 양배추, 계란, 베이컨, 밀가루 | 프라이팬 |
| 20 | dishes-3 3행 2열 | 타마고야키 | tamagoyaki | 어려움 | 20분 | 계란 | 프라이팬 |
| 21 | dishes-3 3행 3열 | 쇼가야키 | pork shogayaki | 보통 | 20분 | 얇게 썬 돼지고기, 양파, 생강 | 프라이팬 |
| 22 | dishes-3 3행 4열 | 치킨 데리야키 | chicken teriyaki | 보통 | 25분 | 뼈 없는 닭다리살 | 프라이팬 |
| 23 | dishes-3 4행 1열 | 연어 데리야키 | salmon teriyaki | 보통 | 20분 | 연어 | 프라이팬 |
| 24 | dishes-3 4행 2열 | 일본식 함박스테이크 | Japanese hamburg steak | 어려움 | 35분 | 다진 소고기, 다진 돼지고기, 양파, 빵가루, 우유, 계란 | 프라이팬 |
| 25 | dishes-3 4행 3열 | 니쿠자가 | nikujaga | 보통 | 35분 | 소고기 불고기용, 감자, 당근, 양파 | 냄비 |
| 26 | dishes-3 4행 4열 | 두부 미소국 | tofu miso soup | 쉬움 | 10분 | 두부, 건미역, 대파 | 냄비 |
| 27 | dishes-3 5행 1열 | 돈지루 | tonjiru (pork miso soup) | 보통 | 25분 | 얇게 썬 돼지고기, 무, 당근, 감자, 대파 | 냄비 |
| 28 | dishes-3 5행 2열 | 닭고기계란 조스이 | chicken and egg zosui | 쉬움 | 20분 | 밥, 뼈 없는 닭다리살, 계란, 대파 | 냄비 |
| 29 | dishes-3 5행 3열 | 히야얏코 | hiyayakko (chilled tofu) | 쉬움 | 5분 | 연두부, 대파, 생강 | 가열 없이 |
| 30 | dishes-3 5행 4열 | 시금치 참깨무침 | spinach goma-ae | 쉬움 | 10분 | 시금치 | 냄비 |

## 6. 그림판 순서용 영어 목록 (프롬프트에 붙여 넣기)

**한식:** 1. soy sauce egg rice, 2. green onion egg fried rice, 3. tuna mayo rice bowl, 4. Spam mayo rice bowl, 5. tuna rice balls, 6. microwave steamed egg, 7. egg drop soup, 8. pan-fried tofu, 9. cabbage egg pancake, 10. egg toast, 11. soy sauce cold noodles, 12. butter-grilled king oyster mushroom, 13. kimchi fried rice, 14. tuna kimchi stew, 15. doenjang stew, 16. soft tofu stew (sundubu-jjigae), 17. easy army stew (budae-jjigae), 18. tteokbokki, 19. Korean curry rice, 20. jjajang rice bowl, 21. one-pan tomato pasta, 22. one-pan milk cream pasta, 23. braised tofu, 24. braised potatoes, 25. Korean rolled omelette, 26. omurice, 27. kimchi pancake, 28. shredded potato pancake, 29. spicy stir-fried pork (jeyuk), 30. spicy braised chicken (dakbokkeumtang)

**일본식:** 1. oyakodon, 2. gyudon, 3. butadon, 4. chicken soboro don, 5. teriyaki chicken rice bowl, 6. Japanese curry rice, 7. hayashi rice, 8. Japanese omurice, 9. salmon onigiri, 10. yaki onigiri, 11. kitsune udon, 12. yaki udon, 13. curry udon, 14. zaru soba, 15. yakisoba, 16. spaghetti Napolitan, 17. mushroom butter soy pasta, 18. tamago sando, 19. okonomiyaki, 20. tamagoyaki, 21. pork shogayaki, 22. chicken teriyaki, 23. salmon teriyaki, 24. Japanese hamburg steak, 25. nikujaga, 26. tofu miso soup, 27. tonjiru (pork miso soup), 28. chicken and egg zosui, 29. hiyayakko (chilled tofu), 30. spinach goma-ae
