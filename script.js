import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  GoogleAuthProvider, signInWithPopup,
  RecaptchaVerifier, signInWithPhoneNumber, sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyB04lPYscKp94lr8FC4xLpTiBEoiFTlut8',
  authDomain: 'doyungo-host.firebaseapp.com',
  projectId: 'doyungo-host',
  storageBucket: 'doyungo-host.firebasestorage.app',
  messagingSenderId: '387132197919',
  appId: '1:387132197919:web:65a8bc0d372698895e592a',
  measurementId: 'G-6SZKEKSZRR'
};
const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
auth.languageCode = 'ko';

const $ = s => document.querySelector(s);
const statusEl = $('#status'), loginBox = $('#loginBox'), app = $('#app');

const ERRORS = {
  'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
  'auth/missing-password': '비밀번호를 입력하세요.',
  'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
  'auth/email-already-in-use': '이미 가입된 이메일입니다. 로그인해 주세요.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/user-not-found': '가입되지 않은 이메일입니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/too-many-requests': '시도가 너무 많습니다. 잠시 후 다시 시도하세요.',
  'auth/invalid-phone-number': '전화번호 형식이 올바르지 않습니다.',
  'auth/invalid-verification-code': '인증번호가 올바르지 않습니다.',
  'auth/code-expired': '인증번호가 만료되었습니다. 다시 받아 주세요.',
  'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
  'auth/popup-blocked': '팝업이 차단되었습니다. 팝업을 허용해 주세요.',
  'auth/unauthorized-domain': '이 도메인이 Firebase 승인된 도메인에 등록되어 있지 않습니다.',
  'auth/operation-not-allowed': 'Firebase에서 이 로그인 방식이 아직 켜져 있지 않습니다.',
  'auth/network-request-failed': '네트워크 오류입니다. 다시 시도하세요.'
};
function setMsg(text, ok = false) { const el = $('#loginMsg'); el.textContent = text; el.className = 'msg ' + (ok ? 'ok' : 'err'); }
function fail(e) { console.error(e); setMsg(ERRORS[e?.code] || e?.message || '오류가 발생했습니다.'); }

async function api(url, opt = {}) {
  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken() : null;
  const headers = { ...(idToken ? { Authorization: 'Bearer ' + idToken } : {}), ...(opt.body ? { 'Content-Type': 'application/json' } : {}), ...(opt.headers || {}) };
  const r = await fetch(url, { credentials: 'same-origin', ...opt, headers });
  let d = {}; try { d = await r.json(); } catch {}
  if (!r.ok) throw new Error(d.error || `요청에 실패했습니다. (HTTP ${r.status}${r.status === 404 ? ' · 서버 API가 최신 버전으로 배포됐는지 확인하세요' : ''})`);
  return d;
}

const DEFAULT_HTML = '<!doctype html>\n<html lang="ko">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>내 사이트</title></head>\n<body><h1>안녕하세요 👋</h1><p>DOYUNGO HOST로 만든 사이트입니다.</p></body>\n</html>';

// ---------- 탭 ----------
document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
  ['email', 'phone', 'google'].forEach(n => $('#pane-' + n).classList.toggle('hidden', n !== t.dataset.tab));
  setMsg('');
});

// ---------- 이메일 ----------
const creds = () => [$('#email').value.trim(), $('#password').value];
$('#emailLoginBtn').onclick = async () => { try { await signInWithEmailAndPassword(auth, ...creds()); } catch (e) { fail(e); } };
$('#emailSignupBtn').onclick = async () => {
  try {
    const c = await createUserWithEmailAndPassword(auth, ...creds());
    try { await sendEmailVerification(c.user); alert('인증 메일을 보냈습니다. 메일의 링크를 누른 뒤 페이지를 새로고침하세요.'); } catch {}
  } catch (e) { fail(e); }
};
$('#password').addEventListener('keydown', e => { if (e.key === 'Enter') $('#emailLoginBtn').click(); });
$('#resetBtn').onclick = async () => {
  const email = $('#email').value.trim();
  if (!email) return setMsg('비밀번호를 재설정할 이메일을 입력하세요.');
  try { await sendPasswordResetEmail(auth, email); setMsg('재설정 메일을 보냈습니다. 메일함을 확인하세요.', true); } catch (e) { fail(e); }
};

