# THE HARPER 관리자

THE HARPER 앱(https://hy0909.github.io/the-harper-app/)의 내용을 고치는 웹 관리자입니다.
서버 없이 브라우저만으로 돌아가고, 저장하면 GitHub에 있는 앱 저장소(`hy0909/the-harper-app`)의 파일을 바로 바꿉니다.

- 관리자 주소: https://hy0909.github.io/the-harper-admin/
- 고치는 파일: 앱 저장소의 `data/content.json`(에디터·메인 화면), `data/shops.json`(지도 샵)

## 할 수 있는 것

| 화면 | 내용 |
| --- | --- |
| 에디터 | 에디터 목록. 프로필 사진, 닉네임. 추가·삭제(다른 곳에서 쓰이는 에디터는 삭제 안 됨) |
| 메인 화면 | 오늘의 추천, 투어 종류(순서 바꾸기·예약 가능 여부), 에디터 큐레이션 피드(카드 색·사진·배지), 에디터’s PICK |
| 지도 샵 | 매장 목록 검색, 전체 항목 수정, 지도에서 핀으로 위치 잡기, 소개 글 문단, 추가·삭제 |

## 로그인: GitHub 토큰 만들기

관리자는 GitHub 토큰으로 로그인합니다. 토큰은 쓰는 사람의 브라우저(localStorage)에만 저장되고 GitHub 말고는 어디에도 보내지 않습니다.

1. github.com 로그인 → 오른쪽 위 프로필 → **Settings**
2. 왼쪽 맨 아래 **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
3. 이름은 아무거나(예: `harper-admin`), 만료일은 넉넉하게
4. **Repository access** → **Only select repositories** → `the-harper-app` 선택
5. **Permissions** → **Repository permissions** → **Contents** 를 **Read and write** 로
6. **Generate token** → `github_pat_` 로 시작하는 문자열을 복사해 관리자 로그인 칸에 붙여넣기

토큰은 한 번만 보여 줍니다. 잃어버리면 새로 만들면 됩니다. 로그아웃하면 브라우저에서 지워집니다.

## 저장은 어떻게 되나

- 화면마다 **저장** 버튼이 있습니다. 고친 게 있으면 버튼이 켜지고 탭에 주황 점이 생깁니다.
- 저장을 누르면 앱 저장소에 커밋이 하나 생깁니다(GitHub Contents API). 그러면 GitHub Pages가 다시 배포되어 **1~2분 뒤** 앱에 반영됩니다.
- 두 사람이 같은 파일을 동시에 고치면 나중에 저장하는 쪽이 막히고, 최신 내용을 다시 불러옵니다. 그때는 고친 내용을 다시 넣어야 합니다.
- 저장하지 않고 창을 닫으려 하면 경고가 뜹니다.

## 사진은 어디로 가나

- "사진 올리기"로 올린 파일은 앱 저장소의 `assets/uploads/날짜-이름.jpg` 로 들어가고, 경로가 자동으로 칸에 채워집니다.
- 올릴 때 브라우저에서 긴 변 1600px, JPEG 85% 품질로 줄입니다(PNG는 PNG 그대로).
- 사진을 올리는 것과 저장은 별개입니다. 올린 뒤 **저장**을 눌러야 앱에 적용됩니다.
- 이미 저장소에 있는 사진은 경로 칸에 직접 적어도 됩니다(예: `assets/photos/x.jpg`).

## 로컬에서 띄우기

빌드 없이 그냥 정적 파일입니다.

```sh
python3 -m http.server 8790
# http://localhost:8790/
```

## 파일

- `index.html` 화면 뼈대
- `admin.css` 스타일
- `js/util.js` 공통 도구(DOM, base64, 알림)
- `js/github.js` GitHub API 호출
- `js/ui.js` 입력 필드·이미지 업로드·저장 버튼
- `js/screen-editors.js` 에디터 화면
- `js/screen-home.js` 메인 화면
- `js/screen-shops.js` 지도 샵 화면
- `js/admin.js` 로그인·탭·불러오기·저장
