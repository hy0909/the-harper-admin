/* 지도 샵 화면 */
App.screens.shops = {
  files: ['shops'],
  selectedId: null,
  query: '',
  map: null,
  marker: null,

  areaOptions(data) {
    const names = { seongsu: '성수', hannam: '한남' };
    const keys = Object.keys(data.areas || {});
    for (const k of ['seongsu', 'hannam']) if (!keys.includes(k)) keys.push(k);
    return keys.map((k) => ({ value: k, label: (data.areas && data.areas[k] && (data.areas[k].name || data.areas[k].label)) || names[k] || k }));
  },
  areaName(data, key) {
    const o = this.areaOptions(data).find((a) => a.value === key);
    return o ? o.label : key;
  },

  validate() {
    const d = App.files.shops.data;
    const errors = [];
    (d.shops || []).forEach((s, i) => {
      const who = s.name ? `"${s.name}"` : `${i + 1}번 샵`;
      if (!s.name || !s.name.trim()) errors.push(`${i + 1}번 샵: 이름을 적어 주세요.`);
      if (!s.area) errors.push(`${who}: 지역을 골라 주세요.`);
      if (!s.photo) errors.push(`${who}: 사진이 필요합니다.`);
      if (!(s.tier >= 1 && s.tier <= 5)) errors.push(`${who}: 등급은 1~5 사이여야 합니다.`);
      if (typeof s.lat !== 'number' || typeof s.lng !== 'number' || Number.isNaN(s.lat) || Number.isNaN(s.lng)) errors.push(`${who}: 지도 위치(위도·경도)가 비어 있습니다.`);
    });
    return errors;
  },

  render(root) {
    UI.file = 'shops';
    const data = App.files.shops.data;
    if (!Array.isArray(data.shops)) data.shops = [];
    const self = this;
    const rerender = () => { const y = window.scrollY; root.innerHTML = ''; self.render(root); window.scrollTo(0, y); };

    root.append(screenHead('지도 샵', '지도 화면에 나오는 매장 목록입니다. 목록에서 샵을 누르면 아래에 수정 칸이 열립니다.', 'shops',
      () => App.save('shops', () => self.validate(), '관리자: 지도 샵 수정')));
    root.append(h('div', { id: 'errbox' }));

    // 검색 + 추가
    const search = h('input', { type: 'text', placeholder: '이름·주소·지역으로 찾기', value: self.query, oninput: (e) => { self.query = e.target.value; drawTable(); } });
    const addBtn = h('button', { class: 'btn', type: 'button', onclick: () => {
      const id = data.shops.reduce((m, s) => Math.max(m, Number(s.id) || 0), -1) + 1;
      const area = 'seongsu';
      data.shops.push({ id, tier: 1, area, areaName: self.areaName(data, area), name: '', addr: '', lat: 37.5445, lng: 127.0560, pick: false, photo: '', note: '', intro: [] });
      self.selectedId = id;
      self.query = '';
      markDirty('shops');
      rerender();
      setTimeout(() => { const f = $('#shop-form'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
    } }, '+ 샵 추가');

    const tableWrap = h('div', { class: 'table-wrap' });
    const drawTable = () => {
      const q = self.query.trim().toLowerCase();
      const rows = data.shops.filter((s) => !q || [s.name, s.addr, s.areaName, s.area, s.note].some((v) => String(v || '').toLowerCase().includes(q)));
      tableWrap.innerHTML = '';
      if (!rows.length) { tableWrap.append(h('div', { class: 'empty' }, data.shops.length ? '검색 결과가 없습니다.' : '샵이 없습니다. 위의 "샵 추가"를 눌러 주세요.')); return; }
      tableWrap.append(h('table', { class: 'shop-table' },
        h('thead', null, h('tr', null, h('th', null, ''), h('th', null, '이름'), h('th', { class: 'hide-m' }, '주소'), h('th', null, '지역·등급'))),
        h('tbody', null, rows.map((s) => h('tr', { class: 'row' + (s.id === self.selectedId ? ' sel' : ''), onclick: () => { self.selectedId = s.id; rerender(); setTimeout(() => { const f = $('#shop-form'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); } },
          h('td', null, h('span', { class: 'ph', style: s.photo ? `background-image:url("${imageUrl(s.photo)}")` : '' })),
          h('td', null, h('b', null, s.name || '(이름 없음)'), h('div', { class: 'muted small' }, s.note || '')),
          h('td', { class: 'hide-m muted small' }, s.addr || ''),
          h('td', null, s.pick ? h('span', { class: 'tag pick' }, 'PICK') : null, h('span', { class: 'tag' }, s.areaName || s.area), h('span', { class: 'tag' }, 'T' + s.tier)))))));
    };
    drawTable();
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, `샵 목록 (${data.shops.length})`), addBtn),
      h('div', { class: 'toolbar' }, search),
      tableWrap));

    // 수정 폼
    const shop = data.shops.find((s) => s.id === self.selectedId);
    if (shop) root.append(self.form(shop, data, rerender));
  },

  form(shop, data, rerender) {
    const self = this;
    const idx = data.shops.indexOf(shop);
    const latInput = fieldText('위도', shop, 'lat', { number: true, type: 'number', step: 'any', required: true, onChange: () => setMarker(false) });
    const lngInput = fieldText('경도', shop, 'lng', { number: true, type: 'number', step: 'any', required: true, onChange: () => setMarker(false) });
    const mapBox = h('div', { class: 'mapbox' });

    const setMarker = (pan) => {
      if (!self.marker) return;
      if (typeof shop.lat !== 'number' || typeof shop.lng !== 'number' || Number.isNaN(shop.lat) || Number.isNaN(shop.lng)) return;
      self.marker.setLatLng([shop.lat, shop.lng]);
      if (pan) self.map.panTo([shop.lat, shop.lng]);
    };
    const setFromMap = (ll) => {
      shop.lat = Math.round(ll.lat * 1e5) / 1e5;
      shop.lng = Math.round(ll.lng * 1e5) / 1e5;
      latInput.querySelector('input').value = shop.lat;
      lngInput.querySelector('input').value = shop.lng;
      markDirty('shops');
      setMarker(false);
    };

    const title = h('h2', null, shop.name || '(이름 없음)');
    const card = h('div', { class: 'card', id: 'shop-form' },
      h('div', { class: 'card-head' }, title,
        h('div', { class: 'actions' },
          h('button', { class: 'btn small danger', type: 'button', onclick: () => {
            if (!confirm(`"${shop.name || '이 샵'}"을 삭제할까요?`)) return;
            data.shops.splice(idx, 1);
            self.selectedId = null;
            markDirty('shops');
            rerender();
          } }, '삭제'),
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => { self.selectedId = null; rerender(); } }, '닫기'))),
      h('div', { class: 'grid3' },
        fieldText('이름', shop, 'name', { required: true, placeholder: '썬러브 링크스 성수', onChange: (v) => { title.textContent = v || '(이름 없음)'; } }),
        fieldSelect('지역', shop, 'area', self.areaOptions(data), { required: true, onChange: (v) => { shop.areaName = self.areaName(data, v); } }),
        fieldSelect('등급', shop, 'tier', [1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}` })), { required: true, onChange: (v) => { shop.tier = Number(v); }, hint: '1이 가장 먼저 보입니다.' })),
      fieldToggle('에디터 PICK 표시', shop, 'pick'),
      fieldText('한 줄 소개', shop, 'note', { placeholder: '한 줄 소개' }),
      fieldImage('사진', shop, 'photo', { required: true, slug: () => 'shop-' + slugify(shop.name) }),
      fieldText('주소', shop, 'addr', { placeholder: '성수동2가 269-77' }),
      h('div', { class: 'field' }, labelEl('지도 위치', true), mapBox,
        h('span', { class: 'hint' }, '지도를 누르거나 핀을 끌어서 위치를 정합니다. 아래 위도·경도를 직접 적어도 됩니다.')),
      h('div', { class: 'grid2' }, latInput, lngInput),
      h('label', { class: 'field' }, labelEl('소개 글'),
        h('textarea', { rows: 6, value: (shop.intro || []).join('\n\n'), placeholder: '문단 사이는 빈 줄 하나로 띄웁니다.',
          oninput: (e) => { shop.intro = e.target.value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean); markDirty('shops'); } }),
        h('span', { class: 'hint' }, '빈 줄로 띄우면 문단이 나뉩니다.')),
      h('div', { class: 'muted small' }, `id: ${shop.id}`));

    // 지도는 DOM에 붙은 뒤에 초기화
    setTimeout(() => {
      if (!window.L) { mapBox.textContent = '지도를 불러오지 못했습니다.'; return; }
      if (self.map) { try { self.map.remove(); } catch (_) {} }
      const ok = typeof shop.lat === 'number' && typeof shop.lng === 'number' && !Number.isNaN(shop.lat);
      const center = ok ? [shop.lat, shop.lng] : [37.5445, 127.056];
      self.map = L.map(mapBox, { scrollWheelZoom: false }).setView(center, 16);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(self.map);
      self.marker = L.marker(center, { draggable: true }).addTo(self.map);
      self.marker.on('dragend', () => setFromMap(self.marker.getLatLng()));
      self.map.on('click', (e) => setFromMap(e.latlng));
      setTimeout(() => self.map.invalidateSize(), 100);
    }, 0);

    return card;
  },
};