// ---------- Google ----------
$('#googleBtn').onclick = async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { fail(e); } };

// ---------- 전화 ----------
let verifier = null, confirmation = null;
function toE164(raw) {
  const n = raw.replace(/[\s-]/g, '');
  if (n.startsWith('+')) return n;
  if (n.startsWith('0')) return '+82' + n.slice(1); // 한국 번호: 010... → +8210...
  return '+' + n;
}
$('#sendCodeBtn').onclick = async () => {
  try {
    if (!verifier) verifier = new RecaptchaVerifier(auth, 'recaptcha', { size: 'invisible' });
    confirmation = await signInWithPhoneNumber(auth, toE164($('#phone').value), verifier);
    $('#codeBox').classList.remove('hidden');
    setMsg('인증번호를 보냈습니다.', true);
  } catch (e) {
    fail(e);
    try { verifier?.clear(); } catch {}
    verifier = null;
  }
};
$('#verifyCodeBtn').onclick = async () => {
  try { await confirmation.confirm($('#code').value.trim()); } catch (e) { fail(e); }
};

$('#logoutBtn').onclick = async () => {
  try { await fetch('/api/auth', { method: 'DELETE', credentials: 'same-origin' }); } catch {}
  try { await signOut(auth); } catch {}
  location.reload();
};

// ---------- 관리자 (비밀번호) ----------
let adminCookie = false;
$('#adminToggle').onclick = () => { $('#adminBox').classList.toggle('hidden'); $('#adminPassword').focus(); };
$('#adminPassword').addEventListener('keydown', e => { if (e.key === 'Enter') $('#adminLoginBtn').click(); });
$('#adminLoginBtn').onclick = async () => {
  const msg = $('#adminMsg');
  try {
    const r = await fetch('/api/auth', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: $('#adminPassword').value })
    });
    let d = {}; try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d.error || '로그인에 실패했습니다.');
    $('#adminPassword').value = '';
    adminCookie = true;
    await render(auth.currentUser);
  } catch (e) { msg.textContent = e.message; msg.className = 'msg err'; }
};

// ---------- 화면 전환 (모바일 탭) ----------
function showView(v) {
  app.dataset.view = v;
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  if (v === 'preview') preview();
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.tabbar button').forEach(b => b.onclick = () => showView(b.dataset.view));
$('#createBtn').onclick = () => { resetEditor(); showView('editor'); };

// ---------- 프로젝트 에디터 ----------
let projectFiles = new Map(); // path -> { path, base64, text, binary }
let activePath = '';
let editing = null;           // 기존 사이트 편집 중이면 { slug, legacy }
const dirty = new Set();      // 서버에 아직 반영되지 않은 변경 (파일 경로 / '-삭제경로')
let previewTimer = null;

const toBase64 = bytes => { let bin = ''; const c = 0x8000; for (let i = 0; i < bytes.length; i += c) bin += String.fromCharCode(...bytes.subarray(i, i + c)); return btoa(bin); };
const fromBase64 = v => Uint8Array.from(atob(v), c => c.charCodeAt(0));
const enc = s => new TextEncoder().encode(s);
const textExt = /\.(html?|css|js|mjs|json|txt|xml|svg|md|csv|webmanifest|php|yml|yaml)$/i;
const imgExt = /\.(png|jpe?g|gif|webp|ico|avif)$/i;
const MIME = { html:'text/html', htm:'text/html', css:'text/css', js:'text/javascript', mjs:'text/javascript', json:'application/json', svg:'image/svg+xml', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', webp:'image/webp', avif:'image/avif', ico:'image/x-icon', woff:'font/woff', woff2:'font/woff2', ttf:'font/ttf', otf:'font/otf', mp4:'video/mp4', mp3:'audio/mpeg' };
const mimeFor = p => MIME[p.split('.').pop().toLowerCase()] || 'application/octet-stream';
const fmtSize = f => { const n = Math.ceil((f.base64 || '').length * 3 / 4); return n > 1024 ? (n / 1024).toFixed(1) + ' KB' : n + ' B'; };
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }

// 토스트 알림 (alert 대체)
function toast(msg, type = 'ok', opt = {}) {
  const box = $('#toast'), el = document.createElement('div');
  el.className = 'toast-item ' + type;
  el.innerHTML = `<span>${esc(msg)}</span>` + (opt.href ? `<a href="${esc(opt.href)}" target="_blank" rel="noopener">${esc(opt.label || '열기')} ↗</a>` : '');
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, opt.ms || (type === 'err' ? 5500 : 3200));
}
async function busy(btn, label, fn) {
  const old = btn.textContent; btn.disabled = true; btn.textContent = label;
  try { return await fn(); } finally { btn.disabled = false; btn.textContent = old; }
}

