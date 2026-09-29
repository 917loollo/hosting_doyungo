export function cookie(req,name){const raw=req.headers.cookie||'';const m=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));return m?decodeURIComponent(m.slice(name.length+1)):''}
export function ok(req){return cookie(req,'doyun_host_admin')==='1' && !!process.env.ADMIN_PASSWORD}
export function unauthorized(){return new Response(JSON.stringify({error:'로그인이 필요합니다.'}),{status:401,headers:{'Content-Type':'application/json'}})}
