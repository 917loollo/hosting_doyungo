import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const PROJECT = process.env.FIREBASE_PROJECT_ID || 'doyungo-host';
const JWKS_URL = process.env.FIREBASE_JWKS_URL
  || 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'loollo@doyungo.com').toLowerCase();
const keys = createRemoteJWKSet(new URL(JWKS_URL));

// ---------- 비밀번호 관리자 (Vercel 환경변수 ADMIN_PASSWORD) ----------
const COOKIE = 'doyun_host_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7일
const secret = () => process.env.ADMIN_PASSWORD || '';
const sign = payload => crypto.createHmac('sha256', secret()).update(payload).digest('hex');

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function cookie(req, name) {
  const raw = req.headers?.cookie || '';
  const m = raw.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
}

// 서명된 세션 "만료시각.서명" — 쿠키를 직접 만들어도 서명을 모르면 통과 못 함
export function makeSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  return `${exp}.${sign(exp)}`;
}

export function adminCookieOk(req) {
  if (!secret()) return false;
  const [exp, sig] = cookie(req, COOKIE).split('.');
  if (!exp || !sig) return false;
  return safeEqual(sig, sign(exp)) && Number(exp) > Date.now();
}

export function passwordMatches(input) {
  return !!secret() && typeof input === 'string' && safeEqual(input, secret());
}

export function sessionCookie(value, maxAge = MAX_AGE) {
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${maxAge}`;
}

// 관리자 쿠키 → Firebase 토큰 순서로 확인
export async function getUser(req) {
  if (adminCookieOk(req)) return { uid: 'admin', email: '', phone: '', isAdmin: true };
  const h = req.headers?.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: `https://securetoken.google.com/${PROJECT}`,
      audience: PROJECT
    });
    if (!payload.sub) return null;
    const email = (payload.email || '').toLowerCase();
    // 이메일 인증이 끝난 계정만 관리자로 인정 (사칭 방지)
    const isAdmin = !!email && email === ADMIN_EMAIL && payload.email_verified === true;
    return { uid: payload.sub, email, phone: payload.phone_number || '', isAdmin };
  } catch {
    return null;
  }
}

export function unauthorized(res) {
  return res.status(401).json({ error: '로그인이 필요합니다.' });
}