// 변경 추적
function markDirty(key, on = true) { on ? dirty.add(key) : dirty.delete(key); updateDirtyUI(); }
function updateDirtyUI() {
  $('#dirtyDot').classList.toggle('hidden', !dirty.has(activePath));
  $('#unsavedCount').textContent = dirty.size ? `미반영 변경 ${dirty.size}건` : '';
  document.querySelectorAll('#fileTree .file-item').forEach(b => b.classList.toggle('modified', dirty.has(b.dataset.path)));
}
window.addEventListener('beforeunload', e => { if (dirty.size) { e.preventDefault(); e.returnValue = ''; } });
const confirmDiscard = () => !dirty.size || confirm('저장하지 않은 변경 사항이 있습니다. 버리고 계속할까요?');

// 편집 모드 표시
function setEditMode(info) {
  editing = info;
  const on = !!info;
  $('#editBanner').classList.toggle('hidden', !on);
  
  $('#builderTitle').textContent = on ? '사이트 편집' : '새 사이트 만들기';
  $('#slug').readOnly = on;            // 편집 중 주소 변경 → 새 사이트 생성 방지
  $('#slug').closest('.url-input').classList.toggle('locked', on);
  $('#builderEyebrow').textContent = on ? '편집 중' : '새 사이트';
  $('#saveBtn').textContent = on ? '변경사항 배포' : '사이트 배포';
  $('#saveFileBtn').textContent = on && !info.legacy ? '파일 저장 (즉시 반영)' : '파일 저장';
  if (on) { $('#editSlug').textContent = '/' + info.slug; $('#editLink').href = '/' + info.slug; }
  document.querySelectorAll('.site').forEach(s => s.classList.toggle('editing', on && s.dataset.slug === info.slug));
}

function setProjectFiles(files) {
  projectFiles = new Map(files.map(f => [f.path, f]));
  activePath = '';
  renderFileTree();
}
function renderFileTree() {
  const tree = $('#fileTree'); tree.innerHTML = '';
  const paths = [...projectFiles.keys()].sort((a, b) => a.localeCompare(b));
  $('#fileCount').textContent = paths.length;
  paths.forEach(path => {
    const btn = document.createElement('button'); btn.type = 'button';
    btn.className = 'file-item' + (path === activePath ? ' active' : '') + (dirty.has(path) ? ' modified' : '');
    btn.dataset.path = path; btn.title = path;
    btn.textContent = (imgExt.test(path) ? '🖼 ' : path.includes('/') ? '📁 ' : '📄 ') + path;
    btn.onclick = () => openProjectFile(path);
    tree.appendChild(btn);
  });
}

// 현재 textarea 내용을 파일에 반영
function commitActive() {
  const f = projectFiles.get(activePath);
  if (!f || f.binary || !textExt.test(activePath)) return;
  const v = $('#htmlCode').value;
  if (f.text !== v) { f.text = v; f.base64 = toBase64(enc(v)); markDirty(activePath); }
}

