# 30개 메뉴와 이미지 업데이트 · 2026-10-20

기존 명세의 6개 예시 카탈로그를 대체합니다. 조리법은 AI 작성 초안이며 사람의 조리 검수 완료를 의미하지 않습니다.

- 음식 이미지는 첨부 스타일을 참고해 생성한 단순한 일러스트입니다. 인터넷 레시피 사진을 복사하지 않았습니다.
- assets/food-atlas-simple.png: 5열×6행. imageIndex 0–29 순서이며 app.js의 좌표로 각 메뉴를 표시합니다.
- 고명 등 그림과 실제 분량에 차이가 있을 수 있습니다. 상세 화면에서 이를 안내합니다.
- 추천은 기존 도구·재료 필터를 유지합니다. 전체 메뉴 둘러보기는 재료와 무관한 탐색 영역입니다.
- 가열 없는 요리는 tools:[]이며 도구 없이도 추천됩니다.
- 간장계란밥 등 밥 요리는 이미 지어진 밥 기준입니다.

|번호|ID|요리|난이도|시간|
|---|---|---|---|---|
|1|demo-egg-rice|간장계란밥|easy|10분|
|2|scallion-egg-rice|대파 계란볶음밥|easy|15분|
|3|tuna-mayo-rice|참치마요덮밥|easy|10분|
|4|spam-mayo-rice|스팸마요덮밥|easy|15분|
|5|tuna-rice-balls|참치주먹밥|easy|10분|
|6|microwave-eggs|전자레인지 계란찜|easy|10분|
|7|egg-soup|계란국|easy|10분|
|8|demo-tofu|두부부침|easy|15분|
|9|cabbage-egg-pancake|양배추 계란전|easy|15분|
|10|egg-toast|계란 토스트|easy|10분|
|11|soy-noodles|간장비빔국수|easy|15분|
|12|butter-mushroom|새송이버섯 버터구이|easy|10분|
|13|kimchi-fried-rice|김치볶음밥|medium|15분|
|14|demo-kimchi-stew|참치김치찌개|medium|20분|
|15|doenjang-stew|된장찌개|medium|20분|
|16|soft-tofu-stew|순두부찌개|medium|20분|
|17|budae-stew|간단 부대찌개|medium|25분|
|18|tteokbokki|떡볶이|medium|20분|
|19|curry-rice|카레라이스|medium|30분|
|20|jjajang-rice|짜장덮밥|medium|25분|
|21|one-pan-tomato|원팬 토마토 파스타|medium|20분|
|22|one-pan-cream|원팬 우유 크림 파스타|medium|25분|
|23|braised-tofu|두부조림|medium|20분|
|24|braised-potato|감자조림|medium|25분|
|25|demo-rolled-egg|계란말이|hard|20분|
|26|omurice|오므라이스|hard|30분|
|27|kimchi-pancake|김치전|hard|25분|
|28|potato-pancake|감자채전|hard|25분|
|29|spicy-pork|제육볶음|hard|30분|
|30|spicy-chicken-stew|닭볶음탕|hard|45분|

메뉴 선정 참고: https://m.10000recipe.com/ranking/home_view.html?dtype=w&rtype=k
정식 인기 TOP30 순위가 아니라 공개 랭킹과 자취 조리 적합성을 참고한 선정입니다.