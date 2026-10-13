-- THE HARPER: 2026-10-13 하루치 SQL 모음(hy0909). Supabase SQL Editor 에 통째로 붙여넣고 Run. 두 번 실행해도 안전하다.
-- 아래 세 파일을 차례로 이어 붙였다: openyy-series-001.sql, celeb-openyy-first.sql, tour-soon-label.sql

-- THE HARPER: K-BRAND SERIES 001 OPEN YY 매거진 새 글(2026-10-13, hy0909)
-- 인스타그램 콘텐츠의 사진과 글로 새 글(k-brand-series-001)을 넣고, 홈 피드 맨 뒤에 이 글 카드를 하나 더 붙인다.
-- 디자이너 인터뷰 글(k-brand-interview)은 원래 내용으로 다시 넣는다(앞서 보낸 SQL을 이미 돌렸어도 되돌아가게).
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run. 두 번 실행해도 안전하다.

-- 1. 새 글
insert into magazines (id,kind,badge,title,hero,editor,date,price,note,summary,info,intro,sections,related_label,related_link,cta_label,cta_link,sort) values ('k-brand-series-001','magazine','K-BRAND','K-BRAND
SERIES 001
OPEN YY','assets/magazine/openyy-cover.jpg','h','10. 13','','','','[]'::jsonb,'','[{"heading": "01. 두 자매의 취향이 담긴 브랜드", "sub": "", "image": "assets/magazine/openyy-01-sisters.jpg", "body": "오픈와이와이는 지영과 보영, 두 자매가 2020년 론칭한 서울 기반의 컨템포러리 브랜드다. ''더오픈 프로덕트(THEOPEN PRODUCT)''라는 이름으로 시작해 지금의 오픈와이와이로 거듭났다. 서로 다른 취향과 개성을 바탕으로 일상적인 옷에 신선한 변주를 더한다.", "link": "", "link_label": ""}, {"heading": "02. OPEN YY, 이름에 담긴 의미", "sub": "", "image": "assets/magazine/openyy-02-name.jpg", "body": "브랜드명 속 ''YY''는 두 자매의 이름에 공통으로 들어가는 ''영(YOUNG)''에서 따왔다. 각각 ''밝음''과 ''꽃봉오리''라는 서로 다른 뜻을 지닌다. 닮은 듯 다른 두 자매처럼, 오픈와이와이가 추구하는 개성과 다양성을 상징한다.", "link": "", "link_label": ""}, {"heading": "03. 익숙한 옷을 낯설게 만드는 방법", "sub": "", "image": "assets/magazine/openyy-03-familiar.jpg", "body": "오픈와이와이는 익숙한 옷에 예상 밖의 디테일과 독특한 비율을 더한다. 스웨트셔츠부터 니트, 재킷까지 일상적인 아이템을 새롭게 해석하며, 여성복과 유니섹스의 경계를 넘나드는 자유로운 스타일을 제안한다.", "link": "", "link_label": ""}, {"heading": "04. 셀럽들의 옷장에서 발견한 이름", "sub": "", "image": "assets/magazine/openyy-04-celeb.jpg", "body": "K 아티스트들의 옷차림에서도 오픈와이와이를 발견할 수 있다. 무대 위 화려한 스타일링부터 일상적인 사복 패션까지, 셀럽들의 선택을 받으며 해외에서도 주목받고 있다.", "link": "", "link_label": ""}, {"heading": "05. 서울을 옷으로 표현한다면?", "sub": "", "image": "assets/magazine/openyy-05-seoul.jpg", "body": "2026 F/W 컬렉션 ''WHEN IN SEOUL''은 서울의 다채로운 풍경에서 출발한다. 과거와 현재, 격식과 자유로움이 공존하는 도시의 모습을 옷으로 풀어냈다. 콘크리트를 닮은 회색과 블랙, 차분한 뉴트럴 컬러에 선명한 네온 컬러를 더해 서울의 역동적인 분위기를 표현한다.", "link": "", "link_label": ""}, {"heading": "06. 이번 시즌 눈여겨볼 디테일", "sub": "", "image": "assets/magazine/openyy-06-details.jpg", "body": "유연한 실루엣의 카고 봄버 재킷과 핀턱 트렌치코트, 자연스럽게 흐르는 니트웨어가 주를 이룬다. 여기에 와이어 장식의 비니와 롱부츠 등 개성 있는 액세서리를 더했다. 힘을 뺀 실루엣과 섬세한 디테일을 통해 자유로운 스타일링을 제안한다.", "link": "", "link_label": ""}, {"heading": "07. 와이와이를 직접 만나고 싶다면", "sub": "서울 용산구 이태원로36길 16 1F", "image": "assets/magazine/openyy-07-store.jpg", "body": "서울 한남동에 자리한 오픈와이와이 플래그십 스토어에서는 최신 컬렉션과 브랜드의 감각을 담은 공간을 경험할 수 있다. 스페셜티 커피를 즐길 수 있는 카페도 마련되어 있어 쇼핑과 휴식을 함께 누리기 좋다.", "link": "", "link_label": ""}, {"heading": "08. 지금 꼭 기억해야 할 K-브랜드", "sub": "", "image": "assets/magazine/openyy-08-remember.jpg", "body": "옷은 자신만의 취향을 드러내는 가장 쉬운 방법이다. 두 자매의 서로 다른 감각에서 출발해 서울의 오늘을 담아내는 오픈와이와이. 지금 기억해야 할 K-패션 브랜드다.", "link": "", "link_label": ""}]'::jsonb,'관련 매장 보기','search.html','Instagram에서 보기','',4)
on conflict (id) do update set kind = excluded.kind, badge = excluded.badge, title = excluded.title, hero = excluded.hero, editor = excluded.editor, date = excluded.date, price = excluded.price, note = excluded.note, summary = excluded.summary, info = excluded.info, intro = excluded.intro, sections = excluded.sections, related_label = excluded.related_label, related_link = excluded.related_link, cta_label = excluded.cta_label, cta_link = excluded.cta_link, sort = excluded.sort;

-- 2. 디자이너 인터뷰 글 원래대로
insert into magazines (id,kind,badge,title,hero,editor,date,price,note,summary,info,intro,sections,related_label,related_link,cta_label,cta_link,sort) values ('k-brand-interview','magazine','K-BRAND','K-BRAND 디자이너 인터뷰','assets/magazine/glowny-directors.jpg','h','10. 12','','','해외에서 뜨겁게 주목받는 한국 브랜드, 그 뒤에 선 자매 디렉터들의 이야기','[]'::jsonb,'요즘 해외 패션 피플이 “서울 브랜드”를 말할 때 꼭 나오는 두 이름, 글로니와 오픈와이와이. 재미있는 건 두 브랜드 모두 자매가 함께 이끈다는 점이에요. 한 사람은 비즈니스를, 한 사람은 크리에이티브를. 서로 다른 감각과 취향이 부딪히고 섞이면서 만들어진 시너지가 지금의 브랜드를 만들었어요.

이번 호에서는 두 자매 디렉터의 시작과 지금, 그리고 “우리가 입고 싶은 옷”을 만드는 방식을 들여다봐요.','[{"heading": "GLOWNY 글로니 디렉터 & 디자이너", "sub": "최제인 대표 · 최지호 크리에이티브 디렉터", "image": "assets/magazine/glowny-directors.jpg", "body": "글로니의 크리에이티브 디렉터는 최지호(사진 오른쪽). 언니인 최제인(왼쪽) 대표와 함께 2020년 글로니를 론칭한 자매 창업자예요. 역할은 분명해요. 최제인이 비즈니스 전반을 맡는다면, 최지호는 제품 디자인부터 콘텐츠와 비주얼까지 글로니의 크리에이티브 전반을 책임져요.\n\n“언니가 숫자를 보고, 내가 옷을 본다”는 구조가 글로니를 가장 글로니답게 만든 비결. 사랑스럽지만 가볍지 않은, 빈티지하지만 촌스럽지 않은 균형은 두 사람이 매일 부딪히며 만든 결과예요.", "link": "https://glowny.co.kr/story.html", "link_label": "브랜드 스토리 보기"}, {"heading": "OPEN YY 오픈와이와이 디렉터 & 디자이너", "sub": "김지영 · 김보영 자매 디렉터", "image": "assets/magazine/openyy-directors.jpg", "body": "OPEN YY의 크리에이티브 디렉터 역시 자매, 김지영과 김보영이에요. 두 사람은 패션을 전공한 디자이너 출신이라기보다 옷을 좋아하고 오래 관찰해 온 사람들. “우리가 입고 싶고 설레는 옷”을 만들고 싶다는 마음 하나로 브랜드를 시작했어요.\n\n기존에 더오픈프로덕트를 전개하다 2023년 OPEN YY로 이름을 바꾸며 새로운 챕터를 열었고, 지금은 여성복과 유니섹스를 넘나드는 실루엣으로 해외 바이어들이 먼저 찾는 브랜드가 됐어요.", "link": "https://www.instagram.com/openyy_official/", "link_label": "Instagram"}]'::jsonb,'관련 매장 보기','search.html','Instagram에서 보기','',2)
on conflict (id) do update set kind = excluded.kind, badge = excluded.badge, title = excluded.title, hero = excluded.hero, editor = excluded.editor, date = excluded.date, price = excluded.price, note = excluded.note, summary = excluded.summary, info = excluded.info, intro = excluded.intro, sections = excluded.sections, related_label = excluded.related_label, related_link = excluded.related_link, cta_label = excluded.cta_label, cta_link = excluded.cta_link, sort = excluded.sort;

-- 3. 홈 '에디터 큐레이션 피드' 카드 4개(원래 3개 + 새 글)
update site_content
set value = jsonb_set(value, '{feed,items}', '[{"magazine": "k-brand-interview", "color": "blush", "title": "K-BRAND\n디자이너 인터뷰"}, {"magazine": "k-brand-showroom", "color": "beige", "title": "K-BRAND\n쇼룸 소개"}, {"magazine": "seongsu-daydrop", "color": "jade", "title": "성수 창고 쇼룸에서\n고르는 한국 브랜드"}, {"magazine": "k-brand-series-001", "color": "terracotta", "title": "K-BRAND\nSERIES 001\nOPEN YY"}]'::jsonb), updated_at = now()
where key = 'home';

-- THE HARPER: '셀럽이 입어서 유명한 브랜드' 글에서 오픈와이와이를 맨 위로(2026-10-13, hy0909)
-- 대표 사진을 오픈와이와이 자매 사진으로 바꾸고, 본문 첫 두 브랜드(글로니 ↔ 오픈와이와이) 순서만 바꾼다.
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run. 이미 바뀌어 있으면 아무것도 안 한다.
update magazines
set hero = 'assets/magazine/openyy-directors.jpg',
    sections = jsonb_build_array(sections->1, sections->0) || ((sections - 0) - 0)
where id = 'k-brand-celeb'
  and sections->0->>'heading' like 'GLOWNY%'
  and sections->1->>'heading' like 'OPEN YY%';

-- THE HARPER: 홈 투어 종류 카드의 준비 중 칩 글자를 '오픈 예정' → '추후 공개'로(2026-10-13, hy0909)
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run. 두 번 실행해도 안전하다.
update site_content
set value = jsonb_set(value, '{tours,soonLabel}', '"추후 공개"'::jsonb), updated_at = now()
where key = 'home';