function openProjectFile(path) {
  const f = projectFiles.get(path); if (!f) return;
  if (activePath && activePath !== path) commitActive();
  activePath = path; $('#activeFileName').textContent = path;
  const ta = $('#htmlCode'), box = $('#imgPreview');
  const isText = !f.binary && textExt.test(path), isImg = !isText && imgExt.test(path);
  box.classList.toggle('hidden', !isImg); ta.classList.toggle('hidden', isImg);
  if (isImg) box.innerHTML = `<img alt="" src="data:${mimeFor(path)};base64,${f.base64}"><small>${esc(path)} · ${fmtSize(f)}</small>`;
  else if (isText) { if (f.text === undefined) f.text = new TextDecoder().decode(fromBase64(f.base64)); ta.readOnly = false; ta.value = f.text; }
  else { ta.readOnly = true; ta.value = `이 파일은 텍스트로 편집할 수 없는 바이너리 파일입니다.\n\n파일: ${path} (${fmtSize(f)})\n배포에는 그대로 포함됩니다.`; }
  renderFileTree(); updateDirtyUI(); schedulePreview(0);
}

// ---------- 미리보기: 상대경로 CSS·JS·이미지를 프로젝트 파일로 연결 ----------
function resolvePath(from, ref) {
  if (!ref || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref)) return null;
  try { return decodeURIComponent(new URL(ref.split('#')[0].split('?')[0], new URL(from, 'http://p/')).pathname.slice(1)); } catch { return null; }
}
const dataUrl = p => { const f = projectFiles.get(p); return f ? `data:${mimeFor(p)};base64,${f.base64}` : null; };
const fileText = p => { const f = projectFiles.get(p); return f ? (f.text !== undefined && !f.binary ? f.text : new TextDecoder().decode(fromBase64(f.base64))) : null; };
function inlineCss(css, from) {
  return css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (m, q, ref) => { const p = resolvePath(from, ref); const d = p && dataUrl(p); return d ? `url("${d}")` : m; });
}
function buildPreview(htmlPath) {
  const doc = new DOMParser().parseFromString(fileText(htmlPath) || '', 'text/html');
  doc.querySelectorAll('link[rel~="stylesheet"][href]').forEach(l => {
    const p = resolvePath(htmlPath, l.getAttribute('href')), css = p && fileText(p);
    if (css != null) { const s = doc.createElement('style'); s.textContent = inlineCss(css, p); l.replaceWith(s); }
  });
  doc.querySelectorAll('script[src]').forEach(sc => {
    const p = resolvePath(htmlPath, sc.getAttribute('src')), js = p && fileText(p);
    if (js != null) { sc.removeAttribute('src'); sc.textContent = js.replace(/<\/script/gi, '<\\/script'); }
  });
  doc.querySelectorAll('img[src],source[src],video[src],audio[src],link[rel~="icon"][href]').forEach(el => {
    const attr = el.hasAttribute('src') ? 'src' : 'href', p = resolvePath(htmlPath, el.getAttribute(attr)), d = p && dataUrl(p);
    if (d) el.setAttribute(attr, d);
  });
  doc.querySelectorAll('[style]').forEach(el => el.setAttribute('style', inlineCss(el.getAttribute('style'), htmlPath)));
  return '<!doctype html>\n' + doc.documentElement.outerHTML;
}
function preview() {
  commitActive();
  const target = /\.html?$/i.test(activePath) ? activePath : 'index.html';
  if (!projectFiles.has(target)) return;
  $('#previewFrame').srcdoc = buildPreview(target);
}
function schedulePreview(ms = 350) { clearTimeout(previewTimer); previewTimer = setTimeout(preview, ms); }

function resetEditor(force) {
  if (!force && !confirmDiscard()) return;
  dirty.clear(); setEditMode(null);
  $('#slug').value = ''; $('#title').value = '';
  setProjectFiles([{ path: 'index.html', text: DEFAULT_HTML, base64: toBase64(enc(DEFAULT_HTML)) }]);
  openProjectFile('index.html'); $('#slug').focus();
}

// ---------- 편집기 입력 ----------
$('#previewBtn').onclick = preview; $('#refreshPreview').onclick = preview;
$('#htmlCode').addEventListener('input', () => { commitActive(); schedulePreview(); });
$('#htmlCode').addEventListener('keydown', e => {
  if (e.key === 'Tab' && !e.shiftKey) { // 탭 키로 들여쓰기
    e.preventDefault(); const t = e.target, s = t.selectionStart;
    t.value = t.value.slice(0, s) + '  ' + t.value.slice(t.selectionEnd); t.selectionStart = t.selectionEnd = s + 2;
    t.dispatchEvent(new Event('input'));
  }
});
document.addEventListener('keydown', e => { // Ctrl/Cmd + S → 파일 저장
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !app.classList.contains('hidden')) { e.preventDefault(); $('#saveFileBtn').click(); }
});
$('#newBtn').onclick = () => resetEditor();

