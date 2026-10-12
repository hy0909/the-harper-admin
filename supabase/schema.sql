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
insert into site_content (key,value) values ('home','{"today": {"eyebrow": "오늘의 추천", "title": "성수 창고 쇼룸에서\n고르는 한국 브랜드", "image": "assets/photos/seongsu-brick-showroom.jpg", "price": "128,000원~", "note": "4인 기준", "editor": "h", "cta": "예약하기", "link": "magazine.html"}, "tours": {"title": "투어 종류", "items": [{"tier": "DAY DROP", "title": "3시간 동행 쇼핑 큐레이션", "price": "128,000원 부터", "open": true}, {"tier": "CAPSULE", "title": "하루종일 1:1 큐레이션", "price": "", "open": false}, {"tier": "SIGNATURE", "title": "1박 헤리티지 투어", "price": "", "open": false}, {"tier": "BESPOKE", "title": "VIP 맞춤 투어", "price": "", "open": false}], "soonLabel": "추후 확장"}, "feed": {"title": "에디터 큐레이션 피드", "items": [{"color": "blush", "title": "셀럽이 입어서\n유명한 브랜드", "image": "assets/photos/seongsu-contemporary.jpg", "price": "128,000원~", "badge": "Day Drop", "editor": "h", "link": "magazine.html"}, {"color": "beige", "title": "K-BRAND\n디자이너 인터뷰", "image": "assets/photos/hannam-hillside.jpg", "price": "128,000원~", "badge": "Day Drop", "editor": "h", "link": "magazine.html"}, {"color": "jade", "title": "K-BRAND\n쇼룸 소개", "image": "assets/photos/hannam-studio.jpg", "price": "128,000원~", "badge": "Day Drop", "editor": "h", "link": "magazine.html"}, {"color": "terracotta", "title": "디자이너 스튜디오와\n플래그십 투어", "image": "assets/photos/hannam-vintage.jpg", "price": "128,000원~", "badge": "Day Drop", "editor": "h", "link": "magazine.html"}]}, "picks": {"title": "에디터’s PICK", "items": [{"title": "성수 공장 골목의 쇼룸 산책", "image": "assets/photos/seongsu-alley.jpg", "price": "128,000원~", "note": "4인 기준", "editor": "h", "link": ""}, {"title": "남산 보이는 한남 골목 숍", "image": "assets/photos/hannam-alley.jpg", "price": "128,000원~", "note": "4인 기준", "editor": "h", "link": ""}, {"title": "성수 연무장길 플래그십 한 바퀴", "image": "assets/photos/seongsu-street.jpg", "price": "128,000원~", "note": "4인 기준", "editor": "h", "link": ""}, {"title": "한남 계단 위 벽돌집 부티크", "image": "assets/photos/hannam-hillside.jpg", "price": "128,000원~", "note": "4인 기준", "editor": "h", "link": ""}, {"title": "성수 유리문 안의 디자이너 랙", "image": "assets/photos/seongsu-contemporary.jpg", "price": "128,000원~", "note": "4인 기준", "editor": "h", "link": ""}]}}'::jsonb) on conflict (key) do nothing;
insert into areas (id,name,lat,lng) values ('seongsu','성수',37.5428,127.0555) on conflict (id) do nothing;
insert into areas (id,name,lat,lng) values ('hannam','한남',37.5345,127.0012) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (0,1,'seongsu','성수','썬러브 링크스 성수','성수동2가 269-77',37.54048,127.05601,true,'assets/photos/seongsu-brick-showroom.jpg','성수 숨은 디자이너 브랜드 편집샵','["성수 골목 안쪽, 간판이 작아 그냥 지나치기 쉬운 편집샵이에요. 국내 신진 디자이너 브랜드를 모아 두는데, 대부분 일본에 매장이 없는 곳들이라 여기서만 살 수 있어요.", "한 번에 다 보려 하지 말고 랙 하나씩 천천히 보세요. 사이즈가 애매하면 직원분이 솔직하게 말해 주는 편이라 믿고 물어봐도 됩니다."]'::jsonb,null,null,null,0) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (1,3,'seongsu','성수','포인트오브뷰 성수','연무장길 18',37.54356,127.0514,false,'assets/photos/seongsu-contemporary.jpg','문구와 오브제를 모아 둔 편집샵','["옷은 없지만 성수 투어 중간에 한 번 들르기 좋은 곳이에요. 문구와 작은 오브제를 고르다 보면 쇼핑 리듬이 한 번 쉬어 갑니다."]'::jsonb,null,null,null,1) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (2,2,'seongsu','성수','LCDC SEOUL','연무장17길 10',37.54214,127.06155,false,'assets/photos/seongsu-alley.jpg','복합 공간 안에 브랜드 매장이 모여 있는 곳','["한 건물 안에 브랜드 매장과 카페가 모여 있어요. 비 오는 날 투어 코스로 넣기 좋습니다."]'::jsonb,null,null,null,2) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (3,1,'seongsu','성수','아더 스페이스 3.0','연무장길 53',37.54418,127.05062,false,'assets/photos/hannam-studio.jpg','아더에러 플래그십, 공간 자체가 볼거리','["아더에러의 성수 플래그십이에요. 옷만큼 공간 연출이 유명해서 사진 찍으러 오는 분도 많습니다."]'::jsonb,null,null,null,3) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (4,2,'hannam','한남','비이커 한남','이태원로54길 57',37.5351,127.0008,false,'assets/photos/hannam-hillside.jpg','국내외 브랜드를 넓게 모아 둔 한남 편집샵','["한남에서 가장 넓게 보는 편집샵이에요. 국내 브랜드와 해외 브랜드가 같이 걸려 있어 비교해 보기 좋습니다."]'::jsonb,null,null,null,4) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (5,2,'hannam','한남','아모멘토 한남','한남동 [확인 필요]',37.534,127.003,false,'assets/photos/hannam-alley.jpg','군더더기 없는 한국 브랜드 플래그십','["색과 선을 최소로 줄인 옷을 만드는 브랜드의 플래그십이에요. 베이식한 옷을 오래 입고 싶은 분께 먼저 권합니다."]'::jsonb,null,null,null,5) on conflict (id) do nothing;
insert into shops (id,tier,area,area_name,name,addr,lat,lng,pick,photo,note,intro,hours,closed,phone,sort) values (6,3,'hannam','한남','엠프티 한남','한남동 [확인 필요]',37.5357,127.0005,false,'assets/photos/hannam-vintage.jpg','신진 브랜드를 모아 둔 무신사 편집샵','["무신사가 꾸린 오프라인 편집샵이에요. 온라인에서만 보던 신진 브랜드를 직접 입어 볼 수 있습니다."]'::jsonb,null,null,null,6) on conflict (id) do nothing;
