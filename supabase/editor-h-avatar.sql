-- 에디터H 프로필 사진을 넣는다. 앱 저장소에 올린 사진(assets/editors/editor-h.webp)의 배포 주소. 두 번 돌려도 안전.
update editors set avatar = 'https://hy0909.github.io/the-harper-app/assets/editors/editor-h.webp' where id = 'h' and coalesce(avatar, '') = '';
