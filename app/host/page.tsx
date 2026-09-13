 "use client";

import { useEffect, useState } from "react";

type Site = { slug: string; url: string };

const sampleHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>내 사이트</title>
<style>
body{margin:0;min-height:100vh;display:flex;justify-content:center;align-items:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f5f5f7}
.box{text-align:center}h1{font-size:50px}
</style>
</head>
<body><div class="box"><h1>안녕하세요 👋</h1><p>DOYUNGO HOST에서 만든 사이트입니다.</p></div></body>
</html>`;

export default function HostPage() {
  const [loggedIn,setLoggedIn]=useState(false);
  const [password,setPassword]=useState("");
  const [slug,setSlug]=useState("");
  const [html,setHtml]=useState("");
  const [sites,setSites]=useState<Site[]>([]);
  const [message,setMessage]=useState("");
  const [preview,setPreview]=useState(false);

  useEffect(()=>{
    if(sessionStorage.getItem("doyun_host_login")==="yes"){
      setLoggedIn(true); loadSites();
    }
  },[]);

  async function login(){
    setMessage("로그인 중...");
    const r=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
    if(!r.ok){setMessage("비밀번호가 올바르지 않습니다.");return;}
    sessionStorage.setItem("doyun_host_login","yes");setLoggedIn(true);setMessage("");loadSites();
  }

  async function logout(){
    await fetch("/api/auth/logout",{method:"POST"});
    sessionStorage.removeItem("doyun_host_login");setLoggedIn(false);
  }

  async function loadSites(){
    const r=await fetch("/api/sites");
    if(!r.ok)return;
    const data=await r.json();setSites(data.sites||[]);
  }

  async function createSite(){
    setMessage("저장 중...");
    const r=await fetch("/api/sites",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug,html})});
    const data=await r.json();
    if(!r.ok){setMessage(data.error||"오류가 발생했습니다.");return;}
    setMessage(`완료! /${data.slug} 사이트가 만들어졌습니다.`);
    await loadSites();
  }

  async function deleteSite(siteSlug:string){
    if(!confirm(`${siteSlug} 사이트를 삭제할까요?`))return;
    await fetch(`/api/sites/${siteSlug}`,{method:"DELETE"});
    loadSites();
  }

  function editSite(site:Site){
    setSlug(site.slug);
    setMessage("주소를 입력했습니다. HTML 코드를 다시 입력한 후 저장하세요.");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function copyURL(siteSlug:string){
    await navigator.clipboard.writeText(`${window.location.origin}/${siteSlug}`);
    setMessage("주소가 복사되었습니다.");
  }

  if(!loggedIn) return (
    <main className="center"><section className="glass login">
      <div className="logo-small">DOYUNGO HOST</div><h1>로그인</h1>
      <p>호스팅 관리 페이지입니다.</p>
      <label className="label">관리자 비밀번호</label>
      <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter")login()}} placeholder="비밀번호"/>
      <button className="primary" onClick={login} style={{width:"100%",marginTop:15}}>로그인</button>
      {message&&<div className="status">{message}</div>}
    </section></main>
  );

  return (
    <main className="host">
      <header className="topbar"><div className="topbar-left"><div className="topbar-logo">DOYUNGO</div><div className="badge">HOST</div></div>
      <button className="logout" onClick={logout}>로그아웃</button></header>

      <section className="hero">
        <div className="logo-small">WEBSITE HOSTING</div><h1>나만의 사이트 만들기</h1>
        <p>HTML 코드를 입력하면 원하는 주소로 바로 공개됩니다.</p>

        <div className="panel">
          <label className="label">주소 이름</label>
          <input className="input" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,""))} placeholder="예: game"/>
          <div className="address">주소: <span className="domain">/{slug||"원하는이름"}</span></div><br/>
          <label className="label">HTML 코드</label>
          <textarea className="code" value={html} onChange={e=>setHtml(e.target.value)} placeholder="<!DOCTYPE html>..."/>
          <div className="actions">
            <button className="secondary" onClick={()=>setHtml(sampleHTML)}>샘플 불러오기</button>
            <button className="secondary" onClick={()=>setPreview(!preview)}>{preview?"미리보기 닫기":"미리보기"}</button>
            <button className="primary" onClick={createSite}>사이트 만들기</button>
          </div>
          {message&&<div className="status">{message}</div>}
        </div>

        {preview&&html&&<div className="panel"><h3>미리보기</h3><iframe className="preview" srcDoc={html} title="preview" sandbox="allow-scripts"/></div>}
      </section>

      <section className="panel">
        <div className="list-header"><h2>내 사이트</h2><span>{sites.length}개</span></div>
        {sites.length===0?<div className="empty">아직 만든 사이트가 없습니다.</div>:
          sites.map(site=><div className="site" key={site.slug}>
            <div className="site-info"><div className="site-name">{site.slug}</div>
              <div className="site-url">{window.location.origin}/{site.slug}</div></div>
            <div className="site-actions">
              <a className="secondary" href={`/${site.slug}`} target="_blank">열기</a>
              <button className="secondary" onClick={()=>copyURL(site.slug)}>주소 복사</button>
              <button className="secondary" onClick={()=>editSite(site)}>수정</button>
              <button className="delete" onClick={()=>deleteSite(site.slug)}>삭제</button>
            </div>
          </div>)
        }
      </section>
    </main>
  );
}