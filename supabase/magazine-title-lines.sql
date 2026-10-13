-- THE HARPER: 매거진 제목에 홈 카드와 같은 줄바꿈 넣기(2026-10-13, hy0909)
-- 상세 화면 제목이 카드처럼 두 줄로 나온다. Supabase SQL Editor 에 붙여넣고 Run. 두 번 실행해도 안전하다.
update magazines set title = '셀럽이 입어서' || chr(10) || '유명한 브랜드' where id = 'k-brand-celeb';
update magazines set title = 'K-BRAND' || chr(10) || '디자이너 인터뷰' where id = 'k-brand-interview';
update magazines set title = 'K-BRAND' || chr(10) || '쇼룸 소개' where id = 'k-brand-showroom';
update magazines set title = '성수 창고 쇼룸에서' || chr(10) || '고르는 한국 브랜드' where id = 'seongsu-daydrop';
update magazines set title = 'K-BRAND' || chr(10) || 'SERIES 001' || chr(10) || 'OPEN YY' where id = 'k-brand-series-001';
