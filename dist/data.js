(function (root) {
  'use strict';
  const ingredients = [
    ['egg','계란','달걀·유제품','🥚',['달걀','달걀들']], ['rice','밥','곡물·기타','🍚',['쌀밥','공기밥','즉석밥']],
    ['green-onion','대파','채소','🌱',['파','파채']], ['onion','양파','채소','🧅',[]], ['carrot','당근','채소','🥕',[]],
    ['kimchi','김치','곡물·기타','🥬',['배추김치']], ['potato','감자','채소','🥔',[]], ['mushroom','버섯','채소','🍄',['느타리버섯','양송이']],
    ['tofu','두부','곡물·기타','◻️',[]], ['pork','돼지고기','고기','🥩',['돼지','돈육']], ['chicken','닭고기','고기','🍗',['닭','닭가슴살']],
    ['beef','소고기','고기','🥩',['쇠고기']], ['ham','햄','고기','🥓',['스팸']], ['bacon','베이컨','고기','🥓',[]],
    ['milk','우유','달걀·유제품','🥛',[]], ['cheese','치즈','달걀·유제품','🧀',[]], ['butter','버터','달걀·유제품','🧈',[]],
    ['cabbage','양배추','채소','🥬',[]], ['zucchini','애호박','채소','🥒',['호박']], ['garlic','마늘','채소','🧄',['다진마늘']],
    ['tomato','토마토','채소','🍅',[]], ['cucumber','오이','채소','🥒',[]], ['spinach','시금치','채소','🥬',[]],
    ['pepper','고추','채소','🌶️',['청양고추']], ['tuna','참치캔','생선·해산물','🐟',['참치']], ['shrimp','새우','생선·해산물','🦐',[]],
    ['squid','오징어','생선·해산물','🦑',[]], ['fish-cake','어묵','생선·해산물','🍢',['오뎅']],
    ['noodles','소면','곡물·기타','🍜',['국수','면']], ['bread','식빵','곡물·기타','🍞',['빵']], ['seaweed','김','곡물·기타','◼️',[]],
    ['rice-cake','떡','곡물·기타','🍡',['떡볶이떡']],
    ['king-oyster','새송이버섯','채소','🍄',['새송이']], ['soft-tofu','순두부','곡물·기타','◻️',[]],
    ['pasta','파스타면','곡물·기타','🍝',['스파게티','스파게티면']], ['tomato-sauce','토마토소스','곡물·기타','🍅',['파스타소스']],
    ['curry-powder','카레가루','곡물·기타','🍛',['카레']], ['jjajang-powder','짜장가루','곡물·기타','🥣',['짜장']],
    ['pancake-mix','부침가루','곡물·기타','🌾',[]], ['starch','감자전분','곡물·기타','🌾',['전분']]
  ].map(([id,name,category,emoji,aliases])=>({id,name,category,emoji,aliases}));
  // sprite: assets/tools.webp(1536×1024)에서 잘라 쓸 [x,y,w,h]
  const tools=[['pan','프라이팬','pan',[70,135,450,342]],['pot','냄비','pot',[551,149,432,316]],['microwave','전자레인지','microwave',[1036,147,448,330]],['oven','오븐','oven',[69,591,442,329]],['air-fryer','에어프라이어','air',[597,557,350,373]],['rice-cooker','전기밥솥','cooker',[1090,572,372,355]]].map(([id,name,icon,sprite])=>({id,name,icon,sprite}));
  const condiments=[['salt','소금'],['oil','식용유'],['soy','간장'],['sugar','설탕'],['pepper-powder','후추'],['sesame-oil','참기름'],['gochujang','고추장'],['doenjang','된장'],['chili-powder','고춧가루'],['vinegar','식초'],['ketchup','케첩'],['mayonnaise','마요네즈']].map(([id,name])=>({id,name}));
  // 일본 가정식 30개(data-japanese.js): 없는 재료·양념만 추가하고, 레시피는 기존 30개 뒤에 붙인다.
  const JP=typeof module==='object'&&module.exports?require('./data-japanese.js'):root.SobokJapanese;
  JP.ingredients.forEach(([id,name,category,emoji,aliases])=>{if(!ingredients.some(x=>x.id===id))ingredients.push({id,name,category,emoji,aliases});});
  JP.condiments.forEach(([id,name])=>{if(!condiments.some(x=>x.id===id))condiments.push({id,name});});
  const rawCharacters = [
    ['chiikawa','치이카와','다정하고 끈기 있는',[57,114,347,348],['와아…!','조금씩 해보면 할 수 있어!','끝까지 해냈네… 정말 기뻐!']],
    ['hachiware','하치와레','함께라서 더 즐거운',[498,97,353,364],['맛있는 거 같이 만들어 볼까?','같이 만들면 더 맛있겠다!','너랑 만드니까 더 즐거웠어!']],
    ['usagi','우사기','활발한 장난꾸러기',[939,43,326,425],['쁘리야하이햐!','이거다! 오늘의 한 끼 출발!','와하! 한 그릇 완성!']],
    ['shisa','시사','성실한 나눔 친구',[1334,102,413,364],['오늘도 든든하게 챙겨 드세요!','정성껏 한 끼 만들어봐요!','맛있게 됐네요! 함께 나누고 싶어요.']],
    ['momonga','모몽가','자유로운 응석쟁이',[36,482,438,378],['맛있는 음식 내놔!','이거 해줘! 지금 이게 끌려!','내 것도 예쁘게 담아줘!']],
    ['rakko','랏코','든든하고 다정한',[499,509,379,350],['오늘은 든든하게 먹자.','서두르지 마. 한 단계씩 하면 돼.','잘했다. 이제 든든하게 먹자.']],
    ['kurimanju','쿠리만쥬','한 가지에 푹 빠지는',[933,528,338,332],['하아… 맛 좋군.','음… 오늘은 이 한 그릇에 집중.','후아… 잘 먹었다. 여운이 좋네.']],
    ['kani','카니','이야기를 잘 듣는',[1360,489,350,372],['오늘은 뭐가 먹고 싶어요?','네가 끌리는 걸로 함께 골라보자.','오늘 요리는 어땠어? 궁금해.']]
  ];
  // 재료·양념 아이콘: 그림판 ingredients-1~3.webp(1145×1374, 배경 투명, 목록 순서대로 27개씩) 안의 [그림판 번호, x, y, 너비, 높이].
  const iconCrops={"green-onion":[1,12,32,220,220],"onion":[1,244,32,196,220],"carrot":[1,464,28,220,220],"potato":[1,696,56,204,188],"mushroom":[1,912,48,220,204],"cabbage":[1,16,264,212,212],"zucchini":[1,244,268,192,204],"garlic":[1,456,264,208,208],"tomato":[1,692,264,208,208],"cucumber":[1,920,268,208,200],"spinach":[1,12,480,220,220],"pepper":[1,236,484,220,208],"king-oyster":[1,468,480,200,224],"ginger":[1,688,488,216,216],"radish":[1,916,472,216,228],"bell-pepper":[1,20,708,180,212],"pork":[1,216,716,236,204],"chicken":[1,452,720,228,200],"beef":[1,680,716,224,200],"ham":[1,916,720,212,196],"bacon":[1,8,924,224,204],"chicken-thigh":[1,236,932,216,196],"ground-chicken":[1,448,932,232,192],"beef-slice":[1,680,928,228,200],"ground-beef":[1,908,928,232,196],"pork-slice":[1,8,1136,220,192],"ground-pork":[1,228,1136,232,192],"sausage":[2,20,40,216,212],"tuna":[2,244,36,208,212],"shrimp":[2,460,48,212,196],"squid":[2,688,36,212,224],"fish-cake":[2,904,48,224,204],"salmon":[2,16,280,220,180],"egg":[2,240,264,228,196],"milk":[2,484,252,180,220],"cheese":[2,688,272,216,192],"butter":[2,912,268,220,196],"rice":[2,16,476,216,208],"kimchi":[2,240,476,228,204],"tofu":[2,468,480,212,204],"noodles":[2,684,476,220,208],"bread":[2,908,468,224,220],"seaweed":[2,16,688,216,216],"rice-cake":[2,236,696,224,200],"soft-tofu":[2,460,688,220,216],"pasta":[2,684,696,228,208],"tomato-sauce":[2,936,684,168,220],"curry-powder":[2,28,912,204,216],"jjajang-powder":[2,252,904,196,224],"pancake-mix":[2,472,904,204,228],"starch":[2,696,904,196,228],"udon":[2,900,916,232,212],"soba":[2,28,1132,224,220],"chuka-noodles":[2,248,1136,228,216],"seasoned-fried-tofu":[3,24,24,204,208],"silken-tofu":[3,244,44,216,184],"wakame":[3,464,32,216,196],"flour":[3,700,24,184,212],"panko":[3,928,24,192,212],"curry-roux":[3,28,252,200,188],"hayashi-roux":[3,252,252,208,188],"salt":[3,504,248,136,196],"oil":[3,728,236,136,212],"soy":[3,956,236,144,212],"sugar":[3,32,460,184,200],"pepper-powder":[3,280,452,140,208],"sesame-oil":[3,512,448,120,208],"gochujang":[3,692,460,212,200],"doenjang":[3,924,460,208,196],"chili-powder":[3,52,664,148,216],"vinegar":[3,280,660,140,220],"ketchup":[3,504,660,136,224],"mayonnaise":[3,724,660,144,224],"mirin":[3,952,660,144,224],"dashi":[3,36,888,192,220],"mentsuyu":[3,280,880,140,228],"miso":[3,460,888,220,216],"sesame":[3,720,888,156,220],"yakisoba-sauce":[3,952,884,148,224],"okonomiyaki-sauce":[3,56,1108,144,236],"worcester":[3,284,1108,136,236]};
  ingredients.forEach(x=>{if(iconCrops[x.id])x.icon=iconCrops[x.id];});
  condiments.forEach(x=>{if(iconCrops[x.id])x.icon=iconCrops[x.id];});
  // 추천 카드에서 친구가 하는 말. quotes는 큰 따옴표 대사, subs는 아래 한 줄({요리}·{시간}·{난이도}를 채워 넣음).
  // 요리 이름 바로 뒤에는 조사를 붙이지 않는다(받침에 따라 달라지므로).
  const pickLines={
    chiikawa:{quotes:['와아…!','이거… 먹고 싶어…!','할 수 있을지도…!'],subs:['{요리}… 같이 만들면 할 수 있을 것 같아…!','{시간}분이면 된대… 조금씩 해 보자…!','{난이도} 요리래… 천천히 따라 해 볼게…!']},
    hachiware:{quotes:['맛있는 거 같이 만들어 볼까?','이거 진짜 맛있겠다!','오늘은 이걸로 하자!'],subs:['오늘은 {요리} 어때? 같이 하면 더 맛있을 거야!','{시간}분이면 완성! 내가 옆에서 도와줄게.','{난이도} 요리니까 우리라면 할 수 있어!']},
    usagi:{quotes:['쁘리야하이햐!','야하!','우라!'],subs:['{요리}!! 지금 당장 만들자! 하아앗!','{시간}분 컷! 우라라라!','오늘은 {요리}! 출발! 야하!']},
    shisa:{quotes:['오늘도 든든하게 챙겨 드세요!','정성껏 만들어 볼게요!','이거 추천해요!'],subs:['오늘은 {요리}! 차근차근 준비하면 금방이에요.','{시간}분이면 따뜻한 한 끼가 완성돼요!','{난이도} 요리라 부담 없이 해 볼 수 있어요.']},
    momonga:{quotes:['맛있는 음식 내놔!','이거 해 줘!','나 이거 먹을래!'],subs:['귀찮아도 맛은 포기 못 해! 오늘은 {요리}!','{시간}분? 빨리 만들어 줘!','{요리} 아니면 안 먹어! 진짜야!']},
    rakko:{quotes:['오늘은 든든하게 먹자.','좋은 선택이다.','한 단계씩 하면 된다.'],subs:['{요리}. 서두르지 말고 한 단계씩 가자.','{시간}분이면 충분하다. 내가 곁에 있지.','{난이도} 요리지만 방심은 금물이다.']},
    kurimanju:{quotes:['하아… 맛 좋군.','음… 이거군.','하아… 오늘은 이거다.'],subs:['{요리}… 한 입 먹으면 하아… 소리가 절로 나오겠군.','{시간}분 기다린 보람이 있을 거다.','오늘은 {요리}. 여유롭게 즐겨 보자.']},
    kani:{quotes:['오늘은 뭐가 먹고 싶어요?','이거 어때요?','같이 골라 봤어요!'],subs:['{요리} 어때요? 마음에 들면 같이 만들어요.','{시간}분이면 만들 수 있대요. 천천히 해요!','{난이도} 요리라 편하게 해 볼 수 있어요.']}
  };
  // crop: 친구 그림판 characters-pixel.png(1774×887, 배경 투명) 안에서 친구 한 명의 x,y,너비,높이
  // face: 얼굴만 있는 그림판 character-faces.webp(1774×887, 배경 투명) 안의 x,y,너비,높이. 추천 카드에서 씀.
  const faceCrops={chiikawa:[41,125,392,324],hachiware:[487,126,380,329],usagi:[912,50,349,405],shisa:[1297,126,446,323],momonga:[36,527,394,322],rakko:[488,537,390,303],kurimanju:[905,536,380,309],kani:[1341,506,378,334]};
  const characters=rawCharacters.map(([id,name,personality,crop,dialogues])=>({id,name,personality,crop,dialogues,pick:pickLines[id],face:faceCrops[id]}));
  // AI-authored drafts, not human-reviewed recipes. Inventory matching stays deterministic.
  const drafts=typeof module==='object'&&module.exports?require('./recipe-drafts.js'):root.SobokRecipeDrafts;
  const recipes = [
  {
    "id": "demo-egg-rice",
    "name": "간장계란밥",
    "difficulty": "easy",
    "minutes": 10,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "rice",
      "egg"
    ],
    "condiments": [
      "soy",
      "oil"
    ],
    "imageIndex": 0,
    "art": "rice"
  },
  {
    "id": "scallion-egg-rice",
    "name": "대파 계란볶음밥",
    "difficulty": "easy",
    "minutes": 15,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "rice",
      "egg",
      "green-onion"
    ],
    "condiments": [
      "oil",
      "soy"
    ],
    "imageIndex": 1,
    "art": "rice"
  },
  {
    "id": "tuna-mayo-rice",
    "name": "참치마요덮밥",
    "difficulty": "easy",
    "minutes": 10,
    "tools": [],
    "ingredients": [
      "rice",
      "tuna",
      "seaweed"
    ],
    "condiments": [
      "mayonnaise",
      "soy"
    ],
    "imageIndex": 2,
    "art": "rice"
  },
  {
    "id": "spam-mayo-rice",
    "name": "스팸마요덮밥",
    "difficulty": "easy",
    "minutes": 15,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "rice",
      "ham",
      "egg"
    ],
    "condiments": [
      "mayonnaise",
      "oil"
    ],
    "imageIndex": 3,
    "art": "rice"
  },
  {
    "id": "tuna-rice-balls",
    "name": "참치주먹밥",
    "difficulty": "easy",
    "minutes": 10,
    "tools": [],
    "ingredients": [
      "rice",
      "tuna",
      "seaweed"
    ],
    "condiments": [
      "mayonnaise",
      "sesame-oil"
    ],
    "imageIndex": 4,
    "art": "rice"
  },
  {
    "id": "microwave-eggs",
    "name": "전자레인지 계란찜",
    "difficulty": "easy",
    "minutes": 10,
    "tools": [
      "microwave"
    ],
    "ingredients": [
      "egg",
      "green-onion"
    ],
    "condiments": [
      "salt"
    ],
    "imageIndex": 5,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "egg-soup",
    "name": "계란국",
    "difficulty": "easy",
    "minutes": 10,
    "tools": [
      "pot"
    ],
    "ingredients": [
      "egg",
      "green-onion"
    ],
    "condiments": [
      "soy",
      "salt"
    ],
    "imageIndex": 6,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "demo-tofu",
    "name": "두부부침",
    "difficulty": "easy",
    "minutes": 15,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "tofu"
    ],
    "condiments": [
      "oil",
      "soy"
    ],
    "imageIndex": 7,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "cabbage-egg-pancake",
    "name": "양배추 계란전",
    "difficulty": "easy",
    "minutes": 15,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "cabbage",
      "egg"
    ],
    "condiments": [
      "salt",
      "oil"
    ],
    "imageIndex": 8,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "egg-toast",
    "name": "계란 토스트",
    "difficulty": "easy",
    "minutes": 10,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "bread",
      "egg"
    ],
    "condiments": [
      "oil",
      "salt"
    ],
    "imageIndex": 9,
    "art": "rice"
  },
  {
    "id": "soy-noodles",
    "name": "간장비빔국수",
    "difficulty": "easy",
    "minutes": 15,
    "tools": [
      "pot"
    ],
    "ingredients": [
      "noodles",
      "green-onion"
    ],
    "condiments": [
      "soy",
      "sugar",
      "sesame-oil"
    ],
    "imageIndex": 10,
    "art": "rice"
  },
  {
    "id": "butter-mushroom",
    "name": "새송이버섯 버터구이",
    "difficulty": "easy",
    "minutes": 10,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "king-oyster",
      "butter"
    ],
    "condiments": [
      "soy"
    ],
    "imageIndex": 11,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "kimchi-fried-rice",
    "name": "김치볶음밥",
    "difficulty": "medium",
    "minutes": 15,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "rice",
      "kimchi",
      "green-onion"
    ],
    "condiments": [
      "oil",
      "soy"
    ],
    "imageIndex": 12,
    "art": "rice"
  },
  {
    "id": "demo-kimchi-stew",
    "name": "참치김치찌개",
    "difficulty": "medium",
    "minutes": 20,
    "tools": [
      "pot"
    ],
    "ingredients": [
      "kimchi",
      "tuna",
      "tofu"
    ],
    "condiments": [
      "soy",
      "oil"
    ],
    "imageIndex": 13,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "doenjang-stew",
    "name": "된장찌개",
    "difficulty": "medium",
    "minutes": 20,
    "tools": [
      "pot"
    ],
    "ingredients": [
      "tofu",
      "zucchini",
      "onion"
    ],
    "condiments": [
      "doenjang"
    ],
    "imageIndex": 14,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "soft-tofu-stew",
    "name": "순두부찌개",
    "difficulty": "medium",
    "minutes": 20,
    "tools": [
      "pot"
    ],
    "ingredients": [
      "soft-tofu",
      "egg",
      "green-onion"
    ],
    "condiments": [
      "oil",
      "chili-powder",
      "soy"
    ],
    "imageIndex": 15,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "budae-stew",
    "name": "간단 부대찌개",
    "difficulty": "medium",
    "minutes": 25,
    "tools": [
      "pot"
    ],
    "ingredients": [
      "ham",
      "kimchi",
      "tofu",
      "green-onion"
    ],
    "condiments": [
      "gochujang",
      "soy"
    ],
    "imageIndex": 16,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "tteokbokki",
    "name": "떡볶이",
    "difficulty": "medium",
    "minutes": 20,
    "tools": [
      "pot"
    ],
    "ingredients": [
      "rice-cake",
      "fish-cake",
      "green-onion"
    ],
    "condiments": [
      "gochujang",
      "sugar",
      "soy"
    ],
    "imageIndex": 17,
    "art": "rice"
  },
  {
    "id": "curry-rice",
    "name": "카레라이스",
    "difficulty": "medium",
    "minutes": 30,
    "tools": [
      "pot"
    ],
    "ingredients": [
      "rice",
      "potato",
      "onion",
      "curry-powder"
    ],
    "condiments": [
      "oil"
    ],
    "imageIndex": 18,
    "art": "rice"
  },
  {
    "id": "jjajang-rice",
    "name": "짜장덮밥",
    "difficulty": "medium",
    "minutes": 25,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "rice",
      "onion",
      "cabbage",
      "jjajang-powder"
    ],
    "condiments": [
      "oil"
    ],
    "imageIndex": 19,
    "art": "rice"
  },
  {
    "id": "one-pan-tomato",
    "name": "원팬 토마토 파스타",
    "difficulty": "medium",
    "minutes": 20,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "pasta",
      "tomato-sauce",
      "onion"
    ],
    "condiments": [
      "oil"
    ],
    "imageIndex": 20,
    "art": "rice"
  },
  {
    "id": "one-pan-cream",
    "name": "원팬 우유 크림 파스타",
    "difficulty": "medium",
    "minutes": 25,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "pasta",
      "milk",
      "cheese",
      "bacon"
    ],
    "condiments": [
      "pepper-powder"
    ],
    "imageIndex": 21,
    "art": "rice"
  },
  {
    "id": "braised-tofu",
    "name": "두부조림",
    "difficulty": "medium",
    "minutes": 20,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "tofu",
      "onion",
      "green-onion"
    ],
    "condiments": [
      "soy",
      "chili-powder",
      "oil"
    ],
    "imageIndex": 22,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "braised-potato",
    "name": "감자조림",
    "difficulty": "medium",
    "minutes": 25,
    "tools": [
      "pot"
    ],
    "ingredients": [
      "potato",
      "onion"
    ],
    "condiments": [
      "soy",
      "sugar"
    ],
    "imageIndex": 23,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "demo-rolled-egg",
    "name": "계란말이",
    "difficulty": "hard",
    "minutes": 20,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "egg",
      "green-onion",
      "carrot"
    ],
    "condiments": [
      "salt",
      "oil"
    ],
    "imageIndex": 24,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "omurice",
    "name": "오므라이스",
    "difficulty": "hard",
    "minutes": 30,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "rice",
      "egg",
      "onion",
      "ham"
    ],
    "condiments": [
      "oil",
      "ketchup",
      "salt"
    ],
    "imageIndex": 25,
    "art": "rice"
  },
  {
    "id": "kimchi-pancake",
    "name": "김치전",
    "difficulty": "hard",
    "minutes": 25,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "kimchi",
      "pancake-mix"
    ],
    "condiments": [
      "oil"
    ],
    "imageIndex": 26,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "potato-pancake",
    "name": "감자채전",
    "difficulty": "hard",
    "minutes": 25,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "potato",
      "starch"
    ],
    "condiments": [
      "salt",
      "oil"
    ],
    "imageIndex": 27,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "spicy-pork",
    "name": "제육볶음",
    "difficulty": "hard",
    "minutes": 30,
    "tools": [
      "pan"
    ],
    "ingredients": [
      "pork",
      "onion",
      "green-onion",
      "garlic"
    ],
    "condiments": [
      "gochujang",
      "soy",
      "sugar",
      "oil"
    ],
    "imageIndex": 28,
    "art": "rice",
    "mealType": "밥과 함께"
  },
  {
    "id": "spicy-chicken-stew",
    "name": "닭볶음탕",
    "difficulty": "hard",
    "minutes": 45,
    "tools": [
      "pot"
    ],
    "ingredients": [
      "chicken",
      "potato",
      "onion",
      "green-onion",
      "garlic"
    ],
    "condiments": [
      "gochujang",
      "soy",
      "sugar",
      "chili-powder"
    ],
    "imageIndex": 29,
    "art": "rice",
    "mealType": "밥과 함께"
  }
].map(recipe=>({...recipe,cuisine:'korean',atlas:'kr',isDemo:true,source:'ai-draft',humanReviewed:false,servings:1,...drafts[recipe.id]}))
    .concat(JP.recipes.map(recipe=>({...recipe,isDemo:true,source:'ai-draft',humanReviewed:false,servings:1})));
  const data={ingredients,tools,condiments,characters,recipes,categories:['전체','채소','고기','생선·해산물','달걀·유제품','곡물·기타'],difficultyNames:{easy:'쉬움',medium:'보통',hard:'어려움'},cuisineNames:{korean:'한식',japanese:'일본식'},demoInventory:{ingredients:['egg','rice','green-onion','onion','carrot','kimchi','potato','mushroom'],tools:['pan','pot','microwave'],condiments:['salt','oil','soy']}};
  if (typeof module==='object' && module.exports) module.exports=data;
  else root.SobokData=data;
})(typeof window!=='undefined'?window:globalThis);
