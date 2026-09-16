"use client";

import { useEffect, useState } from "react";

const starter = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Site</title>\n</head>\n<body>\n  <h1>안녕하세요 👋</h1>\n  <p>나만의 사이트입니다.</p>\n</body>\n</html>`;

type Site = { slug: string; url: string; uploadedAt: string };

export default function HostPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [html, setHtml] = useState(starter);
  const [sites, setSites] = useState<Site[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const r = await fetch("/api/sites", { cache: "no-store" });
    if (r.ok) setSites((await r.json()).sites ?? []);
  }

  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(data => { setAuthenticated(Boolean(data.authenticated)); if (data.authenticated) refresh(); }).finally(() => setChecking(false));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await r.json();
    if (!r.ok) return setError(data.error ?? "로그인에 실패했습니다.");
    setAuthenticated(true); setPassword(""); refresh();
  }

  async function save() {
    setBusy(true); setError(""); setMessage("");
    const clean = slug.trim().toLowerCase();
    const r = await fetch(`/api/sites${sites.some(s => s.slug === clean) ? `/${encodeURIComponent(clean)}` : ""}`, {
      method: sites.some(s => s.slug === clean) ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: clean, html })
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) return setError(data.error ?? "저장에 실패했습니다.");
    setMessage(`저장 완료: /${clean}`); await refresh();
  }

  async function removeSite(s: Site) {
    if (!confirm(`/${s.slug} 사이트를 삭제할까요?`)) return;
    const r = await fetch(`/api/sites/${encodeURIComponent(s.slug)}`, { method: "DELETE" });
    if (r.ok) { setSites(prev => prev.filter(x => x.slug !== s.slug)); setMessage(`/${s.slug} 삭제 완료`); }
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); setAuthenticated(false); }

  if (checking) return <main className="shell"><section className="glass card"><p>확인 중...</p></section></main>;
  if (!authenticated) return <main className="shell"><section className="glass card" style={{maxWidth:520,margin:"80px auto"}}><p className="label">DOYUN HOST</p><h1>관리자 로그인</h1><p className="muted">Vercel 환경변수 <b>ADMIN_PASSWORD</b>를 사용합니다.</p><form onSubmit={login}><input type="password" placeholder="관리자 비밀번호" value={password} onChange={e=>setPassword(e.target.value)} /><div className="spacer"/><button className="btn" type="submit">로그인</button>{error && <p className="error">{error}</p>}</form></section></main>;

  return <main className="shell"><div className="row" style={{justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div><p className="label">DOYUN HOST</p><h1 style={{margin:"0 0 6px"}}>HTML 호스팅</h1><p className="muted" style={{margin:0}}>doyungo.com/원하는이름</p></div><button className="btn secondary" onClick={logout}>로그아웃</button></div>
    <section className="glass card"><div className="grid" style={{marginTop:0}}><div><div className="label">주소 이름 (slug)</div><input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="예: test"/><p className="muted">영문 소문자, 숫자, -, _ 사용</p></div><div><div className="label">완성 주소</div><input readOnly value={slug ? `${location.origin}/${slug}` : "주소 이름을 입력하세요"}/></div></div>
      <div className="label" style={{marginTop:18}}>HTML 코드</div><textarea value={html} onChange={e=>setHtml(e.target.value)} spellCheck={false}/><div className="row" style={{marginTop:14}}><button className="btn" onClick={save} disabled={busy}>{busy ? "저장 중..." : "사이트 저장"}</button><button className="btn secondary" onClick={()=>setHtml(starter)}>기본 코드</button></div>{message && <p className="ok">{message}</p>}{error && <p className="error">{error}</p>}
      <div className="label" style={{marginTop:22}}>미리보기</div><iframe className="preview" title="preview" srcDoc={html}/>
    </section>
    <section className="glass card" style={{marginTop:18}}><h2 style={{marginTop:0}}>내 사이트</h2>{sites.length===0 ? <p className="muted">아직 만든 사이트가 없습니다.</p> : <div className="site-list">{sites.map(s=><div className="site-item" key={s.slug}><a href={`/${s.slug}`} target="_blank" rel="noreferrer"><b>/{s.slug}</b></a><div className="row"><button className="btn secondary" onClick={()=>{setSlug(s.slug); fetch(`/api/sites`).then(()=>{});}}>선택</button><button className="btn secondary" onClick={()=>removeSite(s)}>삭제</button></div></div>)}</div>}</section>
  </main>;
}
