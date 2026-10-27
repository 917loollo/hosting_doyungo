import { ok, makeSession, passwordMatches, sessionCookie } from './_auth.js';

export default async function handler(req, res) {
  const method = req.method || 'GET';

  if (method === 'GET') {
    return res.status(200).json({ authenticated: ok(req) });
  }

  if (method === 'POST') {
    if (!process.env.ADMIN_PASSWORD) {
      return res.status(500).json({ error: 'Vercel 환경변수 ADMIN_PASSWORD가 설정되지 않았습니다.' });
    }
    let body = {};
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch {}
    if (!passwordMatches(body.password)) {
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    }
    res.setHeader('Set-Cookie', sessionCookie(makeSession()));
    return res.status(200).json({ ok: true });
  }

  if (method === 'DELETE') {
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
