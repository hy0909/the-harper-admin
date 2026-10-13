-- THE HARPER: '셀럽이 입어서 유명한 브랜드' 글에서 오픈와이와이를 맨 위로(2026-10-13, hy0909)
-- 대표 사진을 오픈와이와이 자매 사진으로 바꾸고, 본문 첫 두 브랜드(글로니 ↔ 오픈와이와이) 순서만 바꾼다.
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run. 이미 바뀌어 있으면 아무것도 안 한다.
update magazines
set hero = 'assets/magazine/openyy-directors.jpg',
    sections = jsonb_build_array(sections->1, sections->0) || ((sections - 0) - 0)
where id = 'k-brand-celeb'
  and sections->0->>'heading' like 'GLOWNY%'
  and sections->1->>'heading' like 'OPEN YY%';
