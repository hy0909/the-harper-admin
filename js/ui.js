/* 입력 필드 도우미. 값이 바뀌면 obj[key]에 바로 쓰고, 해당 파일을 '수정됨'으로 표시 */
const UI = {
  file: 'content', // 현재 그리는 화면이 다루는 데이터 묶음 (content | shops)
  previewCache: {}, // 방금 올린 이미지의 미리보기 URL
};

function markDirty(file) { App.setDirty(file, true); }

function labelEl(text, required) {
  return h('span', { class: 'label' }, text, required ? h('i', { class: 'req' }, '*') : null);
}

function fieldText(label, obj, key, opt = {}) {
  const file = UI.file;
  const input = h(opt.textarea ? 'textarea' : 'input', {
    type: opt.textarea ? null : (opt.type || 'text'),
    value: obj[key] ?? '',
    placeholder: opt.placeholder || '',
    readonly: opt.readonly || null,
    rows: opt.rows || null,
    oninput: (e) => {
      obj[key] = opt.number ? (e.target.value.trim() === '' ? NaN : Number(e.target.value)) : e.target.value;
      e.target.classList.toggle('invalid', !!opt.required && !String(e.target.value).trim());
      markDirty(file);
      opt.onChange && opt.onChange(obj[key]);
    },
  });
  if (opt.step) input.setAttribute('step', opt.step);
  return h('label', { class: 'field' }, labelEl(label, opt.required), input,
    opt.hint ? h('span', { class: 'hint' }, opt.hint) : null);
}

function fieldSelect(label, obj, key, options, opt = {}) {
  const file = UI.file;
  const sel = h('select', {
    onchange: (e) => {
      obj[key] = e.target.value;
      markDirty(file);
      opt.onChange && opt.onChange(obj[key]);
    },
  }, options.map((o) => h('option', { value: o.value, selected: String(obj[key]) === String(o.value) || null }, o.label)));
  if (obj[key] == null || !options.some((o) => String(o.value) === String(obj[key]))) {
    // 현재 값이 목록에 없으면 첫 항목 혹은 빈 항목
    if (opt.allowEmpty) sel.prepend(h('option', { value: '', selected: true }, opt.emptyLabel || '선택'));
    else if (options.length) obj[key] = options[0].value;
  }
  return h('label', { class: 'field' }, labelEl(label, opt.required), sel,
    opt.hint ? h('span', { class: 'hint' }, opt.hint) : null);
}

function fieldToggle(label, obj, key, opt = {}) {
  const file = UI.file;
  return h('div', { class: 'field' }, h('label', { class: 'toggle' },
    h('input', { type: 'checkbox', checked: !!obj[key], onchange: (e) => { obj[key] = e.target.checked; markDirty(file); opt.onChange && opt.onChange(obj[key]); } }),
    h('span', { class: 'sw' }), h('span', null, label)));
}

function editorOptions(content) {
  return (content.editors || []).map((e) => ({ value: e.id, label: `${e.name} (${e.id})` }));
}

function fieldEditor(label, obj, key, content, opt = {}) {
  return fieldSelect(label, obj, key, editorOptions(content), { ...opt, allowEmpty: true, emptyLabel: '에디터 없음', required: true });
}

// 이미지 미리보기 URL
function imageUrl(path) {
  if (!path) return '';
  if (UI.previewCache[path]) return UI.previewCache[path];
  return DB.imageUrl(path);
}

// 캔버스로 줄이기: 긴 변 1600px, JPEG 0.85 (PNG는 PNG 유지)
async function shrinkImage(file) {
  const isPng = file.type === 'image/png';
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('이미지를 읽을 수 없습니다.'));
      im.src = url;
    });
    const MAX = 1600;
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale), hh = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = hh;
    canvas.getContext('2d').drawImage(img, 0, 0, w, hh);
    const blob = await new Promise((res) => canvas.toBlob(res, isPng ? 'image/png' : 'image/jpeg', 0.85));
    if (!blob) throw new Error('이미지 변환에 실패했습니다.');
    return { blob, ext: isPng ? 'png' : 'jpg' };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function uploadImage(file, slugHint) {
  const { blob, ext } = await shrinkImage(file);
  const origName = file.name.replace(/\.[^.]+$/, '');
  const slug = slugify(slugHint) !== 'item' ? slugify(slugHint) : slugify(origName);
  const path = `uploads/${todayStamp()}-${slug}.${ext}`;
  const url = await DB.uploadImage(path, blob, ext === 'png' ? 'image/png' : 'image/jpeg');
  UI.previewCache[url] = URL.createObjectURL(blob);
  return url;
}

