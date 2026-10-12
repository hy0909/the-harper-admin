-- 투어 종류 안내 창의 안내 한 줄(tours.info.note)을 Supabase 에서 아예 없앤다.
-- 이 칸은 더 이상 쓰지 않는다(앱 화면·관리자 입력칸 모두 삭제). 두 번 돌려도 안전.
update site_content
set value = value #- '{tours,info,note}', updated_at = now()
where key = 'home' and value->'tours'->'info' ? 'note';
