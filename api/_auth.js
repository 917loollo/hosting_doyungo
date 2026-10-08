export function cookie(req, name) {
  const raw = req.headers?.cookie || '';
  const m = raw.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
}

export function ok(req) {
  return cookie(req, 'doyun_host_admin') === '1' && !!process.env.ADMIN_PASSWORD;
}

// Node.js Vercel Function용 응답 헬퍼입니다.
// 절대로 Response 객체를 반환하지 않습니다.
export function unauthorized(res) {
  return res.status(401).json({ error: '로그인이 필요합니다.' });
}
