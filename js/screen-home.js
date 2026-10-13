/* 메인 화면. 홈의 카드는 매거진 글(magazines 표의 id)을 가리킨다. 제목·사진·에디터는 매거진 화면에서 고친다 */
const COLORS = [
  { id: 'blush', label: '블러시', hex: '#e8b4b8' },
  { id: 'beige', label: '베이지', hex: '#d8c3a5' },
  { id: 'jade', label: '제이드', hex: '#8fa693' },
  { id: 'terracotta', label: '테라코타', hex: '#c97b5c' },
];

// 줄바꿈 제목 칸 안내 글
const TITLE_HINT = '비우면 매거진 제목 그대로. 줄을 바꾸면 앱에서도 그 자리에서 줄이 바뀝니다. 글자는 매거진 제목과 같아야 합니다';

// 옛 구조의 링크 "magazine.html?id=xxx" 에서 매거진 id만 꺼낸다
function magIdFromLink(link) {
  const m = /magazine\.html\?id=([^&#]+)/.exec(String(link || ''));
  if (!m) return '';
  try { return decodeURIComponent(m[1]); } catch (_) { return m[1]; }
}

App.screens.home = {
  files: ['content', 'magazines'],

  // 옛 구조(제목·사진·가격 등을 홈에 직접 적던 방식)를 새 구조로 옮긴다. 바뀐 게 있으면 true
  ensure(content) {
    const before = JSON.stringify(content.home || null);
    content.home = content.home || {};
    const hm = content.home;
    const keepOnly = (obj, keys) => { Object.keys(obj).forEach((k) => { if (!keys.includes(k)) delete obj[k]; }); };

    // 오늘의 추천: 머리글, 매거진 id, 줄바꿈 제목만 남긴다(옛 제목이 있으면 줄바꿈 제목으로 남긴다)
    hm.today = hm.today || {};
    if (hm.today.magazine == null) hm.today.magazine = magIdFromLink(hm.today.link);
    if (hm.today.eyebrow == null) hm.today.eyebrow = '';
    keepOnly(hm.today, ['eyebrow', 'magazine', 'title']);

    // 투어 종류: 항목마다 설명, 섹션에 안내 창 제목·한 줄
    hm.tours = hm.tours || { title: '투어 종류', items: [], soonLabel: '' };
    hm.tours.items = hm.tours.items || [];
    hm.tours.info = hm.tours.info || { title: '투어 종류 안내' };
    hm.tours.items.forEach((t) => { if (t.desc == null) t.desc = ''; });

    // 큐레이션 피드: 매거진 id, 카드 색, 줄바꿈 제목만 남긴다(옛 제목이 있으면 줄바꿈 제목으로 남긴다)
    hm.feed = hm.feed || { title: '에디터 큐레이션 피드', items: [] };
    hm.feed.items = hm.feed.items || [];
    hm.feed.items.forEach((it) => {
      if (it.magazine == null) it.magazine = magIdFromLink(it.link);
      keepOnly(it, ['magazine', 'color', 'title']);
    });

    // PICK: 매거진 id만 남긴다
    hm.picks = hm.picks || { title: '에디터’s PICK', items: [] };
    hm.picks.items = hm.picks.items || [];
    hm.picks.items.forEach((it) => {
      if (it.magazine == null) it.magazine = magIdFromLink(it.link);
      keepOnly(it, ['magazine']);
    });

    return JSON.stringify(content.home) !== before;
  },

  validate() {
    const c = App.files.content.data;
    this.ensure(c);
    const hm = c.home, errors = [];
    const mags = App.files.magazines.data.magazines || [];
    const magIds = new Set(mags.map((m) => m.id));
    const okMag = (id) => !!id && magIds.has(id);
    // 줄바꿈 제목: 비어 있으면 매거진 제목을 그대로 쓴다. 적었으면 줄바꿈·공백을 뺀 글자가 매거진 제목과 같아야 한다
    const sameText = (a, b) => String(a || '').replace(/\s/g, '') === String(b || '').replace(/\s/g, '');
    const checkTitle = (item, where) => {
      if (!String(item.title || '').trim()) return;
      const m = mags.find((x) => x.id === item.magazine);
      if (!m) return; // 매거진을 안 고른 경우는 아래 오류가 따로 알린다
      if (!sameText(item.title, m.title)) errors.push(`${where}: 줄바꿈 제목의 글자가 매거진 제목과 다릅니다(줄바꿈·띄어쓰기만 바꿀 수 있어요)`);
    };
    if (!okMag(hm.today.magazine)) errors.push('오늘의 추천: 매거진을 골라 주세요.');
    checkTitle(hm.today, '오늘의 추천');
    hm.tours.items.forEach((t, i) => {
      if (!t.tier || !t.tier.trim()) errors.push(`투어 종류 ${i + 1}번: 등급 이름(예: DAY DROP)을 적어 주세요.`);
      if (!t.title || !t.title.trim()) errors.push(`투어 종류 ${i + 1}번: 제목을 적어 주세요.`);
    });
    hm.feed.items.forEach((it, i) => {
      if (!okMag(it.magazine)) errors.push(`큐레이션 피드 ${i + 1}번: 매거진을 골라 주세요.`);
      checkTitle(it, `큐레이션 피드 ${i + 1}번`);
      if (!COLORS.some((cc) => cc.id === it.color)) errors.push(`큐레이션 피드 ${i + 1}번: 카드 색을 골라 주세요.`);
    });
    hm.picks.items.forEach((it, i) => {
      if (!okMag(it.magazine)) errors.push(`에디터’s PICK ${i + 1}번: 매거진을 골라 주세요.`);
    });
    return errors;
  },

  // 카드가 가리키는 매거진의 사진·제목·에디터 (+ 카드 색). 줄바꿈 제목이 있으면 그것을 쓴다
  viewOf(item, mags) {
    const m = mags.find((x) => x.id === item.magazine);
    if (!m) return { title: '매거진을 고르세요', image: '', editor: '', color: item.color };
    const title = String(item.title || '').trim() ? item.title : m.title;
    return { title, image: m.hero, editor: m.editor, color: item.color };
  },

  // 매거진을 고르거나 바꿨을 때 줄바꿈 제목 칸이 비어 있으면 매거진 제목으로 채운다
  fillTitle(obj, magId, mags, field) {
    if (String(obj.title || '').trim()) return;
    const m = mags.find((x) => x.id === magId);
    if (!m) return;
    obj.title = m.title || '';
    const ta = field.querySelector('textarea');
    if (ta) ta.value = obj.title;
    markDirty(UI.file);
  },

  // 매거진 고르기 목록: 값 = id, 글자 = 제목
  magOptions(mags) {
    return mags.filter((m) => m.id).map((m) => ({ value: m.id, label: m.title || '(제목 없음)' }));
  },

  // 미리보기 카드: 앱과 같은 구조·크기(440px)로 그린 뒤 절반으로 줄여 보여 준다. view()는 그릴 때마다 최신 값을 돌려준다
  preview(view, content, kind) {
    const box = h('div', { class: 'pv-box' });
    const inner = h('div', { class: 'pv-scale' });
    const esc = (v) => String(v == null ? '' : v);
    const br = (v) => esc(v).split('\n').map((t, i) => (i ? [h('br'), t] : t)).flat();
    const draw = () => {
      inner.innerHTML = '';
      const v = view();
      const ed = (content.editors || []).find((e) => e.id === v.editor);
      const avatar = ed && ed.avatar
        ? h('img', { class: 'pv-av', src: imageUrl(ed.avatar), alt: '' })
        : h('span', { class: 'pv-av' });
      const editor = h('div', { class: 'pv-ed' }, avatar, h('span', { class: 'pv-ed-name' }, ed ? ed.name : ''));
      const img = v.image ? h('img', { class: 'pv-img', src: imageUrl(v.image), alt: '' }) : h('div', { class: 'pv-img pv-img--empty' });
      if (kind === 'feed') {
        inner.append(h('div', { class: 'pv-feed pv-feed--' + (v.color || 'blush') },
          h('h2', { class: 'pv-feed-title' }, ...br(v.title || '제목')),
          h('div', { class: 'pv-photo pv-photo--card' }, img, h('div', { class: 'pv-shade pv-shade--top' }),
            h('div', { class: 'pv-top' }, editor))));
      } else {
        inner.append(h('div', { class: 'pv-pick' },
          h('div', { class: 'pv-photo pv-photo--pick' }, img, h('div', { class: 'pv-shade' }), editor),
          h('div', { class: 'pv-pick-text' }, h('h2', { class: 'pv-pick-title' }, ...br(v.title || '제목')))));
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
    if (this.ensure(content)) markDirty('content');
    const mags = App.files.magazines.data.magazines || [];
    const magOpts = this.magOptions(mags);
    const hm = content.home;
    const self = this;
    const rerender = () => { const y = window.scrollY; root.innerHTML = ''; self.render(root); window.scrollTo(0, y); };

    root.append(screenHead('메인 화면', '홈의 카드는 매거진 글을 가리킵니다. 제목·사진·에디터는 매거진 화면에서 고칩니다.', 'content',
      () => App.save('content', () => self.validate())));
    root.append(h('div', { id: 'errbox' }));

    // 1. 오늘의 추천
    const t = hm.today;
    const todayPv = self.preview(() => self.viewOf(t, mags), content, 'pick');
    const todayTitle = fieldText('줄바꿈 제목', t, 'title', { textarea: true, rows: 2, hint: TITLE_HINT, onChange: () => todayPv.firstChild.redraw() });
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, '오늘의 추천')),
      h('div', { class: 'item-row' },
        h('div', null,
          fieldText('작은 머리글', t, 'eyebrow', { placeholder: '오늘의 추천' }),
          fieldSelect('매거진', t, 'magazine', magOpts, { required: true, allowEmpty: true, emptyLabel: '매거진을 고르세요',
            hint: '매거진 화면의 글 가운데 고릅니다. 사진·제목·에디터는 그 글을 따릅니다.',
            onChange: (id) => { self.fillTitle(t, id, mags, todayTitle); todayPv.firstChild.redraw(); } }),
          todayTitle),
        todayPv)));

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
            fieldText('가격', it, 'price', { placeholder: '128,000원~' })),
          fieldText('설명', it, 'desc', { textarea: true, rows: 3, placeholder: '투어가 어떤 것인지 두세 문장으로 적어 주세요.' }),
          fieldToggle('지금 예약 가능 (끄면 "추후 확장"으로 표시)', it, 'open')));
      });
    };
    drawTours();
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, '투어 종류'),
        h('button', { class: 'btn small', type: 'button', onclick: () => { tours.items.push({ tier: '', title: '', price: '', open: false, desc: '' }); markDirty('content'); drawTours(); } }, '+ 투어 추가')),
      h('div', { class: 'grid2' },
        fieldText('섹션 제목', tours, 'title', { placeholder: '투어 종류' }),
        fieldText('준비 중 표시 글자', tours, 'soonLabel', { placeholder: '추후 공개' })),
      h('div', { class: 'grid2' },
        fieldText('안내 창 제목', tours.info, 'title', { placeholder: '투어 종류 안내' })),
      tourList));

    // 3. 에디터 큐레이션 피드
    const feed = hm.feed;
    const feedList = h('div');
    const drawFeed = () => {
      feedList.innerHTML = '';
      if (!feed.items.length) feedList.append(h('div', { class: 'empty' }, '피드 카드가 없습니다.'));
      feed.items.forEach((it, i) => {
        const pv = self.preview(() => self.viewOf(it, mags), content, 'feed');
        const redraw = () => pv.firstChild.redraw();
        const itemTitle = fieldText('줄바꿈 제목', it, 'title', { textarea: true, rows: 2, hint: TITLE_HINT, onChange: redraw });
        feedList.append(h('div', { class: 'card sub' },
          h('div', { class: 'card-head' }, h('h3', null, h('span', { class: 'idx' }, i + 1), self.viewOf(it, mags).title.replace(/\n/g, ' ')), orderButtons(feed.items, i, drawFeed)),
          h('div', { class: 'item-row' },
            h('div', null,
              self.colorPicker(it, redraw),
              fieldSelect('매거진', it, 'magazine', magOpts, { required: true, allowEmpty: true, emptyLabel: '매거진을 고르세요',
                onChange: (id) => { self.fillTitle(it, id, mags, itemTitle); redraw(); } }),
              itemTitle),
            pv)));
      });
    };
    drawFeed();
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, '에디터 큐레이션 피드'),
        h('button', { class: 'btn small', type: 'button', onclick: () => { feed.items.push({ magazine: '', color: 'blush', title: '' }); markDirty('content'); drawFeed(); } }, '+ 카드 추가')),
      fieldText('섹션 제목', feed, 'title', { placeholder: '에디터 큐레이션 피드' }),
      feedList));

    // 4. 에디터's PICK
    const picks = hm.picks;
    const pickList = h('div');
    const drawPicks = () => {
      pickList.innerHTML = '';
      if (!picks.items.length) pickList.append(h('div', { class: 'empty' }, 'PICK 항목이 없습니다.'));
      picks.items.forEach((it, i) => {
        const pv = self.preview(() => self.viewOf(it, mags), content, 'pick');
        const redraw = () => pv.firstChild.redraw();
        pickList.append(h('div', { class: 'card sub' },
          h('div', { class: 'card-head' }, h('h3', null, h('span', { class: 'idx' }, i + 1), self.viewOf(it, mags).title), orderButtons(picks.items, i, drawPicks)),
          h('div', { class: 'item-row' },
            h('div', null,
              fieldSelect('매거진', it, 'magazine', magOpts, { required: true, allowEmpty: true, emptyLabel: '매거진을 고르세요', onChange: redraw })),
            pv)));
      });
    };
    drawPicks();
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, '에디터’s PICK'),
        h('button', { class: 'btn small', type: 'button', onclick: () => { picks.items.push({ magazine: '' }); markDirty('content'); drawPicks(); } }, '+ 항목 추가')),
      fieldText('섹션 제목', picks, 'title', { placeholder: '에디터’s PICK' }),
      pickList));
  },
};
