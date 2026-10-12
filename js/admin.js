/* 앱 뼈대: 로그인, 탭, 불러오기/저장, 수정됨 표시 */
const App = {
  user: null,
  tab: 'home',
  loadedAt: Date.now(),
  files: {
    content: { data: null, saved: null, dirty: false, label: '메인 화면·에디터' },
    magazines: { data: null, saved: null, dirty: false, label: '매거진' },
    shops:   { data: null, saved: null, dirty: false, label: '매장' },
  },
  screens: {}, // 각 화면 모듈이 등록: { render(root), validate() }

  init() {
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
    return this.start();
  },

  // 설정 확인 → 저장된 세션이 있으면 바로 들어감
  async start() {
    let client;
    try { client = DB.init(); } catch (e) { this.showLogin(e.message, true); return; }
    if (!client) { this.showLogin('설정에 anon 키가 없습니다. js/config.js의 anonKey를 채워 주세요.', true); return; }
    DB.onAuthChange((event) => {
      if (event === 'SIGNED_OUT' && this.user) this.leave('로그아웃되었습니다. 다시 로그인해 주세요.');
    });
    try {
      const user = await DB.currentUser();
      if (user) this.enter(user); else this.showLogin();
    } catch (e) {
      this.showLogin(DB.errorMessage(e));
    }
  },

  showLogin(msg, disabled) {
    $('#app').classList.add('hidden');
    $('#login').classList.remove('hidden');
    const err = $('#login-error');
    if (msg) { err.textContent = msg; err.classList.remove('hidden'); } else err.classList.add('hidden');
    $$('#login-form input, #login-form button').forEach((el) => { el.disabled = !!disabled; });
  },

  async login() {
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    const btn = $('#login-btn'), err = $('#login-error');
    err.classList.add('hidden');
    if (!email || !password) return;
    btn.disabled = true; btn.textContent = '확인 중…';
    try {
      const user = await DB.signIn(email, password);
      $('#login-password').value = '';
      this.enter(user);
    } catch (e) {
      err.textContent = DB.errorMessage(e);
      err.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = '로그인';
    }
  },

  async logout() {
    if (Object.values(this.files).some((f) => f.dirty) && !confirm('저장하지 않은 내용이 있습니다. 그래도 로그아웃할까요?')) return;
    await DB.signOut();
    this.leave();
  },

  // 화면 비우고 로그인 화면으로
  leave(msg) {
    this.user = null;
    for (const f of Object.values(this.files)) { f.data = null; f.saved = null; f.dirty = false; }
    $('#screen').innerHTML = '';
    this.showLogin(msg);
  },

  enter(user) {
    this.user = user;
    $('#user-login').textContent = user.email || '';
    $('#login').classList.add('hidden');
    $('#app').classList.remove('hidden');
    const t = location.hash.slice(1);
    this.showTab(this.screens[t] ? t : 'home', true);
  },

  async load(file, force) {
    const f = this.files[file];
    if (f.data && !force) return f;
    const data = await DB.load(file);
    f.data = data; f.saved = deepClone(data); f.dirty = false;
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
        h('p', null, '불러오지 못했습니다: ' + DB.errorMessage(e)),
        h('button', { class: 'btn', onclick: () => this.showTab(tab, true) }, '다시 시도')));
      if (DB.isAuthError(e)) { await DB.signOut(); this.leave(DB.errorMessage(e)); }
    }
  },

  // 화면 하나의 데이터 저장
  async save(file, validate) {
    const f = this.files[file];
    const errors = validate ? validate() : [];
    const box = $('#errbox');
    if (box) { box.innerHTML = ''; if (errors.length) box.append(errorList(errors)); }
    if (errors.length) { toast('입력을 확인해 주세요.', 'err'); window.scrollTo({ top: 0, behavior: 'smooth' }); return false; }

    const btn = $(`[data-save="${file}"]`);
    if (btn) { btn.disabled = true; btn.textContent = '저장 중…'; }
    try {
      await DB.save(file, f.data, f.saved);
      f.saved = deepClone(f.data);
      f.dirty = false;
      this.loadedAt = Date.now();
      this.refreshStatus(file, '저장됨 — 앱에 바로 반영돼요');
      toast('저장했습니다. 앱에 바로 반영돼요.', 'ok');
      return true;
    } catch (e) {
      if (DB.isAuthError(e)) {
        await DB.signOut(); this.leave(DB.errorMessage(e));
      } else {
        toast('저장 실패: ' + DB.errorMessage(e), 'err');
      }
      return false;
    } finally {
      if (btn) { btn.textContent = '저장'; btn.disabled = !f.dirty; }
    }
  },
};

window.addEventListener('DOMContentLoaded', () => App.init());
