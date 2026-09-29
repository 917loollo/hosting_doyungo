import { get, del } from '@vercel/blob';
import { ok, unauthorized } from '../_auth.js';
const token=()=>process.env.BLOB_READ_WRITE_TOKEN;
function valid(s){return typeof s==='string'&&/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(s)&&!['api','favicon','index','host'].includes(s)}
function titleFromHtml(html){const m=String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);return m?m[1].replace(/\s+/g,' ').trim():''}
export default async function handler(req,res){if(!ok(req))return unauthorized(res);const slug=req.query?.slug;if(!valid(slug))return res.status(400).json({error:'잘못된 사이트 이름입니다.'});try{
 if(req.method==='GET'){const r=await get(`sites/${slug}.html`,{access:'public',useCache:false,token:token()});if(!r?.blob)return res.status(404).json({error:'사이트를 찾을 수 없습니다.'});return res.status(200).json({slug,html:await r.blob.text(),title:titleFromHtml(await r.blob.text())})}
 if(req.method==='DELETE'){await del(`sites/${slug}.html`,{token:token()});return res.status(200).json({ok:true})}
 return res.status(405).json({error:'Method Not Allowed'})
}catch(e){console.error(e);if(req.method==='GET')return res.status(404).json({error:'사이트를 찾을 수 없습니다.'});return res.status(500).json({error:e.message||'서버 오류'})}}
