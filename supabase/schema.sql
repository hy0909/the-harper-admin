-- THE HARPER: Supabase 테이블·권한·초기 데이터
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run 하면 된다. 두 번 실행해도 안전하다.

-- 1. 테이블
create table if not exists editors (
  id text primary key,
  name text not null,
  avatar text not null default '',
  sort int not null default 0
);
create table if not exists site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists areas (
  id text primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null
);
create table if not exists shops (
  id int primary key,
  tier int not null default 3,
  area text not null references areas(id),
  area_name text not null,
  name text not null,
  addr text not null default '',
  lat double precision not null,
  lng double precision not null,
  pick boolean not null default false,
  photo text not null default '',
  note text not null default '',
  intro jsonb not null default '[]'::jsonb,
  hours text,
  closed text,
  phone text,
  sort int not null default 0
);

-- 2. 권한: 누구나 읽기, 로그인한 에디터만 쓰기
alter table editors enable row level security;
alter table site_content enable row level security;
alter table areas enable row level security;
alter table shops enable row level security;
do $$
declare t text;
begin
  foreach t in array array['editors','site_content','areas','shops'] loop
    execute format('drop policy if exists "read_all" on %I', t);
    execute format('create policy "read_all" on %I for select using (true)', t);
    execute format('drop policy if exists "write_auth" on %I', t);
    execute format('create policy "write_auth" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- 3. 사진 저장소(공개 버킷 images)
insert into storage.buckets (id, name, public) values ('images','images',true)
  on conflict (id) do update set public = true;
drop policy if exists "images_read" on storage.objects;
create policy "images_read" on storage.objects for select using (bucket_id = 'images');
drop policy if exists "images_write" on storage.objects;
create policy "images_write" on storage.objects for all to authenticated
  using (bucket_id = 'images') with check (bucket_id = 'images');

-- 4. 초기 데이터(지금 앱의 data/*.json 그대로)

insert into editors (id,name,avatar,sort) values ('h','에디터H','',0) on conflict (id) do nothing;
insert into site_content (key,value) values ('home','{"today": {"eyebrow": "오늘의 추천", "magazine": "k-brand-celeb", "title": "셀럽이 입어서\n유명한 브랜드"}, "tours": {"title": "투어 종류", "soonLabel": "오픈 예정", "info": {"title": "투어 종류 안내", "note": ""}, "items": [{"tier": "DAY DROP", "title": "3시간 동행 쇼핑 큐레이션", "price": "128,000원~", "open": true, "desc": "에디터와 반나절 동안 성수·한남·압구정의 매장을 함께 돌며 옷을 고르는 단품 큐레이션이에요. 입어 볼 때 옆에서 솔직하게 말해 드려요. 4인 기준 가격입니다."}, {"tier": "CAPSULE", "title": "하루종일 1:1 큐레이션", "price": "", "open": false, "desc": "하루를 통째로 에디터 한 명과 1:1로 다니는 큐레이션이에요. 취향을 미리 듣고 코스를 짭니다."}, {"tier": "SIGNATURE", "title": "1박 헤리티지 투어", "price": "", "open": false, "desc": "1박 2일 동안 서울의 K-패션 뿌리를 따라가는 투어예요. 쇼룸과 공방, 디자이너를 만나는 일정이 들어갑니다."}, {"tier": "BESPOKE", "title": "VIP 맞춤 투어", "price": "", "open": false, "desc": "일정·동선·동행 인원을 처음부터 맞춰 짜는 투어예요. 문의 후 상담으로 정합니다."}]}, "feed": {"title": "에디터 큐레이션 피드", "items": [{"magazine": "k-brand-interview", "color": "blush", "title": "K-BRAND\n디자이너 인터뷰"}, {"magazine": "k-brand-showroom", "color": "beige", "title": "K-BRAND\n쇼룸 소개"}, {"magazine": "seongsu-daydrop", "color": "jade", "title": "성수 창고 쇼룸에서\n고르는 한국 브랜드"}]}, "picks": {"title": "에디터’s PICK", "items": [{"magazine": "seongsu-daydrop"}, {"magazine": "k-brand-celeb"}, {"magazine": "k-brand-interview"}, {"magazine": "k-brand-showroom"}]}}'::jsonb) on conflict (key) do nothing;
insert into areas (id,name,lat,lng) values ('seongsu','성수',37.5428,127.0555) on conflict (id) do nothing;
insert into areas (id,name,lat,lng) values ('hannam','한남',37.5345,127.0012) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (0,1,'seongsu','성수','썬러브 링크스 성수','성수동2가 269-77',37.54048,127.05601,true,'assets/photos/seongsu-brick-showroom.jpg','성수 숨은 디자이너 브랜드 편집샵','["성수 골목 안쪽, 간판이 작아 그냥 지나치기 쉬운 편집샵이에요. 국내 신진 디자이너 브랜드를 모아 두는데, 대부분 일본에 매장이 없는 곳들이라 여기서만 살 수 있어요.", "한 번에 다 보려 하지 말고 랙 하나씩 천천히 보세요. 사이즈가 애매하면 직원분이 솔직하게 말해 주는 편이라 믿고 물어봐도 됩니다."]'::jsonb,null,null,null,0) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (1,3,'seongsu','성수','포인트오브뷰 성수','연무장길 18',37.54356,127.0514,false,'assets/photos/seongsu-contemporary.jpg','문구와 오브제를 모아 둔 편집샵','["옷은 없지만 성수 투어 중간에 한 번 들르기 좋은 곳이에요. 문구와 작은 오브제를 고르다 보면 쇼핑 리듬이 한 번 쉬어 갑니다."]'::jsonb,null,null,null,1) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (2,2,'seongsu','성수','LCDC SEOUL','연무장17길 10',37.54214,127.06155,false,'assets/photos/seongsu-alley.jpg','복합 공간 안에 브랜드 매장이 모여 있는 곳','["한 건물 안에 브랜드 매장과 카페가 모여 있어요. 비 오는 날 투어 코스로 넣기 좋습니다."]'::jsonb,null,null,null,2) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (3,1,'seongsu','성수','아더 스페이스 3.0','연무장길 53',37.54418,127.05062,false,'assets/photos/hannam-studio.jpg','아더에러 플래그십, 공간 자체가 볼거리','["아더에러의 성수 플래그십이에요. 옷만큼 공간 연출이 유명해서 사진 찍으러 오는 분도 많습니다."]'::jsonb,null,null,null,3) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (4,2,'hannam','한남','비이커 한남','이태원로54길 57',37.5351,127.0008,false,'assets/photos/hannam-hillside.jpg','국내외 브랜드를 넓게 모아 둔 한남 편집샵','["한남에서 가장 넓게 보는 편집샵이에요. 국내 브랜드와 해외 브랜드가 같이 걸려 있어 비교해 보기 좋습니다."]'::jsonb,null,null,null,4) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (5,2,'hannam','한남','아모멘토 한남','한남동 [확인 필요]',37.534,127.003,false,'assets/photos/hannam-alley.jpg','군더더기 없는 한국 브랜드 플래그십','["색과 선을 최소로 줄인 옷을 만드는 브랜드의 플래그십이에요. 베이식한 옷을 오래 입고 싶은 분께 먼저 권합니다."]'::jsonb,null,null,null,5) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (6,3,'hannam','한남','엠프티 한남','한남동 [확인 필요]',37.5357,127.0005,false,'assets/photos/hannam-vintage.jpg','신진 브랜드를 모아 둔 무신사 편집샵','["무신사가 꾸린 오프라인 편집샵이에요. 온라인에서만 보던 신진 브랜드를 직접 입어 볼 수 있습니다."]'::jsonb,null,null,null,6) on conflict (id) do nothing;

-- 5. 2026-10-12 추가분. 위와 같이 두 번 실행해도 안전하다.
-- (5-1 은 지움: 에디터's PICK 에 가격 칸이 없어졌다)

-- 5-2. 압구정(도산) 지역과 매장 7곳. 자세한 설명은 supabase/shops-apgujeong.sql
insert into areas (id,name,lat,lng) values ('apgujeong','압구정',37.5250,127.0365) on conflict (id) do nothing;

insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values
(7,2,'apgujeong','압구정','하우스 노웨어 도산','압구정로46길 50',37.52581,127.03590,false,'assets/photos/hannam-studio.jpg','도산 골목의 K-브랜드 편집샵','["압구정 도산 쇼룸 코스의 첫 집이에요. 매장 소개는 아직 정리 중입니다 [확인 필요]."]'::jsonb,null,null,null,7),
(8,1,'apgujeong','압구정','글로니 도산','언주로164길 19',37.52550,127.03522,false,'assets/photos/seongsu-contemporary.jpg','20대 여성 팬덤이 탄탄한 서울 여성복 브랜드','["사랑스럽고 빈티지한 무드에 건강한 여성성을 더한 스타일이에요. 슬림한 톱과 니트, 미니 드레스와 데님 같은 데일리웨어가 강합니다.", "자매가 함께 이끄는 브랜드로, 2020년에 시작했어요."]'::jsonb,null,null,null,8),
(9,1,'apgujeong','압구정','시눈 플래그십스토어 도산','압구정로42길 47',37.52390,127.03400,false,'assets/photos/hannam-alley.jpg','로맨틱한 소녀 감성을 서울 무드로 푼 여성복','["니트와 카디건, 스커트, 드레스처럼 부드러운 실루엣의 여성복과 액세서리가 주력이에요. 20대 여성층에서 인지도를 넓혀 온 브랜드입니다."]'::jsonb,null,null,null,9),
(10,2,'apgujeong','압구정','엘보른 도산 플래그십스토어','압구정로42길 42',37.52370,127.03422,false,'assets/photos/hannam-hillside.jpg','도산의 K-브랜드 플래그십','["압구정 도산 쇼룸 코스에 들어가는 플래그십이에요. 매장 소개는 아직 정리 중입니다 [확인 필요]."]'::jsonb,null,null,null,10),
(11,2,'apgujeong','압구정','아뜰리에 에디션','압구정로46길 34 1층-2층',37.52571,127.03610,false,'assets/photos/seongsu-alley.jpg','1·2층으로 이어지는 도산 편집샵','["1층과 2층을 같이 쓰는 편집샵이에요. 매장 소개는 아직 정리 중입니다 [확인 필요]."]'::jsonb,null,null,null,11),
(12,3,'apgujeong','압구정','유메르 도산지점','도산대로49길 11 지층·1층',37.52427,127.03721,false,'assets/photos/hannam-vintage.jpg','도산의 K-브랜드 쇼룸','["지층과 1층을 같이 쓰는 매장이에요. 매장 소개는 아직 정리 중입니다 [확인 필요]."]'::jsonb,null,null,null,12),
(13,2,'apgujeong','압구정','얼바닉30','선릉로160길 3',37.52634,127.04061,false,'assets/photos/seongsu-street.jpg','청담 쪽 골목의 K-브랜드 편집샵','["압구정 도산 코스의 마지막 집으로, 청담 쪽에 있어요. 매장 소개는 아직 정리 중입니다 [확인 필요]."]'::jsonb,null,null,null,13)
on conflict (id) do nothing;

-- 5-3. 홈 투어 카드 가격 표기를 '128,000원~'으로('부터' 대신 물결)
update site_content
set value = jsonb_set(value, '{tours,items,0,price}', '"128,000원~"'),
  updated_at = now()
where key = 'home' and value->'tours'->'items'->0->>'price' = '128,000원 부터';

-- 5-4. 메인 화면을 새 구조로: 카드가 매거진 글을 가리킨다(supabase/home-magazines.sql 과 같은 내용)
update site_content
set value = '{"today": {"eyebrow": "오늘의 추천", "magazine": "k-brand-celeb", "title": "셀럽이 입어서\n유명한 브랜드"}, "tours": {"title": "투어 종류", "soonLabel": "오픈 예정", "info": {"title": "투어 종류 안내", "note": ""}, "items": [{"tier": "DAY DROP", "title": "3시간 동행 쇼핑 큐레이션", "price": "128,000원~", "open": true, "desc": "에디터와 반나절 동안 성수·한남·압구정의 매장을 함께 돌며 옷을 고르는 단품 큐레이션이에요. 입어 볼 때 옆에서 솔직하게 말해 드려요. 4인 기준 가격입니다."}, {"tier": "CAPSULE", "title": "하루종일 1:1 큐레이션", "price": "", "open": false, "desc": "하루를 통째로 에디터 한 명과 1:1로 다니는 큐레이션이에요. 취향을 미리 듣고 코스를 짭니다."}, {"tier": "SIGNATURE", "title": "1박 헤리티지 투어", "price": "", "open": false, "desc": "1박 2일 동안 서울의 K-패션 뿌리를 따라가는 투어예요. 쇼룸과 공방, 디자이너를 만나는 일정이 들어갑니다."}, {"tier": "BESPOKE", "title": "VIP 맞춤 투어", "price": "", "open": false, "desc": "일정·동선·동행 인원을 처음부터 맞춰 짜는 투어예요. 문의 후 상담으로 정합니다."}]}, "feed": {"title": "에디터 큐레이션 피드", "items": [{"magazine": "k-brand-interview", "color": "blush", "title": "K-BRAND\n디자이너 인터뷰"}, {"magazine": "k-brand-showroom", "color": "beige", "title": "K-BRAND\n쇼룸 소개"}, {"magazine": "seongsu-daydrop", "color": "jade", "title": "성수 창고 쇼룸에서\n고르는 한국 브랜드"}]}, "picks": {"title": "에디터’s PICK", "items": [{"magazine": "seongsu-daydrop"}, {"magazine": "k-brand-celeb"}, {"magazine": "k-brand-interview"}, {"magazine": "k-brand-showroom"}]}}'::jsonb,
  updated_at = now()
where key = 'home' and coalesce(value->'today'->>'magazine', '') = ''; -- 아직 옛 구조(제목·사진 직접 입력)일 때만 바꾼다. 관리자에서 고친 새 값은 덮지 않는다