$('#addFileBtn').onclick = () => {
  const clean = (prompt('새 파일 경로를 입력하세요. 예: assets/style.css') || '').trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!clean) return;
  if (clean.split('/').some(x => !x || x === '.' || x === '..') || projectFiles.has(clean)) return toast('파일 경로가 올바르지 않거나 이미 존재합니다.', 'err');
  commitActive();
  projectFiles.set(clean, { path: clean, text: '', base64: '', binary: false });
  dirty.delete('-' + clean); markDirty(clean); openProjectFile(clean);
};
$('#deleteFileBtn').onclick = () => {
  if (projectFiles.size <= 1) return toast('사이트에는 최소 한 개 파일이 필요합니다.', 'err');
  if (activePath === 'index.html') return toast('index.html은 삭제할 수 없습니다.', 'err');
  if (!confirm(`${activePath} 파일을 프로젝트에서 삭제할까요?\n(사이트 배포 시 서버에서도 삭제됩니다)`)) return;
  projectFiles.delete(activePath); dirty.delete(activePath); markDirty('-' + activePath);
  activePath = ''; openProjectFile(projectFiles.has('index.html') ? 'index.html' : [...projectFiles.keys()][0]);
};
$('#downloadZipBtn').onclick = async () => {
  if (!window.JSZip) return toast('ZIP 라이브러리를 불러오지 못했습니다.', 'err');
  commitActive();
  const z = new JSZip(); projectFiles.forEach(f => z.file(f.path, f.base64, { base64: true }));
  const a = document.createElement('a'); a.href = URL.createObjectURL(await z.generateAsync({ type: 'blob' }));
  a.download = ($('#slug').value.trim() || 'site') + '.zip'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

$('#zipInput').addEventListener('change', async e => {
  const file = e.target.files?.[0]; if (!file) return;
  if (!confirmDiscard()) { e.target.value = ''; return; }
  try {
    if (!window.JSZip) throw new Error('ZIP 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 시도하세요.');
    const zip = await JSZip.loadAsync(file); const loaded = []; let total = 0;
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const clean = path.replace(/^\.\//, '');
      if (!clean || clean.startsWith('__MACOSX/') || clean.endsWith('.DS_Store')) continue;
      if (loaded.length >= 100) throw new Error('한 프로젝트에는 최대 100개 파일까지 업로드할 수 있습니다.');
      const bytes = await entry.async('uint8array'); total += bytes.length;
      if (total > 3 * 1024 * 1024) throw new Error('압축 해제 후 전체 파일 크기는 3MB 이하만 가능합니다.');
      const binary = !textExt.test(clean);
      loaded.push({ path: clean, base64: toBase64(bytes), binary, text: binary ? undefined : new TextDecoder().decode(bytes) });
    }
    let normalized = loaded;
    if (!loaded.some(f => f.path.toLowerCase() === 'index.html')) {
      const roots = [...new Set(loaded.map(f => f.path.split('/')[0]))];
      if (roots.length === 1) { const root = roots[0] + '/'; normalized = loaded.filter(f => f.path.startsWith(root)).map(f => ({ ...f, path: f.path.slice(root.length) })); }
    }
    if (!normalized.some(f => f.path.toLowerCase() === 'index.html')) throw new Error('ZIP 안에서 index.html을 찾지 못했습니다.');
    dirty.clear(); setProjectFiles(normalized); normalized.forEach(f => dirty.add(f.path)); openProjectFile('index.html');
    toast(`${normalized.length}개 파일을 불러왔습니다. 주소를 입력하고 배포하세요.`);
  } catch (err) { toast('ZIP 업로드 실패: ' + err.message, 'err'); }
  e.target.value = '';
});

// 파일 저장: 편집 중이면 해당 파일만 서버에 즉시 반영
$('#saveFileBtn').onclick = async () => {
  commitActive();
  const f = projectFiles.get(activePath); if (!f) return;
  if (f.binary || !textExt.test(activePath)) return toast('이미지·폰트 등 바이너리 파일은 코드 편집할 수 없습니다.', 'err');
  if (editing && !editing.legacy) {
    try {
      await busy($('#saveFileBtn'), '저장 중…', () => api('/api/sites', { method: 'POST', body: JSON.stringify({ slug: editing.slug, filePath: activePath, content: f.base64 }) }));
      markDirty(activePath, false); renderFileTree();
      toast(`${activePath} 저장 완료 · 사이트에 바로 반영됐어요`, 'ok', { href: '/' + editing.slug, label: '사이트 보기' });
    } catch (e) { toast(e.message, 'err'); }
  } else toast(`${activePath} 변경 내용을 프로젝트에 반영했습니다. [배포] 버튼으로 공개하세요.`);
};

// 전체 배포
$('#saveBtn').onclick = async () => {
  commitActive();
  const slug = $('#slug').value.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug)) return toast('사이트 주소는 영문 소문자, 숫자, 하이픈으로 1~40자까지 입력하세요.', 'err');
  if (!projectFiles.has('index.html')) return toast('index.html이 없습니다.', 'err');
  try {
    const payload = { slug, title: $('#title').value.trim(), files: [...projectFiles.values()].map(f => ({ path: f.path, content: f.base64 })) };
    const d = await busy($('#saveBtn'), '배포 중…', () => api('/api/sites', { method: 'POST', body: JSON.stringify(payload) }));
    dirty.clear(); setEditMode({ slug, legacy: editing?.slug === slug ? editing.legacy : false }); updateDirtyUI(); renderFileTree();
    await loadSites();
    toast(`${d.files || 1}개 파일 배포 완료!`, 'ok', { href: d.url, label: '사이트 열기', ms: 7000 });
  } catch (e) { toast(e.message, 'err'); }
};

