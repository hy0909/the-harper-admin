-- 2026-10-12 두 번째 모음: 매거진 "관련 매장 보기" 글자 + 투어 안내 한 줄 삭제. SQL Editor 에 통째로 붙여 넣고 Run.
-- 매거진 상세의 '관련 샵 보기' 버튼 글자를 '관련 매장 보기'로(앱에서 '샵'을 '매장'으로 통일). 두 번 돌려도 안전.
update magazines set related_label = '관련 매장 보기' where related_label = '관련 샵 보기';
-- 투어 종류 안내 창의 안내 한 줄('DAY DROP부터 예약할 수 있어요…')을 지운다. 두 번 돌려도 안전.
update site_content set value = jsonb_set(value, '{tours,info,note}', '""'), updated_at = now() where key = 'home' and value->'tours'->'info' is not null;
