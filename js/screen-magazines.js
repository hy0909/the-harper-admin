/* 매거진 화면: 왼쪽 글 목록, 오른쪽 수정 폼. 테이블 magazines 한 줄 = 글 하나 */
App.screens.magazines = {
  files: ['magazines', 'content'], // 메인 화면이 가리키는 글인지 보려고 content 도 읽는다
  selectedId: null,
  idTouched: new WeakSet(), // id 칸을 직접 고친 새 글 (제목으로 자동 채우기를 멈춤)
  APP_URL: 'https://hy0909.github.io/the-harper-app/magazine.html?id=',

  KINDS: [
    { value: 'magazine', label: '매거진' },
    { value: 'tour', label: '투어' },
  ],

  blank(data) {
    return {
      id: '', kind: 'magazine', badge: '', title: '', hero: '', editor: ((data.editors || [])[0] || {}).id || '',
      date: '', price: '', note: '', summary: '', info: [], intro: '', sections: [],
      related_label: '', related_link: '', cta_label: '', cta_link: '',
    };
  },

  // 불러왔을 때(또는 마지막 저장 때) 없던 글이면 새 글 → id를 고칠 수 있다
  isNew(m) {
    const saved = (App.files.magazines.saved && App.files.magazines.saved.magazines) || [];
    return !saved.some((s) => s.id === m.id) || !m.id;
  },

  validId(id) { return /^[a-z0-9-]+$/.test(id || ''); },

  uniqueId(data, base, except) {
    let id = base, n = 2;
    const ids = new Set((data.magazines || []).filter((m) => m !== except).map((m) => m.id));
    while (ids.has(id)) id = `${base}-${n++}`;
    return id;
  },

  // 메인 화면(오늘의 추천 · 피드 · PICK)이 이 글 id 를 쓰는 자리
  homeReferences(id) {
    const home = (App.files.content && App.files.content.data && App.files.content.data.home) || {};
    const refs = [];
    if (home.today && home.today.magazine === id) refs.push('메인 화면 › 오늘의 추천');
    ((home.feed && home.feed.items) || []).forEach((it, i) => { if (it.magazine === id) refs.push(`메인 화면 › 큐레이션 피드 ${i + 1}번`); });
    ((home.picks && home.picks.items) || []).forEach((it, i) => { if (it.magazine === id) refs.push(`메인 화면 › 에디터’s PICK ${i + 1}번`); });
    return refs;
  },

  validate() {
    const d = App.files.magazines.data;
    const errors = [];
    const seen = new Set();
    const ids = new Set((d.editors || []).map((e) => e.id));
    (d.magazines || []).forEach((m, i) => {
      const who = m.title ? `"${m.title}"` : `${i + 1}번 글`;
      if (!m.title || !m.title.trim()) errors.push(`${i + 1}번 글: 제목을 적어 주세요.`);
      const id = String(m.id || '').trim();
      if (!id) errors.push(`${who}: id가 비어 있습니다.`);
      else if (!this.validId(id)) errors.push(`${who}: id는 영문 소문자·숫자·하이픈(-)만 쓸 수 있습니다.`);
      else if (seen.has(id)) errors.push(`${who}: id "${id}"가 다른 글과 겹칩니다.`);
      seen.add(id);
      if (!m.hero) errors.push(`${who}: 대표 사진이 필요합니다.`);
      if (m.editor && !ids.has(m.editor)) errors.push(`${who}: 없는 에디터를 가리키고 있습니다.`);
      (m.sections || []).forEach((s, j) => {
        if (!s.heading || !s.heading.trim()) errors.push(`${who} › 섹션 ${j + 1}번: 소제목을 적어 주세요.`);
      });
    });
    return errors;
  },

  render(root) {
    UI.file = 'magazines';
    const data = App.files.magazines.data;
    if (!Array.isArray(data.magazines)) data.magazines = [];
    if (!Array.isArray(data.editors)) data.editors = [];
    const self = this;
    const rerender = () => { const y = window.scrollY; root.innerHTML = ''; self.render(root); window.scrollTo(0, y); };
    const scrollToForm = () => setTimeout(() => { const f = $('#mag-form'); if (f && window.innerWidth < 720) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);

    root.append(screenHead('매거진', '앱의 매거진·투어 상세 글입니다. 목록에서 글을 고르면 수정 칸이 열립니다. 목록 순서가 앱에 보이는 순서입니다.', 'magazines',
      () => App.save('magazines', () => self.validate())));
    root.append(h('div', { id: 'errbox' }));

    const addBtn = h('button', { class: 'btn small', type: 'button', onclick: () => {
      const m = self.blank(data);
      data.magazines.push(m);
      self.selectedId = m; // 새 글은 id가 비어 있어 객체로 기억
      markDirty('magazines');
      rerender();
      scrollToForm();
    } }, '+ 매거진 추가');

    const list = h('div', { class: 'mag-list' });
    const drawList = () => {
      list.innerHTML = '';
      if (!data.magazines.length) { list.append(h('div', { class: 'empty' }, '글이 없습니다. "매거진 추가"를 눌러 주세요.')); return; }
      data.magazines.forEach((m, i) => {
        const sel = self.selected(data) === m;
        const kind = self.KINDS.find((k) => k.value === m.kind) || self.KINDS[0];
        const move = (d) => (e) => {
          e.stopPropagation();
          const j = i + d;
          if (j < 0 || j >= data.magazines.length) return;
          [data.magazines[i], data.magazines[j]] = [data.magazines[j], data.magazines[i]];
          markDirty('magazines');
          drawList();
        };
        list.append(h('div', { class: 'mag-item' + (sel ? ' sel' : ''), role: 'button', tabindex: '0',
          onclick: () => { self.selectedId = m; rerender(); scrollToForm(); },
          onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.selectedId = m; rerender(); scrollToForm(); } } },
          h('div', { class: 'txt' },
            h('span', { class: 'ttl' }, m.title || '(제목 없음)'),
            h('span', { class: 'chip ' + (m.kind === 'tour' ? 'tour' : 'mag') }, kind.label),
            m.badge ? h('span', { class: 'chip' }, m.badge) : null),
          h('div', { class: 'ord' },
            h('button', { class: 'btn icon', type: 'button', title: '위로', disabled: i === 0, onclick: move(-1) }, '↑'),
            h('button', { class: 'btn icon', type: 'button', title: '아래로', disabled: i === data.magazines.length - 1, onclick: move(1) }, '↓'))));
      });
    };
    drawList();

    const layout = h('div', { class: 'mag-layout' },
      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', null, `글 목록 (${data.magazines.length})`), addBtn),
        list));
    const m = self.selected(data);
    if (m) layout.append(self.form(m, data, rerender));
    else layout.append(h('div', { class: 'empty' }, '목록에서 글을 고르거나 "매거진 추가"를 눌러 주세요.'));
    root.append(layout);
  },

  // selectedId 는 글 객체(새 글) 또는 id 문자열
  selected(data) {
    const s = this.selectedId;
    if (!s) return null;
    if (typeof s === 'object') return data.magazines.includes(s) ? s : null;
    return data.magazines.find((m) => m.id === s) || null;
  },

  form(m, data, rerender) {
    const self = this;
    const idx = data.magazines.indexOf(m);
    const isNew = self.isNew(m);
    const content = { editors: data.editors };

    const title = h('h2', null, m.title || '(제목 없음)');
    const appLink = h('a', { class: 'btn small', href: self.APP_URL + encodeURIComponent(m.id || ''), target: '_blank', rel: 'noopener' }, '앱에서 보기 ↗');
    const refreshLink = () => { appLink.href = self.APP_URL + encodeURIComponent(m.id || ''); };

    const idField = fieldText('id (주소에 쓰이는 이름)', m, 'id', {
      required: true, readonly: !isNew, placeholder: 'seongsu-daydrop',
      hint: isNew ? '영문 소문자·숫자·하이픈(-)만. 제목의 영문·숫자에서 자동으로 채워지고, 한 번 저장하면 바꿀 수 없습니다.' : '한 번 저장한 글의 id는 바꿀 수 없습니다.',
      onChange: (v) => { self.idTouched.add(m); m.id = String(v || '').trim().toLowerCase(); self.selectedId = m; refreshLink(); },
    });
    const idInput = idField.querySelector('input');

    const titleField = fieldText('제목', m, 'title', {
      required: true, placeholder: '성수 창고 쇼룸에서 고르는 한국 브랜드',
      onChange: (v) => {
        title.textContent = v || '(제목 없음)';
        const row = $$('.mag-item .ttl')[idx]; if (row) row.textContent = v || '(제목 없음)';
        if (isNew && !self.idTouched.has(m)) {
          const base = slugify(v);
          m.id = base === 'item' ? '' : self.uniqueId(data, base, m);
          idInput.value = m.id;
          idInput.classList.toggle('invalid', !m.id);
          refreshLink();
        }
      },
    });

    // 안내 정보 (label/value)
    const infoList = h('div');
    const drawInfo = () => {
      infoList.innerHTML = '';
      if (!m.info.length) infoList.append(h('div', { class: 'empty' }, '안내 정보가 없습니다. 투어라면 만나는 시간·장소 같은 것을 넣어 주세요.'));
      m.info.forEach((row, i) => {
        infoList.append(h('div', { class: 'card sub' },
          h('div', { class: 'card-head' }, h('h3', null, h('span', { class: 'idx' }, i + 1), row.label || '항목'), orderButtons(m.info, i, drawInfo)),
          h('div', { class: 'grid2' },
            fieldText('항목 이름', row, 'label', { placeholder: '만나는 시간' }),
            fieldText('내용', row, 'value', { placeholder: '오후 1시' }))));
      });
    };
    drawInfo();

    // 섹션
    const secList = h('div');
    const drawSections = () => {
      secList.innerHTML = '';
      if (!m.sections.length) secList.append(h('div', { class: 'empty' }, '섹션이 없습니다. 본문 아래에 사진과 함께 소개할 내용이 있으면 추가해 주세요.'));
      m.sections.forEach((s, i) => {
        const head = h('h3', null, h('span', { class: 'idx' }, i + 1), s.heading || '섹션');
        secList.append(h('div', { class: 'card sub' },
          h('div', { class: 'card-head' }, head, orderButtons(m.sections, i, drawSections)),
          h('div', { class: 'grid2' },
            fieldText('소제목', s, 'heading', { required: true, placeholder: '브랜드 이름', onChange: (v) => { head.lastChild.textContent = v || '섹션'; } }),
            fieldText('부제', s, 'sub', { placeholder: '한 줄 설명' })),
          fieldImage('사진', s, 'image', { slug: () => `mag-${m.id || 'new'}-${i + 1}` }),
          fieldText('본문', s, 'body', { textarea: true, rows: 5, placeholder: '섹션 내용', hint: '빈 줄 = 문단 나누기' }),
          h('div', { class: 'grid2' },
            fieldText('링크', s, 'link', { placeholder: 'shop.html?id=12 또는 https://…' }),
            fieldText('링크 글자', s, 'link_label', { placeholder: '매장 보기' }))));
      });
    };
    drawSections();

    const card = h('div', { class: 'card mag-form', id: 'mag-form' },
      h('div', { class: 'card-head' }, title,
        h('div', { class: 'actions' },
          appLink,
          h('button', { class: 'btn small danger', type: 'button', onclick: () => {
            const used = self.homeReferences(m.id);
            if (used.length) { alert(`이 글은 메인 화면에서 쓰이고 있어 지울 수 없습니다. 먼저 메인 화면에서 다른 글로 바꿔 주세요.\n\n- ${used.join('\n- ')}`); return; }
            if (!confirm(`"${m.title || '이 글'}"을 삭제할까요? 저장을 누르면 앱에서도 사라집니다.`)) return;
            data.magazines.splice(idx, 1);
            self.selectedId = null;
            markDirty('magazines');
            rerender();
          } }, '삭제'),
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => { self.selectedId = null; rerender(); } }, '닫기'))),
      h('div', { class: 'grid2' },
        fieldSelect('종류', m, 'kind', self.KINDS, { required: true }),
        idField),
      h('div', { class: 'grid2' },
        fieldText('배지', m, 'badge', { placeholder: 'Day Drop', hint: '대표 사진 위에 작게 나오는 글자' }),
        fieldEditor('에디터', m, 'editor', content)),
      titleField,
      fieldImage('대표 사진', m, 'hero', { required: true, slug: () => 'mag-' + (m.id || slugify(m.title)) }),
      h('div', { class: 'grid3' },
        fieldText('날짜 표시', m, 'date', { placeholder: '10. 12', hint: '적은 그대로 보입니다.' }),
        fieldText('가격', m, 'price', { placeholder: '128,000원~' }),
        fieldText('가격 부가 설명', m, 'note', { placeholder: '4인 기준' })),
      fieldText('한 줄 요약', m, 'summary', { textarea: true, rows: 2, placeholder: '에디터와 함께 성수 숨은 디자이너 브랜드 스튜디오 5곳을 돌아보는 투어' }),
      h('div', { class: 'field' },
        h('div', { class: 'card-head' }, labelEl('안내 정보'),
          h('button', { class: 'btn small', type: 'button', onclick: () => { m.info.push({ label: '', value: '' }); markDirty('magazines'); drawInfo(); } }, '+ 항목 추가')),
        infoList),
      fieldText('본문', m, 'intro', { textarea: true, rows: 12, placeholder: '안녕하세요, 에디터H입니다.', hint: '빈 줄 = 문단 나누기' }),
      h('div', { class: 'field' },
        h('div', { class: 'card-head' }, labelEl('섹션 목록'),
          h('button', { class: 'btn small', type: 'button', onclick: () => { m.sections.push({ heading: '', sub: '', image: '', body: '', link: '', link_label: '' }); markDirty('magazines'); drawSections(); } }, '+ 섹션 추가')),
        secList),
      h('div', { class: 'grid2' },
        fieldText('관련 버튼 글자', m, 'related_label', { placeholder: '관련 매장 보기', hint: '비워 두면 버튼이 안 보입니다.' }),
        fieldText('관련 버튼 링크', m, 'related_link', { placeholder: 'search.html' })),
      h('div', { class: 'grid2' },
        fieldText('하단 버튼 글자', m, 'cta_label', { placeholder: 'Instagram에서 보기', hint: '화면 아래 고정 버튼' }),
        fieldText('하단 버튼 링크', m, 'cta_link', { placeholder: 'https://instagram.com/…' })));
    return card;
  },
};
