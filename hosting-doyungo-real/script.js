import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  GoogleAuthProvider, signInWithPopup,
  RecaptchaVerifier, signInWithPhoneNumber
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
  if (!user) throw new Error('로그인이 필요합니다.');
  const idToken = await user.getIdToken();
  const headers = { Authorization: 'Bearer ' + idToken, ...(opt.body ? { 'Content-Type': 'application/json' } : {}), ...(opt.headers || {}) };
  const r = await fetch(url, { ...opt, headers });
  let d = {}; try { d = await r.json(); } catch {}
  if (!r.ok) throw new Error(d.error || '요청에 실패했습니다.');
  return d;
}

const DEFAULT_HTML = '<!doctype html>\n<html lang="ko">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>내 사이트</title></head>\n<body><h1>안녕하세요 👋</h1><p>DOYUNGO HOST로 만든 사이트입니다.</p></body>\n</html>';
function preview() { $('#previewFrame').srcdoc = $('#htmlCode').value; }
function resetEditor() { $('#slug').value = ''; $('#title').value = ''; $('#htmlCode').value = DEFAULT_HTML; preview(); $('#slug').focus(); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ---------- 탭 ----------
document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
  ['email', 'phone', 'google'].forEach(n => $('#pane-' + n).classList.toggle('hidden', n !== t.dataset.tab));
  setMsg('');
});

// ---------- 이메일 ----------
const creds = () => [$('#email').value.trim(), $('#password').value];
$('#emailLoginBtn').onclick = async () => { try { await signInWithEmailAndPassword(auth, ...creds()); } catch (e) { fail(e); } };
$('#emailSignupBtn').onclick = async () => { try { await createUserWithEmailAndPassword(auth, ...creds()); } catch (e) { fail(e); } };
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

$('#logoutBtn').onclick = () => signOut(auth);

// ---------- 에디터 ----------
$('#previewBtn').onclick = preview; $('#refreshPreview').onclick = preview;
$('#htmlCode').addEventListener('input', preview); $('#newBtn').onclick = resetEditor;
$('#saveBtn').onclick = async () => {
  const slug = $('#slug').value.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug)) { alert('사이트 주소는 영문 소문자, 숫자, 하이픈으로 1~40자까지 입력하세요.'); return; }
  const html = $('#htmlCode').value;
  if (!html.trim()) { alert('HTML 코드를 입력하세요.'); return; }
  try {
    const d = await api('/api/sites', { method: 'POST', body: JSON.stringify({ slug, html, title: $('#title').value.trim() }) });
    await loadSites();
    if (confirm('공개 URL이 만들어졌습니다!\n\n' + d.url + '\n\n지금 열어볼까요?')) window.open(d.url, '_blank', 'noopener');
  } catch (e) { alert(e.message); }
};

async function loadSites() {
  const box = $('#sitesList');
  try {
    const d = await api('/api/sites');
    box.innerHTML = '';
    if (!d.sites.length) { box.innerHTML = '<div class="empty">아직 공개한 사이트가 없습니다. 위에서 첫 사이트를 만들어보세요.</div>'; return; }
    d.sites.forEach(s => {
      const el = document.createElement('div'); el.className = 'site';
      el.innerHTML = `<div><div class="site-name">${esc(s.slug)}</div><a class="site-url" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a><div class="site-meta">${s.updatedAt ? new Date(s.updatedAt).toLocaleString('ko-KR') : ''}</div></div><div class="site-actions"><button class="btn-secondary" data-edit="${esc(s.slug)}">편집</button><button class="btn-secondary" data-copy="${esc(s.url)}">URL 복사</button><button class="btn-secondary" data-del="${esc(s.slug)}">삭제</button></div>`;
      box.appendChild(el);
    });
    box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => loadSite(b.dataset.edit));
    box.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = '복사됨 ✓'; setTimeout(() => b.textContent = 'URL 복사', 1200); } catch { prompt('URL을 복사하세요', b.dataset.copy); } });
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteSite(b.dataset.del));
  } catch (e) { box.innerHTML = '<div class="empty">사이트 목록을 불러오지 못했습니다: ' + esc(e.message) + '</div>'; }
}
async function loadSite(slug) {
  try {
    const d = await api('/api/sites/' + encodeURIComponent(slug));
    $('#slug').value = d.slug; $('#title').value = d.title || ''; $('#htmlCode').value = d.html; preview();
    document.querySelector('#editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) { alert(e.message); }
}
async function deleteSite(slug) {
  if (!confirm(`/${slug} 사이트를 삭제할까요?`)) return;
  try { await api('/api/sites/' + encodeURIComponent(slug), { method: 'DELETE' }); await loadSites(); resetEditor(); } catch (e) { alert(e.message); }
}
$('#refreshBtn').onclick = loadSites;

// ---------- 로그인 상태 ----------
onAuthStateChanged(auth, async user => {
  if (user) {
    statusEl.textContent = '● ' + (user.email || user.phoneNumber || '로그인됨');
    statusEl.style.color = '#16834a';
    loginBox.classList.add('hidden'); app.classList.remove('hidden');
    setMsg('');
    await loadSites(); preview();
  } else {
    statusEl.textContent = '로그인 필요'; statusEl.style.color = '#64748b';
    loginBox.classList.remove('hidden'); app.classList.add('hidden');
    $('#sitesList').innerHTML = '<div class="empty">로그인하면 만든 사이트 목록이 표시됩니다.</div>';
  }
});
preview();