// ---------- 내 사이트 목록 / 편집 / 삭제 ----------
async function loadSites() {
  const box = $('#sitesList');
  try {
    const d = await api('/api/sites');
    box.innerHTML = '';
    if (d.admin) statusEl.textContent = '● 관리자' + (auth.currentUser?.email ? ' · ' + auth.currentUser.email : '');
    $('#siteCount').textContent = d.sites.length ? d.sites.length + '개' : '';
    if (!d.sites.length) { box.innerHTML = '<div class="empty">아직 공개한 사이트가 없어요.<br>‘＋ 새 사이트’로 첫 사이트를 만들어 보세요.</div>'; return; }
    d.sites.forEach(s => {
      const el = document.createElement('div'); el.className = 'site' + (editing?.slug === s.slug ? ' editing' : '') + (s.invalid ? ' bad' : ''); el.dataset.slug = s.slug;
      el.innerHTML = `<div><div class="site-name">${esc(s.slug)}${s.invalid ? ' <span class="tag warn">이름 확인 필요</span>' : ''}${editing?.slug === s.slug ? ' <span class="tag live">편집 중</span>' : ''}${s.owner && !s.mine ? ` <span class="tag">${s.owner === 'legacy' ? '구버전' : '다른 사용자 ' + esc(s.owner.slice(0, 6))}</span>` : ''}</div><a class="site-url" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a><div class="pages">${(s.pages || []).length > 1 ? s.pages.map(p => `<a href="${esc(s.url + (p === 'index.html' ? '' : '/' + p.replace(/\.html?$/i, '')))}" target="_blank" rel="noopener">${esc(p.replace(/\.html?$/i, ''))}</a>`).join('') : ''}</div><div class="site-meta">${s.files ? s.files + '개 파일 · ' : ''}${s.updatedAt ? new Date(s.updatedAt).toLocaleString('ko-KR') : ''}</div></div><div class="site-actions"><button class="primary" data-edit="${esc(s.slug)}"${s.invalid ? ' disabled title="영문 소문자·숫자·하이픈 이름만 편집할 수 있어요"' : ''}>편집</button><button class="secondary" data-copy="${esc(s.url)}">URL 복사</button><button class="secondary" data-del="${esc(s.slug)}" data-owner="${d.admin ? esc(s.owner || '') : ''}">삭제</button></div>`;
      box.appendChild(el);
    });
    box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => loadSite(b.dataset.edit, b));
    box.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = '복사됨 ✓'; setTimeout(() => b.textContent = 'URL 복사', 1200); } catch { prompt('URL을 복사하세요', b.dataset.copy); } });
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteSite(b.dataset.del, b.dataset.owner));
  } catch (e) { box.innerHTML = '<div class="empty">사이트 목록을 불러오지 못했습니다: ' + esc(e.message) + '</div>'; }
}
async function loadSite(slug, btn) {
  if (editing?.slug !== slug && !confirmDiscard()) return;
  const run = async () => {
    const d = await api('/api/sites?slug=' + encodeURIComponent(slug));
    const metas = Array.isArray(d.files) ? d.files : [];
    const files = [];
    if (!d.legacy && metas.length) {
      // 파일을 6개씩 병렬로 불러오기
      for (let i = 0; i < metas.length; i += 6) {
        const part = await Promise.all(metas.slice(i, i + 6).map(async m => {
          try { const it = await api('/api/sites?slug=' + encodeURIComponent(slug) + '&file=' + encodeURIComponent(m.path)); return { path: m.path, base64: it.content, binary: !textExt.test(m.path) }; }
          catch (err) { if (m.path === 'index.html' && d.html) return { path: 'index.html', base64: toBase64(enc(d.html)), text: d.html, binary: false }; throw new Error(`${m.path} 불러오기 실패: ${err.message}`); }
        }));
        files.push(...part);
      }
    }
    if (!files.length) files.push({ path: 'index.html', base64: toBase64(enc(d.html || DEFAULT_HTML)), text: d.html || DEFAULT_HTML, binary: false });
    dirty.clear(); setProjectFiles(files);
    $('#slug').value = d.slug; $('#title').value = d.title || '';
    setEditMode({ slug: d.slug, legacy: !!d.legacy });
    openProjectFile(files.some(f => f.path === 'index.html') ? 'index.html' : files[0].path);
    showView('editor');
    toast(`/${d.slug} 편집을 시작합니다 · 파일 ${files.length}개`);
    await loadSites();
  };
  try { btn ? await busy(btn, '불러오는 중…', run) : await run(); } catch (e) { toast(e.message, 'err'); }
}
async function deleteSite(slug, owner) {
  if (!confirm(`/${slug} 사이트를 삭제할까요? 되돌릴 수 없습니다.`)) return;
  try {
    await api('/api/sites?slug=' + encodeURIComponent(slug) + (owner ? '&owner=' + encodeURIComponent(owner) : ''), { method: 'DELETE' });
    toast(`/${slug} 삭제됨`);
    if (editing?.slug === slug) resetEditor(true);
    await loadSites();
  } catch (e) { toast(e.message, 'err'); }
}
$('#refreshBtn').onclick = loadSites;

