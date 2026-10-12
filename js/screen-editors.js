/* 에디터 화면 */
App.screens.editors = {
  files: ['content', 'magazines'], // 에디터가 매거진에서 쓰이는지 보려면 매거진도 읽어야 한다

  // 에디터 id가 어디서 쓰이는지
  references(content, id) {
    const refs = [];
    const home = content.home || {};
    if (home.today && home.today.editor === id) refs.push('메인 화면 › 오늘의 추천');
    ((home.feed && home.feed.items) || []).forEach((it, i) => { if (it.editor === id) refs.push(`메인 화면 › 큐레이션 피드 ${i + 1}번 "${(it.title || '').replace(/\n/g, ' ')}"`); });
    ((home.picks && home.picks.items) || []).forEach((it, i) => { if (it.editor === id) refs.push(`메인 화면 › 에디터’s PICK ${i + 1}번 "${it.title || ''}"`); });
    // 홈 카드는 이제 매거진을 가리키므로, 매거진 글의 에디터도 본다(매거진 화면을 연 적이 있을 때만 데이터가 있다)
    const mags = (App.files.magazines && App.files.magazines.data && App.files.magazines.data.magazines) || [];
    mags.forEach((m) => { if (m.editor === id) refs.push(`매거진 › "${m.title || m.id}"`); });
    return refs;
  },

  validate() {
    const c = App.files.content.data;
    const errors = [];
    // content 파일은 메인 화면 값도 같이 올라가므로, 메인 화면 검사도 함께 돌려 덜 된 값(매거진 안 고른 카드)이 저장되지 않게 한다
    if (App.screens.home && App.files.magazines && App.files.magazines.data) errors.push(...App.screens.home.validate());
    const ids = new Set();
    (c.editors || []).forEach((e, i) => {
      if (!e.name || !e.name.trim()) errors.push(`${i + 1}번 에디터: 닉네임을 적어 주세요.`);
      if (!e.id) errors.push(`${i + 1}번 에디터: id가 비어 있습니다.`);
      if (ids.has(e.id)) errors.push(`에디터 id "${e.id}"가 중복됩니다.`);
      ids.add(e.id);
    });
    return errors;
  },

  uniqueId(content, base) {
    let id = base || 'editor', n = 2;
    const ids = new Set((content.editors || []).map((e) => e.id));
    while (ids.has(id)) id = `${base}-${n++}`;
    return id;
  },

  render(root) {
    UI.file = 'content';
    const content = App.files.content.data;
    if (!Array.isArray(content.editors)) content.editors = [];
    const self = this;
    const rerender = () => { root.innerHTML = ''; self.render(root); };

    root.append(screenHead('에디터', '큐레이션에 이름이 나가는 에디터 목록입니다. id는 한 번 만들면 바꿀 수 없습니다.', 'content',
      () => App.save('content', () => self.validate())));
    root.append(h('div', { id: 'errbox' }));

    if (!content.editors.length) root.append(h('div', { class: 'empty' }, '아직 에디터가 없습니다.'));

    content.editors.forEach((ed, i) => {
      const refs = self.references(content, ed.id);
      const card = h('div', { class: 'card' },
        h('div', { class: 'card-head' },
          h('h2', null, h('span', { class: 'idx' }, i + 1), ed.name || '(이름 없음)'),
          h('div', { class: 'actions' },
            h('button', { class: 'btn small danger', type: 'button', onclick: () => {
              if (refs.length) {
                alert(`이 에디터는 아래에서 쓰이고 있어 지울 수 없습니다. 먼저 해당 항목의 에디터를 바꿔 주세요.\n\n- ${refs.join('\n- ')}`);
                return;
              }
              if (!confirm(`"${ed.name}" 에디터를 삭제할까요?`)) return;
              content.editors.splice(i, 1);
              markDirty('content');
              rerender();
            } }, '삭제'))),
        fieldImage('프로필 사진', ed, 'avatar', { round: true, slug: () => 'editor-' + ed.id, hint: '정사각형 사진이 좋습니다. 비워 두면 앱에서 기본 모양으로 나옵니다.' }),
        h('div', { class: 'grid2' },
          fieldText('닉네임', ed, 'name', { required: true, placeholder: '에디터H', onChange: (v) => { card.querySelector('h2').lastChild.textContent = v || '(이름 없음)'; } }),
          fieldText('id', ed, 'id', { readonly: true, hint: '피드·PICK 항목에서 이 id로 에디터를 가리킵니다.' })),
        refs.length ? h('div', { class: 'muted small' }, '쓰이는 곳:', h('ul', { class: 'ref-list' }, refs.map((r) => h('li', null, r)))) : h('div', { class: 'muted small' }, '아직 쓰이는 곳이 없습니다.'));
      root.append(card);
    });

    // 새 에디터
    const draft = { name: '' };
    const nameInput = h('input', { type: 'text', placeholder: '닉네임 (예: 에디터J)', oninput: (e) => { draft.name = e.target.value; } });
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, '에디터 추가')),
      h('div', { class: 'grid2' },
        h('label', { class: 'field' }, labelEl('닉네임', true), nameInput, h('span', { class: 'hint' }, 'id는 닉네임의 영문·숫자에서 자동으로 만듭니다. (한글만 있으면 editor, editor-2 …)')),
        h('div', { class: 'field' }, labelEl(' '), h('button', { class: 'btn', type: 'button', onclick: () => {
          const name = draft.name.trim();
          if (!name) { toast('닉네임을 적어 주세요.', 'err'); nameInput.focus(); return; }
          const base = slugify(name);
          const id = self.uniqueId(content, base === 'item' ? 'editor' : base);
          content.editors.push({ id, name, avatar: '' });
          markDirty('content');
          rerender();
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } }, '+ 추가')))));
  },
};
