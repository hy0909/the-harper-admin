-- 투어 종류 안내 창의 안내 한 줄('DAY DROP부터 예약할 수 있어요…')을 지운다. 두 번 돌려도 안전.
update site_content set value = jsonb_set(value, '{tours,info,note}', '""'), updated_at = now() where key = 'home' and value->'tours'->'info' is not null;