// ---------- 로그인 상태 ----------
async function render(user) {
  if (user || adminCookie) {
    statusEl.textContent = adminCookie ? '● 관리자' : '● ' + (user.email || user.phoneNumber || '로그인됨');
    statusEl.style.color = 'var(--ok)';
    loginBox.classList.add('hidden'); app.classList.remove('hidden'); $('#logoutBtn').classList.remove('hidden');
    setMsg('');
    await loadSites(); if (!projectFiles.size) resetEditor(true); else preview();
  } else {
    statusEl.textContent = '로그인 필요'; statusEl.style.color = '';
    loginBox.classList.remove('hidden'); app.classList.add('hidden'); $('#logoutBtn').classList.add('hidden');
    $('#sitesList').innerHTML = '<div class="empty">로그인하면 만든 사이트 목록이 표시됩니다.</div>';
  }
}
onAuthStateChanged(auth, async user => {
  // 이메일 인증을 방금 마쳤다면 최신 토큰으로 갱신
  if (user && user.email && !user.emailVerified) { try { await user.reload(); await user.getIdToken(true); } catch {} }
  try {
    const r = await fetch('/api/auth', { credentials: 'same-origin' });
    adminCookie = !!(await r.json()).authenticated;
  } catch { adminCookie = false; }
  await render(user);
});
