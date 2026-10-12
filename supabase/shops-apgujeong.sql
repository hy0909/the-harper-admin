-- 압구정(도산) 매장 7곳 추가. 출처: [THE HARPER] contents proposal_0930.pdf 8쪽 "K-브랜드 쇼룸 하루 코스".
-- 기존 성수·한남 매장은 그대로 두고 뒤에 붙인다(id 7~13). 앱 data/shops.json 과 같은 값.
-- 좌표는 도로명 주소를 OpenStreetMap 으로 지오코딩한 값이라 길 단위 정확도 [확인 필요]. 티어·사진은 임시값 [확인 필요].
-- Supabase 대시보드 → SQL Editor 에 붙여 넣고 Run.

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
