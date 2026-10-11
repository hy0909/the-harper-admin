/* 앱 뼈대: 로그인, 탭, 불러오기/저장, 수정됨 표시 */
const App = {
  user: null,
  tab: 'home',
  loadedAt: Date.now(),
  files: {
    content: { path: 'data/content.json', data: null, sha: null, dirty: false, label: '메인 화면·에디터' },
    shops:   { path: 'data/shops.json',   data: null, sha: null, dirty: false, label: '지도 샵' },
  },
  screens: {}, // 각 화면 모듈이 등록: { render(root), validate() }

  async init() {
    $('#login-form').addEventListener('submit', (e) => { e.preventDefault(); this.login(); });
    $('#logout').addEventListener('click', () => this.logout());
    $$('#tabs .tab').forEach((b) => b.addEventListener('click', () => this.showTab(b.dataset.tab)));
    window.addEventListener('beforeunload', (e) => {
      if (Object.values(this.files).some((f) => f.dirty)) { e.preventDefault(); e.returnValue = ''; }
    });
    window.addEventListener('hashchange', () => {
      const t = location.hash.slice(1);
      if (this.screens[t] && t !== this.tab && this.user) this.showTab(t, true);
    });

    if (GH.token()) {
      try {
        const { user } = await GH.validate(GH.token());
        this.enter(user);
      } catch (e) {
        GH.clearToken();
        this.showLogin(GH.errorMessage(e));
      }
    } else {
      this.showLogin();
    }
  },

  showLogin(msg) {
    $('#app').classList.add('hidden');
    $('#login').classList.remove('hidden');
    const err = $('#login-error');
    if (msg) { err.textContent = msg; err.classList.remove('hidden'); } else err.classList.add('hidden');
  },

  async login() {
    const input = $('#login-token');
    const token = input.value.trim();
    const btn = $('#login-btn'), err = $('#login-error');
    err.classList.add('hidden');
    if (!token) return;
    btn.disabled = true; btn.textContent = '확인 중…';
    try {
      const { user, repo } = await GH.validate(token);
      if (repo.permissions && repo.permissions.push === false) {
        throw Object.assign(new Error('이 토큰은 읽기만 가능합니다. Contents: Read and write 권한이 필요합니다.'), { status: 403 });
      }
      GH.setToken(token);
      input.value = '';
      this.enter(user);
    } catch (e) {
      err.textContent = GH.errorMessage(e);
      err.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = '로그인';
    }
  },

  logout() {
    if (Object.values(this.files).some((f) => f.dirty) && !confirm('저장하지 않은 내용이 있습니다. 그래도 로그아웃할까요?')) return;
    GH.clearToken();
    this.user = null;
    for (const f of Object.values(this.files)) { f.data = null; f.sha = null; f.dirty = false; }
    $('#screen').innerHTML = '';
    this.showLogin();
  },

  async enter(user) {
    this.user = user;
    $('#user-login').textContent = user.login;
    $('#user-avatar').src = user.avatar_url || '';
    $('#login').classList.add('hidden');
    $('#app').classList.remove('hidden');
    const t = location.hash.slice(1);
    this.showTab(this.screens[t] ? t : 'home', true);
  },

  async load(file, force) {
    const f = this.files[file];
    if (f.data && !force) return f;
    const { json, sha } = await GH.getJSON(f.path);
    f.data = json; f.sha = sha; f.dirty = false;
    this.loadedAt = Date.now();
    this.refreshStatus(file);
    return f;
  },

  setDirty(file, v) {
    this.files[file].dirty = v;
    this.refreshStatus(file);
  },

  refreshStatus(file, text) {
    const f = this.files[file];
    $$(`.dot[data-dirty="${file}"]`).forEach((d) => d.classList.toggle('on', f.dirty));
    const s = $(`.status[data-status="${file}"]`);
    if (s) {
      if (text) { s.textContent = text; s.className = 'status ok'; }
      else if (f.dirty) { s.textContent = '저장 안 됨'; s.className = 'status dirty'; }
      else { s.textContent = '변경 없음'; s.className = 'status'; }
    }
    const b = $(`[data-save="${file}"]`);
    if (b) b.disabled = !f.dirty;
  },

  async showTab(tab, silent) {
    const screen = this.screens[tab];
    if (!screen) return;
    this.tab = tab;
    if (!silent) location.hash = tab;
    else history.replaceState(null, '', '#' + tab);
    $$('#tabs .tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    const root = $('#screen');
    root.innerHTML = '';
    root.append(h('div', { class: 'loading' }, '불러오는 중…'));
    try {
      for (const file of screen.files) await this.load(file);
      root.innerHTML = '';
      screen.render(root);
      screen.files.forEach((f) => this.refreshStatus(f));
    } catch (e) {
      root.innerHTML = '';
      root.append(h('div', { class: 'empty' },
        h('p', null, '불러오지 못했습니다: ' + GH.errorMessage(e)),
        h('button', { class: 'btn', onclick: () => this.showTab(tab, true) }, '다시 시도')));
      if (e.status === 401) { GH.clearToken(); this.showLogin(GH.errorMessage(e)); }
    }
  },

  // 화면 하나의 파일 저장
  async save(file, validate, message) {
    const f = this.files[file];
    const errors = validate ? validate() : [];
    const box = $('#errbox');
    if (box) { box.innerHTML = ''; if (errors.length) box.append(errorList(errors)); }
    if (errors.length) { toast('입력을 확인해 주세요.', 'err'); window.scrollTo({ top: 0, behavior: 'smooth' }); return false; }

    const btn = $(`[data-save="${file}"]`);
    if (btn) { btn.disabled = true; btn.textContent = '저장 중…'; }
    try {
      const text = JSON.stringify(f.data, null, 2) + '\n';
      f.sha = await GH.putText(f.path, text, message || `관리자: ${f.label} 수정`, f.sha);
      f.dirty = false;
      this.loadedAt = Date.now();
      this.refreshStatus(file, '저장됨 — 1~2분 뒤 앱에 반영');
      toast('저장했습니다. 1~2분 뒤 앱에 반영됩니다.', 'ok');
      return true;
    } catch (e) {
      if (e.status === 409 || e.status === 422) {
        alert('다른 사람이 먼저 저장해서 이 화면의 내용을 다시 불러옵니다. 방금 고친 내용은 사라지니 다시 입력해 주세요.');
        try { await this.load(file, true); } catch (_) {}
        this.showTab(this.tab, true);
      } else if (e.status === 401) {
        GH.clearToken(); this.showLogin(GH.errorMessage(e));
      } else {
        toast('저장 실패: ' + GH.errorMessage(e), 'err');
      }
      return false;
    } finally {
      if (btn) { btn.textContent = '저장'; btn.disabled = !f.dirty; }
    }
  },
};

window.addEventListener('DOMContentLoaded', () => App.init());
