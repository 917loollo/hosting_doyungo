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
  if (!r.ok) throw new Error(d.error || '요청에 실패했습니다.');
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

// ---------- GitHub 스타일 프로젝트 에디터 ----------
let projectFiles = new Map(); // path -> { base64, text, binary }
let activePath = 'index.html';
let projectMode = false;
const toBase64 = bytes => { let bin=''; const chunk=0x8000; for(let i=0;i<bytes.length;i+=chunk) bin += String.fromCharCode(...bytes.subarray(i,i+chunk)); return btoa(bin); };
const fromBase64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
const textExt = /\.(html?|css|js|mjs|json|txt|xml|svg|md|csv|webmanifest|php|yml|yaml)$/i;
function setProjectFiles(files) {
  projectFiles = new Map(files.map(f => [f.path, f]));
  activePath = '';
  projectMode = true;
  renderFileTree();
}
function renderFileTree() {
  const tree = $('#fileTree'); tree.innerHTML = '';
  const paths = [...projectFiles.keys()].sort((a,b) => a.localeCompare(b));
  $('#fileCount').textContent = paths.length;
  paths.forEach(path => {
    const btn = document.createElement('button'); btn.type='button'; btn.className='file-item'+(path===activePath?' active':'');
    btn.textContent = (path.includes('/') ? '📁 ' : '📄 ') + path; btn.title=path;
    btn.onclick = () => openProjectFile(path);
    tree.appendChild(btn);
  });
}
$('#addFileBtn')?.addEventListener('click', () => {
  const path=prompt('새 파일 경로를 입력하세요. 예: assets/style.css');
  if(!path) return;
  const clean=path.trim().replace(/\\/g,'/').replace(/^\/+/, '');
  if(!clean || clean.split('/').some(x=>!x || x==='.' || x==='..') || projectFiles.has(clean)) return alert('파일 경로가 올바르지 않거나 이미 존재합니다.');
  const text=''; projectFiles.set(clean,{path:clean,text,base64:toBase64(new TextEncoder().encode(text)),binary:false}); openProjectFile(clean);
});
$('#deleteFileBtn')?.addEventListener('click', () => {
  if(projectFiles.size<=1) return alert('사이트에는 최소 한 개 파일이 필요합니다.');
  if(!confirm(`${activePath} 파일을 프로젝트에서 삭제할까요?`)) return;
  projectFiles.delete(activePath); activePath=projectFiles.has('index.html')?'index.html':[...projectFiles.keys()][0]; openProjectFile(activePath);
});
function openProjectFile(path) {
  const file = projectFiles.get(path); if (!file) return;
  // 현재 편집 내용을 먼저 보존
  if (activePath !== path && activePath && projectFiles.has(activePath) && !projectFiles.get(activePath).binary) {
    const current = projectFiles.get(activePath); current.text = $('#htmlCode').value; current.base64 = toBase64(new TextEncoder().encode(current.text));
  }
  activePath = path; $('#activeFileName').textContent = path;
  const item = projectFiles.get(path);
  if (item.binary || !textExt.test(path)) {
    $('#htmlCode').value = `이 파일은 텍스트 편집기에서 열 수 없는 바이너리 파일입니다.\n\n파일: ${path}\n업로드 및 배포에는 포함됩니다.`;
    $('#htmlCode').readOnly = true;
  } else {
    $('#htmlCode').readOnly = false;
    if (item.text === undefined) item.text = new TextDecoder().decode(fromBase64(item.base64));
    $('#htmlCode').value = item.text;
  }
  renderFileTree(); preview();
}
function preview() { if (activePath === 'index.html' || !projectMode) $('#previewFrame').srcdoc = $('#htmlCode').value; }
function resetEditor() {
  $('#slug').value=''; $('#title').value=''; $('#htmlCode').readOnly=false; $('#htmlCode').value=DEFAULT_HTML;
  projectFiles = new Map([['index.html',{path:'index.html',text:DEFAULT_HTML,base64:toBase64(new TextEncoder().encode(DEFAULT_HTML))}]]);
  activePath=''; projectMode=true; renderFileTree(); openProjectFile('index.html'); preview(); $('#slug').focus();
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
$('#previewBtn').onclick=preview; $('#refreshPreview').onclick=preview;
$('#htmlCode').addEventListener('input', () => {
  if (projectFiles.has(activePath) && !projectFiles.get(activePath).binary) {
    const f=projectFiles.get(activePath); f.text=$('#htmlCode').value; f.base64=toBase64(new TextEncoder().encode(f.text));
  }
  if (activePath==='index.html' || !projectMode) preview();
});
$('#newBtn').onclick=resetEditor;
$('#zipInput').addEventListener('change', async e => {
  const file=e.target.files?.[0]; if(!file) return;
  try {
    if(!window.JSZip) throw new Error('ZIP 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 시도하세요.');
    const zip=await JSZip.loadAsync(file); const loaded=[]; let total=0;
    for(const [path,entry] of Object.entries(zip.files)) {
      if(entry.dir) continue;
      const clean=path.replace(/^\.\//,'');
      if(!clean || clean.startsWith('__MACOSX/') || clean.endsWith('.DS_Store')) continue;
      if(loaded.length >= 100) throw new Error('한 프로젝트에는 최대 100개 파일까지 업로드할 수 있습니다.');
      const bytes=await entry.async('uint8array'); total+=bytes.length;
      if(total>3*1024*1024) throw new Error('압축 해제 후 전체 파일 크기는 3MB 이하만 가능합니다.');
      const binary=!textExt.test(clean);
      loaded.push({path:clean,base64:toBase64(bytes),binary,text:binary?undefined:new TextDecoder().decode(bytes)});
    }
    // zip 안의 최상위 폴더 한 겹은 자동으로 벗겨 index.html을 찾음
    let normalized=loaded;
    if(!loaded.some(f=>f.path.toLowerCase()==='index.html')) {
      const roots=[...new Set(loaded.map(f=>f.path.split('/')[0]))];
      if(roots.length===1) {
        const root=roots[0]+'/'; normalized=loaded.filter(f=>f.path.startsWith(root)).map(f=>({...f,path:f.path.slice(root.length)}));
      }
    }
    if(!normalized.some(f=>f.path.toLowerCase()==='index.html')) throw new Error('ZIP 안에서 index.html을 찾지 못했습니다. 최상위 폴더에 index.html을 넣어 주세요.');
    setProjectFiles(normalized); openProjectFile('index.html');
    alert(`${normalized.length}개 파일을 불러왔습니다. 사이트 주소를 입력하고 [사이트 배포 / 업데이트]를 누르세요.`);
  } catch(err) { alert('ZIP 업로드 실패: '+err.message); }
  e.target.value='';
});
$('#saveFileBtn').onclick=()=>{
  if(!projectFiles.has(activePath)) return;
  const f=projectFiles.get(activePath); if(f.binary) return alert('이미지·폰트 등 바이너리 파일은 코드 편집할 수 없습니다.');
  f.text=$('#htmlCode').value; f.base64=toBase64(new TextEncoder().encode(f.text));
  alert(`${activePath} 변경 내용을 프로젝트에 반영했습니다. 전체 사이트 배포 버튼을 눌러 공개하세요.`);
};
$('#saveBtn').onclick = async () => {
  const slug=$('#slug').value.trim().toLowerCase();
  if(!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug)) return alert('사이트 주소는 영문 소문자, 숫자, 하이픈으로 1~40자까지 입력하세요.');
  try {
    let payload;
    if(projectMode && projectFiles.size) {
      if(projectFiles.has(activePath) && !projectFiles.get(activePath).binary) {
        const f=projectFiles.get(activePath); f.text=$('#htmlCode').value; f.base64=toBase64(new TextEncoder().encode(f.text));
      }
      if(!projectFiles.has('index.html')) return alert('index.html이 없습니다.');
      payload={slug,title:$('#title').value.trim(),files:[...projectFiles.values()].map(f=>({path:f.path,content:f.base64}))};
    } else {
      const html=$('#htmlCode').value; if(!html.trim()) return alert('HTML 코드를 입력하세요.');
      payload={slug,html,title:$('#title').value.trim()};
    }
    const d=await api('/api/sites',{method:'POST',body:JSON.stringify(payload)});
    $('#previewFrame').src=d.url;
    await loadSites();
    if(confirm(`${d.files||1}개 파일을 배포했습니다!\n\n${d.url}\n\n지금 열어볼까요?`)) window.open(d.url,'_blank','noopener');
  } catch(e) { alert(e.message); }
};

async function loadSites() {
  const box = $('#sitesList');
  try {
    const d = await api('/api/sites');
    box.innerHTML = '';
    if (d.admin) statusEl.textContent = '● 관리자' + (auth.currentUser?.email ? ' · ' + auth.currentUser.email : '');
    if (!d.sites.length) { box.innerHTML = '<div class="empty">아직 공개한 사이트가 없습니다. 위에서 첫 사이트를 만들어보세요.</div>'; return; }
    d.sites.forEach(s => {
      const el = document.createElement('div'); el.className = 'site';
      el.innerHTML = `<div><div class="site-name">${esc(s.slug)}${s.owner&&!s.mine?` <span class="tag">${s.owner==='legacy'?'구버전':'다른 사용자 '+esc(s.owner.slice(0,6))}</span>`:''}</div><a class="site-url" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a><div class="site-meta">${s.updatedAt ? new Date(s.updatedAt).toLocaleString('ko-KR') : ''}</div></div><div class="site-actions"><button class="btn-secondary" data-edit="${esc(s.slug)}">편집</button><button class="btn-secondary" data-copy="${esc(s.url)}">URL 복사</button><button class="btn-secondary" data-del="${esc(s.slug)}">삭제</button></div>`;
      box.appendChild(el);
    });
    box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => loadSite(b.dataset.edit));
    box.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = '복사됨 ✓'; setTimeout(() => b.textContent = 'URL 복사', 1200); } catch { prompt('URL을 복사하세요', b.dataset.copy); } });
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteSite(b.dataset.del));
  } catch (e) { box.innerHTML = '<div class="empty">사이트 목록을 불러오지 못했습니다: ' + esc(e.message) + '</div>'; }
}
async function loadSite(slug) {
  try {
    const d=await api('/api/sites/'+encodeURIComponent(slug));
    $('#slug').value=d.slug; $('#title').value=d.title||'';
    const files=[];
    if(Array.isArray(d.files) && d.files.length) {
      for(const meta of d.files) {
        try {
          const item=await api('/api/sites/'+encodeURIComponent(slug)+'?file='+encodeURIComponent(meta.path));
          files.push({path:meta.path,base64:item.content,binary:!textExt.test(meta.path)});
        } catch(err) { if(meta.path==='index.html' && d.html) files.push({path:'index.html',base64:toBase64(new TextEncoder().encode(d.html)),text:d.html,binary:false}); }
      }
    }
    if(!files.length) files.push({path:'index.html',base64:toBase64(new TextEncoder().encode(d.html||DEFAULT_HTML)),text:d.html||DEFAULT_HTML,binary:false});
    setProjectFiles(files); activePath=files.some(f=>f.path==='index.html')?'index.html':files[0].path; openProjectFile(activePath);
    document.querySelector('#editor').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(e) { alert(e.message); }
}
async function deleteSite(slug) {
  if (!confirm(`/${slug} 사이트를 삭제할까요?`)) return;
  try { await api('/api/sites/' + encodeURIComponent(slug), { method: 'DELETE' }); await loadSites(); resetEditor(); } catch (e) { alert(e.message); }
}
$('#refreshBtn').onclick = loadSites;

// ---------- 로그인 상태 ----------
async function render(user) {
  if (user || adminCookie) {
    statusEl.textContent = adminCookie ? '● 관리자' : '● ' + (user.email || user.phoneNumber || '로그인됨');
    statusEl.style.color = '#16834a';
    loginBox.classList.add('hidden'); app.classList.remove('hidden');
    setMsg('');
    await loadSites(); preview();
  } else {
    statusEl.textContent = '로그인 필요'; statusEl.style.color = '#64748b';
    loginBox.classList.remove('hidden'); app.classList.add('hidden');
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
preview();
