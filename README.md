# THE HARPER 관리자

THE HARPER 앱(https://hy0909.github.io/the-harper-app/)의 내용을 고치는 웹 관리자입니다.
서버 없이 브라우저만으로 돌아가고, 내용은 Supabase에 저장됩니다. 저장하면 앱에 바로 반영됩니다.

- 관리자 주소: https://hy0909.github.io/the-harper-admin/
- 데이터: Supabase 프로젝트 `cwpucaqnhuaoglxcfdzz`의 테이블 `editors`, `site_content`, `areas`, `shops`, `magazines`
- 사진: Supabase Storage 버킷 `images`(공개)

## 할 수 있는 것

| 화면 | 내용 | 테이블 |
| --- | --- | --- |
| 에디터 | 에디터 목록. 프로필 사진, 닉네임. 추가·삭제(다른 곳에서 쓰이는 에디터는 삭제 안 됨) | `editors` |
| 메인 화면 | 오늘의 추천(작은 머리글, 매거진 고르기), 투어 종류(설명·예약 가능 여부·순서·안내 창 글), 에디터 큐레이션 피드(카드 색, 매거진 고르기), 에디터’s PICK(매거진 고르기) | `site_content` (key=`home`), 매거진 고르기는 `magazines` |
| 매거진 | 매거진·투어 상세 글 목록. 종류·배지·제목·대표 사진·에디터·날짜·가격·요약·안내 정보·본문·섹션·버튼. 순서 바꾸기, 추가·삭제 | `magazines` (에디터 선택지는 `editors`) |
| 지도 샵 | 매장 목록 검색, 전체 항목 수정, 지도에서 핀으로 위치 잡기, 소개 글 문단, 추가·삭제 | `shops` (지역 선택지는 `areas`) |

메인 화면의 카드는 매거진 글을 가리킵니다. 카드에 보이는 사진·제목·에디터는 매거진 화면에서 고치고, 메인 화면에서는 어느 글을 쓸지만 고릅니다. 예전에 메인 화면에 직접 적던 제목·사진·가격·링크 칸은 없어졌고, 예전 값은 저장할 때 자동으로 새 구조로 옮겨집니다(링크의 `magazine.html?id=…`에서 글 id를 가져옵니다).

주의: `schema.sql`을 다시 돌리면 메인 화면 값도 맨 아래 `-- 5-4.` 내용으로 되돌아갑니다. 관리자에서 메인 화면을 고쳐 둔 뒤에는 `schema.sql`을 다시 돌리지 마세요.

## 처음 한 번 할 일 (Supabase)

1. **테이블 만들기** — Supabase 대시보드 → **SQL Editor** → `supabase/schema.sql` 내용을 통째로 붙여넣고 **Run**. 테이블, 권한(누구나 읽기 / 로그인한 사람만 쓰기), 사진 버킷, 초기 데이터가 한 번에 들어갑니다. 두 번 실행해도 안전합니다.
2. **anon 키 넣기** — **Project Settings → API** 의 `anon` `public` 키를 복사해서 `js/config.js` 의 `anonKey` 에 붙여넣습니다. 이 키는 공개돼도 되는 키입니다(쓰기는 로그인한 사람만 가능).
3. **로그인 계정 만들기** — **Authentication → Users → Add user** 에서 이메일과 비밀번호를 정해 만듭니다(`Auto Confirm User` 켜기). 이 이메일·비밀번호로 관리자에 로그인합니다.

## 로그인

이메일과 비밀번호로 로그인합니다. 계정은 위 3번처럼 관리자가 Supabase에서 만들어 줍니다. 로그인 상태는 브라우저에 남아 있어 다음에 열면 바로 들어가지고, **로그아웃**을 누르면 지워집니다.

## 저장은 어떻게 되나

- 화면마다 **저장** 버튼이 있습니다. 고친 게 있으면 버튼이 켜지고 탭에 주황 점이 생깁니다.
- 저장을 누르면 Supabase 테이블에 바로 쓰고, 앱은 열 때마다 Supabase에서 읽으므로 **바로 반영**됩니다.
- 에디터와 메인 화면은 한 묶음이라 어느 쪽에서 저장해도 둘 다 저장됩니다.
- 지도 샵과 매거진은 바뀐 것만 고치고, 지운 것은 테이블에서도 지웁니다.
- 저장하지 않고 창을 닫으려 하면 경고가 뜹니다.

## 사진은 어디로 가나

- "사진 올리기"로 올린 파일은 Storage 버킷 `images` 의 `uploads/날짜-이름.jpg` 로 들어가고, 공개 주소(`https://…/storage/v1/object/public/images/uploads/…`)가 자동으로 칸에 채워집니다.
- 올릴 때 브라우저에서 긴 변 1600px, JPEG 85% 품질로 줄입니다(PNG는 PNG 그대로). 같은 이름이 있으면 `-2`, `-3` 을 붙입니다.
- 사진을 올리는 것과 저장은 별개입니다. 올린 뒤 **저장**을 눌러야 앱에 적용됩니다.
- 예전처럼 앱 저장소에 있는 사진 경로(`assets/photos/x.jpg`)를 직접 적어도 됩니다. 미리보기는 앱 주소에서 찾아옵니다.

## 로컬에서 띄우기

빌드 없이 그냥 정적 파일입니다.

```sh
python3 -m http.server 8790
# http://localhost:8790/
```

## 파일

- `index.html` 화면 뼈대
- `admin.css` 스타일
- `js/config.js` Supabase 주소와 anon 키
- `js/util.js` 공통 도구(DOM, 알림)
- `js/db.js` Supabase 읽기·쓰기·사진 올리기
- `js/ui.js` 입력 필드·이미지 업로드·저장 버튼
- `js/screen-editors.js` 에디터 화면
- `js/screen-home.js` 메인 화면
- `js/screen-magazines.js` 매거진 화면
- `js/screen-shops.js` 지도 샵 화면
- `js/admin.js` 로그인·탭·불러오기·저장
- `supabase/schema.sql` 테이블·권한·버킷·초기 데이터
- `supabase/home-magazines.sql` 메인 화면 값을 새 구조로 바꾸는 SQL(schema.sql 맨 아래 `-- 5-4.`와 같은 내용)
- `supabase/magazines.sql` 매거진 글 표·초기 데이터
