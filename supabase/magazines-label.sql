-- 매거진 상세의 '관련 샵 보기' 버튼 글자를 '관련 매장 보기'로(앱에서 '샵'을 '매장'으로 통일). 두 번 돌려도 안전.
update magazines set related_label = '관련 매장 보기' where related_label = '관련 샵 보기';
