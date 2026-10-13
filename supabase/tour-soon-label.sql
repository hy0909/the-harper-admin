-- THE HARPER: 홈 투어 종류 카드의 준비 중 칩 글자를 '오픈 예정' → '추후 공개'로(2026-10-13, hy0909)
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run. 두 번 실행해도 안전하다.
update site_content
set value = jsonb_set(value, '{tours,soonLabel}', '"추후 공개"'::jsonb), updated_at = now()
where key = 'home';