function fieldImage(label, obj, key, opt = {}) {
  const file = UI.file;
  const thumb = h('div', { class: 'thumb' + (opt.round ? ' round' : '') });
  const pathInput = h('input', { type: 'text', value: obj[key] ?? '', placeholder: 'https://… 또는 assets/photos/…', spellcheck: 'false',
    oninput: (e) => { obj[key] = e.target.value.trim(); markDirty(file); refresh(); opt.onChange && opt.onChange(obj[key]); } });
  const prog = h('span', { class: 'prog' });
  const fileInput = h('input', { type: 'file', accept: 'image/*', class: 'hidden' });
  const btn = h('button', { type: 'button', class: 'btn small', onclick: () => fileInput.click() }, obj[key] ? '사진 바꾸기' : '사진 올리기');

  function refresh() {
    thumb.innerHTML = '';
    const p = obj[key];
    if (p) thumb.append(h('img', { src: imageUrl(p), alt: '', onerror: (e) => { e.target.remove(); thumb.textContent = '불러올 수 없음'; } }));
    else thumb.textContent = '사진 없음';
    pathInput.classList.toggle('invalid', !!opt.required && !p);
    btn.textContent = p ? '사진 바꾸기' : '사진 올리기';
  }
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files[0];
    if (!f) return;
    btn.disabled = true; prog.textContent = '올리는 중…';
    try {
      const saved = await uploadImage(f, typeof opt.slug === 'function' ? opt.slug() : opt.slug);
      obj[key] = saved;
      pathInput.value = saved;
      markDirty(file);
      refresh();
      opt.onChange && opt.onChange(saved);
      prog.textContent = '올렸습니다. 저장을 눌러야 앱에 적용됩니다.';
      toast('이미지를 올렸습니다.', 'ok');
    } catch (e) {
      prog.textContent = '';
      toast('업로드 실패: ' + DB.errorMessage(e), 'err');
    } finally {
      btn.disabled = false;
      fileInput.value = '';
    }
  });
  refresh();
  return h('div', { class: 'field' }, labelEl(label, opt.required),
    h('div', { class: 'imgfield' }, thumb,
      h('div', { class: 'ctl' }, pathInput, h('div', { class: 'row' }, btn, fileInput, prog),
        h('span', { class: 'hint' }, opt.hint || '파일을 올리면 사진 저장소(images/uploads)에 들어가고 주소가 자동으로 채워집니다. 긴 변 1600px로 줄입니다.'))));
}

// 화면 머리글 + 저장 버튼
function screenHead(title, desc, file, onSave) {
  const status = h('span', { class: 'status', 'data-status': file });
  const btn = h('button', { class: 'btn primary', 'data-save': file, onclick: onSave }, '저장');
  const head = h('div', { class: 'screen-head' },
    h('div', null, h('h1', null, title), desc ? h('p', { class: 'muted small' }, desc) : null),
    h('div', { class: 'savebar' }, status, btn));
  App.refreshStatus(file);
  return head;
}

function errorList(errors) {
  if (!errors.length) return null;
  return h('div', { class: 'errlist' }, '저장하기 전에 아래를 확인하세요.', h('ul', null, errors.map((e) => h('li', null, e))));
}

// 위/아래 이동, 삭제 버튼 묶음
function orderButtons(arr, i, rerender, onDelete) {
  const file = UI.file;
  const move = (d) => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    markDirty(file);
    rerender();
  };
  return h('div', { class: 'actions' },
    h('button', { class: 'btn icon small', type: 'button', title: '위로', disabled: i === 0, onclick: () => move(-1) }, '↑'),
    h('button', { class: 'btn icon small', type: 'button', title: '아래로', disabled: i === arr.length - 1, onclick: () => move(1) }, '↓'),
    h('button', { class: 'btn small danger', type: 'button', onclick: () => {
      if (!confirm('이 항목을 삭제할까요?')) return;
      if (onDelete) onDelete(); else arr.splice(i, 1);
      markDirty(file);
      rerender();
    } }, '삭제'));
}
