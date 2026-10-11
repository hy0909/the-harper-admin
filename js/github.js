/* GitHub Contents API — 서버 없이 저장소 파일을 바로 읽고 씀 */
const GH = {
  api: 'https://api.github.com',
  repo: 'hy0909/the-harper-app',
  branch: 'main',
  TOKEN_KEY: 'harper_admin_token',

  token() { return localStorage.getItem(this.TOKEN_KEY) || ''; },
  setToken(t) { localStorage.setItem(this.TOKEN_KEY, t); },
  clearToken() { localStorage.removeItem(this.TOKEN_KEY); },

  async req(method, path, body, token) {
    const headers = {
      Authorization: 'Bearer ' + (token ?? this.token()),
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (body) headers['Content-Type'] = 'application/json';
    let res;
    try {
      res = await fetch(this.api + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch (e) {
      const err = new Error('네트워크 연결을 확인하세요.');
      err.status = 0;
      throw err;
    }
    let data = null;
    try { data = await res.json(); } catch (_) { /* 본문 없음 */ }
    if (!res.ok) {
      const err = new Error((data && data.message) || ('HTTP ' + res.status));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  // 토큰 검사: 사용자 + 저장소 접근 가능 여부
  async validate(token) {
    const user = await this.req('GET', '/user', null, token);
    const repo = await this.req('GET', `/repos/${this.repo}`, null, token);
    return { user, repo };
  },

  async getFile(path) {
    const d = await this.req('GET', `/repos/${this.repo}/contents/${path}?ref=${this.branch}&_=${Date.now()}`);
    return { text: b64decode(d.content), sha: d.sha };
  },

  async getJSON(path) {
    const f = await this.getFile(path);
    return { json: JSON.parse(f.text), sha: f.sha };
  },

  // 텍스트 저장 (sha 필수: 기존 파일 덮어쓰기)
  async putText(path, text, message, sha) {
    const body = { message, content: b64encode(text), branch: this.branch };
    if (sha) body.sha = sha;
    const d = await this.req('PUT', `/repos/${this.repo}/contents/${path}`, body);
    return d.content.sha;
  },

  // 새 파일(바이너리) 업로드. 같은 이름이 있으면 번호를 붙여 다시 시도
  async putNewBytes(path, bytes, message) {
    const b64 = bytesToB64(bytes);
    const dot = path.lastIndexOf('.');
    const base = path.slice(0, dot), ext = path.slice(dot);
    for (let n = 0; n < 20; n++) {
      const p = n === 0 ? path : `${base}-${n + 1}${ext}`;
      try {
        await this.req('PUT', `/repos/${this.repo}/contents/${p}`, { message, content: b64, branch: this.branch });
        return p;
      } catch (e) {
        if (e.status === 422 || e.status === 409) continue; // 이미 있음 → 다른 이름
        throw e;
      }
    }
    throw new Error('같은 이름의 파일이 너무 많습니다. 파일 이름을 바꿔 주세요.');
  },

  rawUrl(path) {
    return `https://raw.githubusercontent.com/${this.repo}/${this.branch}/${path}`;
  },

  errorMessage(e) {
    if (e.status === 401) return '토큰이 올바르지 않거나 만료되었습니다.';
    if (e.status === 403) return '권한이 없습니다. 토큰에 the-harper-app 저장소의 Contents: Read and write 권한이 있는지 확인하세요.';
    if (e.status === 404) return '찾을 수 없습니다. 토큰이 the-harper-app 저장소에 접근할 수 있는지 확인하세요.';
    if (e.status === 409 || e.status === 422) return '다른 사람이 먼저 저장했습니다. 내용을 다시 불러옵니다.';
    return e.message || '알 수 없는 오류';
  },
};
