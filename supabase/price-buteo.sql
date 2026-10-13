-- 가격 표기 '128,000원~' → '128,000원부터' 를 살아 있는 Supabase 행에 반영한다.
-- Supabase SQL Editor 에 통째로 붙여 넣어 한 번 실행한다. 여러 번 실행해도 결과가 같다(이미 바뀐 값은 건드리지 않는다).
-- 대상: 매거진 seongsu-daydrop 의 가격(price)과 소개글(intro)의 '₩128,000~ (4인 기준)' 줄, 홈 site_content 의 DAY DROP 카드 가격.

-- 1) 매거진 가격 칸
update magazines
set price = replace(price, '128,000원~', '128,000원부터')
where price like '%128,000원~%';

-- 2) 매거진 소개글: 본문의 가격 줄 (₩ 표기를 한국어 표기로)
update magazines
set intro = replace(intro, '🤎 ₩128,000~ (4인 기준)', '🤎 128,000원부터 (4인 기준)')
where intro like '%₩128,000~ (4인 기준)%';

-- 3) 홈 화면 투어 카드 가격 (site_content 의 jsonb: tours.items[0].price)
update site_content
set value = jsonb_set(value, '{tours,items,0,price}', '"128,000원부터"'),
  updated_at = now()
where key = 'home'
  and value->'tours'->'items'->0->>'price' = '128,000원~';

-- 확인용 (선택): 결과가 0이면 '원~' 이 남은 곳이 없다
-- select id from magazines where price like '%원~%' or intro like '%128,000원~%';
-- select value->'tours'->'items'->0->>'price' from site_content where key = 'home';
