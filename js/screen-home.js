/* 메인 화면 */
const COLORS = [
  { id: 'blush', label: '블러시', hex: '#e8b4b8' },
  { id: 'beige', label: '베이지', hex: '#d8c3a5' },
  { id: 'jade', label: '제이드', hex: '#8fa693' },
  { id: 'terracotta', label: '테라코타', hex: '#c97b5c' },
];

App.screens.home = {
  files: ['content'],

  ensure(content) {
    content.home = content.home || {};
    const hm = content.home;
    hm.today = hm.today || { eyebrow: '', title: '', image: '', price: '', note: '', editor: '', cta: '', link: '' };
    hm.tours = hm.tours || { title: '투어 종류', items: [], soonLabel: '' };
    hm.tours.items = hm.tours.items || [];
    hm.feed = hm.feed || { title: '에디터 큐레이션 피드', items: [] };
    hm.feed.items = hm.feed.items || [];
    hm.picks = hm.picks || { title: '에디터’s PICK', items: [] };
    hm.picks.items = hm.picks.items || [];
  },

  validate() {
    const c = App.files.content.data;
    this.ensure(c);
    const hm = c.home, errors = [];
    const ids = new Set((c.editors || []).map((e) => e.id));
    if (!hm.today.title || !hm.today.title.trim()) errors.push('오늘의 추천: 제목을 적어 주세요.');
    if (!hm.today.image) errors.push('오늘의 추천: 사진이 필요합니다.');
    if (hm.today.editor && !ids.has(hm.today.editor)) errors.push('오늘의 추천: 없는 에디터를 가리키고 있습니다.');
    hm.tours.items.forEach((t, i) => {
      if (!t.tier || !t.tier.trim()) errors.push(`투어 종류 ${i + 1}번: 등급 이름(예: DAY DROP)을 적어 주세요.`);
      if (!t.title || !t.title.trim()) errors.push(`투어 종류 ${i + 1}번: 제목을 적어 주세요.`);
    });
    hm.feed.items.forEach((it, i) => {
      if (!it.title || !it.title.trim()) errors.push(`큐레이션 피드 ${i + 1}번: 제목을 적어 주세요.`);
      if (!it.image) errors.push(`큐레이션 피드 ${i + 1}번: 사진이 필요합니다.`);
      if (!COLORS.some((cc) => cc.id === it.color)) errors.push(`큐레이션 피드 ${i + 1}번: 카드 색을 골라 주세요.`);
      if (it.editor && !ids.has(it.editor)) errors.push(`큐레이션 피드 ${i + 1}번: 없는 에디터를 가리키고 있습니다.`);
    });
    hm.picks.items.forEach((it, i) => {
      if (!it.title || !it.title.trim()) errors.push(`에디터’s PICK ${i + 1}번: 제목을 적어 주세요.`);
      if (!it.image) errors.push(`에디터’s PICK ${i + 1}번: 사진이 필요합니다.`);
      if (it.editor && !ids.has(it.editor)) errors.push(`에디터’s PICK ${i + 1}번: 없는 에디터를 가리키고 있습니다.`);
    });
    return errors;
  },

  // 미리보기 카드: 앱과 같은 구조·크기(440px)로 그린 뒤 절반으로 줄여 보여 준다
  preview(item, content, kind) {
    const box = h('div', { class: 'pv-box' });
    const inner = h('div', { class: 'pv-scale' });
    const esc = (v) => String(v == null ? '' : v);
    const br = (v) => esc(v).split('\n').map((t, i) => (i ? [h('br'), t] : t)).flat();
    const draw = () => {
      inner.innerHTML = '';
      const ed = (content.editors || []).find((e) => e.id === item.editor);
      const avatar = ed && ed.avatar
        ? h('img', { class: 'pv-av', src: imageUrl(ed.avatar), alt: '' })
        : h('span', { class: 'pv-av' });
      const editor = h('div', { class: 'pv-ed' }, avatar, h('span', { class: 'pv-ed-name' }, ed ? ed.name : ''));
      const img = item.image ? h('img', { class: 'pv-img', src: imageUrl(item.image), alt: '' }) : h('div', { class: 'pv-img pv-img--empty' });
      if (kind === 'feed') {
        inner.append(h('div', { class: 'pv-feed pv-feed--' + (item.color || 'blush') },
          h('h2', { class: 'pv-feed-title' }, ...br(item.title || '제목')),
          h('div', { class: 'pv-photo pv-photo--card' }, img, h('div', { class: 'pv-shade pv-shade--top' }),
            h('div', { class: 'pv-top' },
              h('div', { class: 'pv-price-row' }, h('p', { class: 'pv-price' }, esc(item.price)), item.badge ? h('span', { class: 'pv-badge' }, esc(item.badge)) : null),
              editor))));
      } else {
        inner.append(h('div', { class: 'pv-pick' },
          h('div', { class: 'pv-photo pv-photo--pick' }, img, h('div', { class: 'pv-shade' }), editor),
          h('div', { class: 'pv-pick-text' },
            h('h2', { class: 'pv-pick-title' }, esc(item.title || '제목')),
            h('div', { class: 'pv-pick-price' }, h('span', { class: 'pv-pick-value' }, esc(item.price)), item.note ? h('span', { class: 'pv-pick-note' }, esc(item.note)) : null))));
      }
      // 줄인 만큼 바깥 상자 높이를 맞춘다
      requestAnimationFrame(() => { box.style.height = Math.round(inner.offsetHeight / 2) + 'px'; });
    };
    draw();
    box.append(inner);
    box.redraw = draw;
    return h('div', { class: 'preview-wrap' }, box, h('span', { class: 'cap' }, '앱 미리보기 (절반 크기)'));
  },

  colorPicker(item, onChange) {
    const file = UI.file;
    const wrap = h('div', { class: 'swatches' });
    const draw = () => {
      wrap.innerHTML = '';
      COLORS.forEach((c) => wrap.append(h('button', { type: 'button', class: 'swatch' + (item.color === c.id ? ' on' : ''), 'data-c': c.id, title: `${c.label} ${c.hex}`,
        onclick: () => { item.color = c.id; markDirty(file); draw(); onChange && onChange(); } })));
    };
    draw();
    return h('div', { class: 'field' }, labelEl('카드 색', true), wrap);
  },

  render(root) {
    UI.file = 'content';
    const content = App.files.content.data;
    this.ensure(content);
    const hm = content.home;
    const self = this;
    const rerender = () => { const y = window.scrollY; root.innerHTML = ''; self.render(root); window.scrollTo(0, y); };

    root.append(screenHead('메인 화면', '앱을 열면 처음 보이는 화면입니다. 제목 칸에서 줄을 바꾸면 앱에서도 그대로 줄이 바뀝니다.', 'content',
      () => App.save('content', () => self.validate())));
    root.append(h('div', { id: 'errbox' }));

    // 1. 오늘의 추천
    const t = hm.today;
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, '오늘의 추천')),
      h('div', { class: 'grid2' },
        fieldText('작은 머리글', t, 'eyebrow', { placeholder: '오늘의 추천' }),
        fieldEditor('에디터', t, 'editor', content)),
      fieldText('제목', t, 'title', { required: true, textarea: true, rows: 2, placeholder: '디자이너 스튜디오와\n플래그십 투어' }),
      fieldImage('사진', t, 'image', { required: true, slug: 'today' }),
      h('div', { class: 'grid3' },
        fieldText('가격', t, 'price', { placeholder: '128,000원~' }),
        fieldText('부가 설명', t, 'note', { placeholder: '4인 기준' }),
        fieldText('버튼 글자', t, 'cta', { placeholder: '예약하기' })),
      fieldText('버튼 누르면 가는 곳', t, 'link', { placeholder: 'magazine.html', hint: '앱 안의 페이지 파일명이나 외부 주소(https://…)' })));

    // 2. 투어 종류
    const tours = hm.tours;
    const tourList = h('div');
    const drawTours = () => {
      tourList.innerHTML = '';
      if (!tours.items.length) tourList.append(h('div', { class: 'empty' }, '투어가 없습니다.'));
      tours.items.forEach((it, i) => {
        tourList.append(h('div', { class: 'card sub' },
          h('div', { class: 'card-head' }, h('h3', null, h('span', { class: 'idx' }, i + 1), it.tier || '투어'), orderButtons(tours.items, i, drawTours)),
          h('div', { class: 'grid3' },
            fieldText('등급 이름', it, 'tier', { required: true, placeholder: 'DAY DROP' }),
            fieldText('제목', it, 'title', { required: true, placeholder: '3시간 동행 쇼핑 큐레이션' }),
            fieldText('가격', it, 'price', { placeholder: '128,000원 부터' })),
          fieldToggle('지금 예약 가능 (끄면 "추후 확장"으로 표시)', it, 'open')));
      });
    };
    drawTours();
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, '투어 종류'),
        h('button', { class: 'btn small', type: 'button', onclick: () => { tours.items.push({ tier: '', title: '', price: '', open: false }); markDirty('content'); drawTours(); } }, '+ 투어 추가')),
      h('div', { class: 'grid2' },
        fieldText('섹션 제목', tours, 'title', { placeholder: '투어 종류' }),
        fieldText('준비 중 표시 글자', tours, 'soonLabel', { placeholder: '추후 확장' })),
      tourList));

    // 3. 에디터 큐레이션 피드
    const feed = hm.feed;
    const feedList = h('div');
    const drawFeed = () => {
      feedList.innerHTML = '';
      if (!feed.items.length) feedList.append(h('div', { class: 'empty' }, '피드 카드가 없습니다.'));
      feed.items.forEach((it, i) => {
        const pv = self.preview(it, content, 'feed');
        const redraw = () => pv.firstChild.redraw();
        feedList.append(h('div', { class: 'card sub' },
          h('div', { class: 'card-head' }, h('h3', null, h('span', { class: 'idx' }, i + 1), (it.title || '카드').replace(/\n/g, ' ')), orderButtons(feed.items, i, drawFeed)),
          h('div', { class: 'item-row' },
            h('div', null,
              self.colorPicker(it, redraw),
              fieldText('제목', it, 'title', { required: true, textarea: true, rows: 2, placeholder: '셀럽이 입어서\n유명한 브랜드', onChange: redraw }),
              fieldImage('사진', it, 'image', { required: true, slug: () => 'feed-' + slugify(it.title), onChange: redraw }),
              h('div', { class: 'grid2' },
                fieldText('가격', it, 'price', { placeholder: '128,000원~', onChange: redraw }),
                fieldText('배지', it, 'badge', { placeholder: 'Day Drop', onChange: redraw })),
              h('div', { class: 'grid2' },
                fieldEditor('에디터', it, 'editor', content, { onChange: redraw }),
                fieldText('누르면 가는 곳', it, 'link', { placeholder: 'magazine.html' }))),
            pv)));
      });
    };
    drawFeed();
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, '에디터 큐레이션 피드'),
        h('button', { class: 'btn small', type: 'button', onclick: () => { feed.items.push({ color: 'blush', title: '', image: '', price: '', badge: '', editor: (content.editors[0] || {}).id || '', link: '' }); markDirty('content'); drawFeed(); } }, '+ 카드 추가')),
      fieldText('섹션 제목', feed, 'title', { placeholder: '에디터 큐레이션 피드' }),
      feedList));

    // 4. 에디터's PICK
    const picks = hm.picks;
    const pickList = h('div');
    const drawPicks = () => {
      pickList.innerHTML = '';
      if (!picks.items.length) pickList.append(h('div', { class: 'empty' }, 'PICK 항목이 없습니다.'));
      picks.items.forEach((it, i) => {
        const pv = self.preview(it, content, 'pick');
        const redraw = () => pv.firstChild.redraw();
        pickList.append(h('div', { class: 'card sub' },
          h('div', { class: 'card-head' }, h('h3', null, h('span', { class: 'idx' }, i + 1), it.title || 'PICK'), orderButtons(picks.items, i, drawPicks)),
          h('div', { class: 'item-row' },
            h('div', null,
              fieldText('제목', it, 'title', { required: true, placeholder: '성수 공장 골목의 쇼룸 산책', onChange: redraw }),
              fieldImage('사진', it, 'image', { required: true, slug: () => 'pick-' + slugify(it.title), onChange: redraw }),
              h('div', { class: 'grid2' },
                fieldText('가격', it, 'price', { placeholder: '￦128,000 ~', onChange: redraw }),
                fieldText('부가 설명', it, 'note', { placeholder: '4인 기준', onChange: redraw })),
              h('div', { class: 'grid2' },
                fieldEditor('에디터', it, 'editor', content, { onChange: redraw }),
                fieldText('누르면 가는 곳', it, 'link', { placeholder: '비워 두면 눌러도 이동하지 않음' }))),
            pv)));
      });
    };
    drawPicks();
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, '에디터’s PICK'),
        h('button', { class: 'btn small', type: 'button', onclick: () => { picks.items.push({ title: '', image: '', price: '', note: '', editor: (content.editors[0] || {}).id || '', link: '' }); markDirty('content'); drawPicks(); } }, '+ 항목 추가')),
      fieldText('섹션 제목', picks, 'title', { placeholder: '에디터’s PICK' }),
      pickList));
  },
};
