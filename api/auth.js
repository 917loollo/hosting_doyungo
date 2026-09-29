import { cookie } from './_auth.js';
export default async function handler(req,res){
 const method=req.method||'GET';
 if(method==='GET'){return res.status(200).json({authenticated:cookie(req,'doyun_host_admin')==='1'&&!!process.env.ADMIN_PASSWORD})}
 if(method==='POST'){let body={};try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{}}catch{} if(!process.env.ADMIN_PASSWORD)return res.status(500).json({error:'Vercel 환경변수 ADMIN_PASSWORD가 설정되지 않았습니다.'}); if(body.password!==process.env.ADMIN_PASSWORD)return res.status(401).json({error:'비밀번호가 올바르지 않습니다.'}); res.setHeader('Set-Cookie','doyun_host_admin=1; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800');return res.status(200).json({ok:true})}
 if(method==='DELETE'){res.setHeader('Set-Cookie','doyun_host_admin=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0');return res.status(200).json({ok:true})}
 return res.status(405).json({error:'Method Not Allowed'})
}
