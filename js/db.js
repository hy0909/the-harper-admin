/* Supabase 저장소 — 테이블(editors, site_content, areas, shops, magazines)과 사진 버킷(images) */
const DB = {
  client: null,
  BUCKET: 'images',
  APP_BASE: 'https://hy0909.github.io/the-harper-app/',

  // 설정이 있으면 클라이언트를 만든다. 없으면 null
  init() {
    const cfg = window.HARPER_SUPABASE || {};
    if (!cfg.url || !cfg.anonKey) return null;
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('supabase-js를 불러오지 못했습니다. 네트워크 연결을 확인하세요.');
    }
    this.client = window.supabase.createClient(cfg.url, cfg.anonKey);
    return this.client;
  },

  // ---- 로그인 ----
  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },
  async signOut() {
    try { await this.client.auth.signOut(); } catch (_) { /* 이미 끊김 */ }
  },
  async currentUser() {
    const { data } = await this.client.auth.getSession();
    return data && data.session ? data.session.user : null;
  },
  onAuthChange(fn) {
    this.client.auth.onAuthStateChange((event, session) => fn(event, session));
  },

  // ---- 읽기 ----
  async load(file) {
    if (file === 'content') return this.loadContent();
    if (file === 'shops') return this.loadShops();
    if (file === 'magazines') return this.loadMagazines();
    throw new Error('알 수 없는 데이터: ' + file);
  },

  // 에디터 + 메인 화면 → { editors:[{id,name,avatar}], home:{...} }
  async loadContent() {
    const ed = await this.client.from('editors').select('id,name,avatar,sort').order('sort', { ascending: true }).order('id');
    if (ed.error) throw ed.error;
    const sc = await this.client.from('site_content').select('value').eq('key', 'home').maybeSingle();
    if (sc.error) throw sc.error;
    return {
      editors: (ed.data || []).map((r) => ({ id: r.id, name: r.name, avatar: r.avatar || '' })),
      home: (sc.data && sc.data.value) || {},
    };
  },

  // 지역 + 매장 → { areas:{id:{name,lat,lng}}, shops:[camelCase] }
  async loadShops() {
    const ar = await this.client.from('areas').select('id,name,lat,lng').order('id');
    if (ar.error) throw ar.error;
    const sh = await this.client.from('shops').select('*').order('sort', { ascending: true }).order('id');
    if (sh.error) throw sh.error;
    const areas = {};
    (ar.data || []).forEach((a) => { areas[a.id] = { name: a.name, lat: a.lat, lng: a.lng }; });
    return { areas, shops: (sh.data || []).map((r) => this.shopFromRow(r)) };
  },

  shopFromRow(r) {
    const s = {
      id: r.id, tier: r.tier, area: r.area, areaName: r.area_name, name: r.name, addr: r.addr || '',
      lat: r.lat, lng: r.lng, pick: !!r.pick, photo: r.photo || '', note: r.note || '',
      intro: Array.isArray(r.intro) ? r.intro : [],
    };
    if (r.hours != null) s.hours = r.hours;
    if (r.closed != null) s.closed = r.closed;
    if (r.phone != null) s.phone = r.phone;
    return s;
  },
  shopToRow(s, sort) {
    return {
      id: Number(s.id), tier: Number(s.tier) || 3, area: s.area, area_name: s.areaName || s.area, name: s.name || '',
      addr: s.addr || '', lat: Number(s.lat), lng: Number(s.lng), pick: !!s.pick, photo: s.photo || '', note: s.note || '',
      intro: Array.isArray(s.intro) ? s.intro : [], hours: s.hours ?? null, closed: s.closed ?? null, phone: s.phone ?? null, sort,
    };
  },

  // 에디터(읽기 전용) + 매거진 → { editors:[{id,name,avatar}], magazines:[row 그대로(snake_case)] }
  async loadMagazines() {
    const ed = await this.client.from('editors').select('id,name,avatar,sort').order('sort', { ascending: true }).order('id');
    if (ed.error) throw ed.error;
    const mg = await this.client.from('magazines').select('*').order('sort', { ascending: true }).order('id');
    if (mg.error) throw mg.error;
    return {
      editors: (ed.data || []).map((r) => ({ id: r.id, name: r.name, avatar: r.avatar || '' })),
      magazines: (mg.data || []).map((r) => this.magFromRow(r)),
    };
  },

  magFromRow(r) {
    const str = (v) => (v == null ? '' : String(v));
    return {
      id: str(r.id), kind: r.kind === 'tour' ? 'tour' : 'magazine', badge: str(r.badge), title: str(r.title), hero: str(r.hero),
      editor: str(r.editor), date: str(r.date), price: str(r.price), note: str(r.note), summary: str(r.summary),
      info: Array.isArray(r.info) ? r.info.map((x) => ({ label: str(x && x.label), value: str(x && x.value) })) : [],
      intro: str(r.intro),
      sections: Array.isArray(r.sections) ? r.sections.map((x) => ({
        heading: str(x && x.heading), sub: str(x && x.sub), image: str(x && x.image), body: str(x && x.body),
        link: str(x && x.link), link_label: str(x && x.link_label),
      })) : [],
      related_label: str(r.related_label), related_link: str(r.related_link), cta_label: str(r.cta_label), cta_link: str(r.cta_link),
    };
  },
  magToRow(m, sort) {
    const str = (v) => (v == null ? '' : String(v));
    return {
      id: str(m.id).trim(), kind: m.kind === 'tour' ? 'tour' : 'magazine', badge: str(m.badge), title: str(m.title), hero: str(m.hero),
      editor: str(m.editor), date: str(m.date), price: str(m.price), note: str(m.note), summary: str(m.summary),
      info: (m.info || []).map((x) => ({ label: str(x.label), value: str(x.value) })),
      intro: str(m.intro),
      sections: (m.sections || []).map((x) => ({
        heading: str(x.heading), sub: str(x.sub), image: str(x.image), body: str(x.body), link: str(x.link), link_label: str(x.link_label),
      })),
      related_label: str(m.related_label), related_link: str(m.related_link), cta_label: str(m.cta_label), cta_link: str(m.cta_link),
      sort,
    };
  },

  // ---- 쓰기 ----
  // data: 현재 화면 데이터, prev: 불러왔을 때(또는 마지막 저장 때)의 복사본
  async save(file, data, prev) {
    if (file === 'content') return this.saveContent(data, prev);
    if (file === 'shops') return this.saveShops(data, prev);
    if (file === 'magazines') return this.saveMagazines(data, prev);
    throw new Error('알 수 없는 데이터: ' + file);
  },

  async saveContent(data, prev) {
    const rows = (data.editors || []).map((e, i) => ({ id: e.id, name: e.name, avatar: e.avatar || '', sort: i }));
    if (rows.length) {
      const up = await this.client.from('editors').upsert(rows, { onConflict: 'id' });
      if (up.error) throw up.error;
    }
    const keep = new Set(rows.map((r) => r.id));
    const removed = ((prev && prev.editors) || []).map((e) => e.id).filter((id) => !keep.has(id));
    if (removed.length) {
      const del = await this.client.from('editors').delete().in('id', removed);
      if (del.error) throw del.error;
    }
    const sc = await this.client.from('site_content')
      .upsert({ key: 'home', value: data.home || {}, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (sc.error) throw sc.error;
  },

  async saveShops(data, prev) {
    const prevRows = {};
    ((prev && prev.shops) || []).forEach((s, i) => { prevRows[s.id] = JSON.stringify(this.shopToRow(s, i)); });
    const rows = (data.shops || []).map((s, i) => this.shopToRow(s, i));
    const changed = rows.filter((r) => prevRows[r.id] !== JSON.stringify(r));
    if (changed.length) {
      const up = await this.client.from('shops').upsert(changed, { onConflict: 'id' });
      if (up.error) throw up.error;
    }
    const keep = new Set(rows.map((r) => r.id));
    const removed = Object.keys(prevRows).map(Number).filter((id) => !keep.has(id));
    if (removed.length) {
      const del = await this.client.from('shops').delete().in('id', removed);
      if (del.error) throw del.error;
    }
  },

  // 매거진: 바뀐 글만 upsert(sort = 목록 순서), 지운 글은 삭제. 에디터 목록은 읽기 전용이라 건드리지 않음
  async saveMagazines(data, prev) {
    const prevRows = {};
    ((prev && prev.magazines) || []).forEach((m, i) => { prevRows[m.id] = JSON.stringify(this.magToRow(m, i)); });
    const rows = (data.magazines || []).map((m, i) => this.magToRow(m, i));
    const changed = rows.filter((r) => prevRows[r.id] !== JSON.stringify(r));
    if (changed.length) {
      const up = await this.client.from('magazines').upsert(changed, { onConflict: 'id' });
      if (up.error) throw up.error;
    }
    const keep = new Set(rows.map((r) => r.id));
    const removed = Object.keys(prevRows).filter((id) => !keep.has(id));
    if (removed.length) {
      const del = await this.client.from('magazines').delete().in('id', removed);
      if (del.error) throw del.error;
    }
  },

  // ---- 사진 ----
  // uploads/날짜-이름.확장자 로 올리고 공개 URL을 돌려준다. 같은 이름이 있으면 -2, -3 …
  async uploadImage(path, blob, contentType) {
    const dot = path.lastIndexOf('.');
    const base = path.slice(0, dot), ext = path.slice(dot);
    const bucket = this.client.storage.from(this.BUCKET);
    for (let n = 0; n < 20; n++) {
      const p = n === 0 ? path : `${base}-${n + 1}${ext}`;
      const { error } = await bucket.upload(p, blob, { contentType, upsert: false, cacheControl: '31536000' });
      if (!error) return bucket.getPublicUrl(p).data.publicUrl;
      if (String(error.statusCode) === '409' || /already exists|duplicate/i.test(error.message || '')) continue;
      throw error;
    }
    throw new Error('같은 이름의 파일이 너무 많습니다. 파일 이름을 바꿔 주세요.');
  },

  // 미리보기 주소: 전체 주소면 그대로, 아니면 앱에 있는 옛 경로
  imageUrl(path) {
    if (!path) return '';
    if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
    return this.APP_BASE + path.replace(/^\/+/, '');
  },

  // ---- 오류 메시지 ----
  isAuthError(e) {
    const m = String((e && e.message) || '');
    return (e && (e.status === 401 || e.code === 'PGRST301')) || /JWT|not authenticated|session/i.test(m) && /expired|invalid|missing/i.test(m);
  },
  errorMessage(e) {
    if (!e) return '알 수 없는 오류';
    const m = String(e.message || e.error_description || e.error || '');
    if (/Invalid login credentials|invalid_credentials/i.test(m)) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    if (/Email not confirmed/i.test(m)) return '아직 확인되지 않은 이메일입니다. 관리자에게 문의하세요.';
    if (/rate limit|too many/i.test(m)) return '시도가 너무 많습니다. 잠시 뒤 다시 해 주세요.';
    if (/Failed to fetch|NetworkError|Load failed|network/i.test(m) || e.name === 'TypeError') return '네트워크 연결을 확인하세요.';
    if (/Invalid API key|apikey/i.test(m)) return 'anon 키가 올바르지 않습니다. js/config.js를 확인하세요.';
    if (this.isAuthError(e)) return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
    if (e.code === '42501' || /row-level security|violates row-level/i.test(m)) return '쓰기 권한이 없습니다. 로그인 상태를 확인하세요.';
    if (e.code === '23503' || /foreign key/i.test(m)) return '없는 지역을 가리키고 있습니다. 지역을 다시 골라 주세요.';
    if (e.code === '23505' || /duplicate key/i.test(m)) return '같은 id가 이미 있습니다. 다른 id를 적어 주세요.';
    if (e.code === '42P01' || /relation .* does not exist|Could not find the table/i.test(m)) return '테이블이 없습니다. supabase/ 안의 SQL을 먼저 실행해 주세요.';
    if (/Bucket not found/i.test(m)) return '사진 버킷(images)이 없습니다. supabase/schema.sql을 먼저 실행해 주세요.';
    if (/Payload too large|exceeded the maximum allowed size/i.test(m)) return '사진이 너무 큽니다.';
    return m || '알 수 없는 오류';
  },
};
