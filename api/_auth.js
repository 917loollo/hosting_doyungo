import crypto from 'node:crypto';

const COOKIE = 'doyun_host_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7일

const secret = () => process.env.ADMIN_PASSWORD || '';

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function cookie(req, name) {
  const raw = req.headers?.cookie || '';
  const m = raw.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
}

// 서명된 세션 토큰: "만료시각.서명" (쿠키 값을 직접 '1'로 위조해도 통과하지 못함)
export function makeSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  return `${exp}.${sign(exp)}`;
}

export function ok(req) {
  if (!secret()) return false;
  const token = cookie(req, COOKIE);
  const [exp, sig] = token.split('.');
  if (!exp || !sig) return false;
  if (!safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}

export function passwordMatches(input) {
  return !!secret() && typeof input === 'string' && safeEqual(input, secret());
}

export function sessionCookie(value, maxAge = MAX_AGE) {
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${maxAge}`;
}

// Node.js Vercel Function용 응답 헬퍼 (Response 객체를 반환하지 않음)
export function unauthorized(res) {
  return res.status(401).json({ error: '로그인이 필요합니다.' });
}
