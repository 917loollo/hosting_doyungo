import { createRemoteJWKSet, jwtVerify } from 'jose';

const PROJECT = process.env.FIREBASE_PROJECT_ID || 'doyungo-host';
const JWKS_URL = process.env.FIREBASE_JWKS_URL
  || 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'loollo@doyungo.com').toLowerCase();
const keys = createRemoteJWKSet(new URL(JWKS_URL));

// Authorization: Bearer <Firebase ID token> 을 검증하고 사용자 정보를 돌려줍니다.
export async function getUser(req) {
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
    // 이메일 인증이 끝난 계정만 관리자로 인정 (남이 같은 이메일로 가입해 사칭하는 것 방지)
    const isAdmin = !!email && email === ADMIN_EMAIL && payload.email_verified === true;
    return { uid: payload.sub, email, phone: payload.phone_number || '', isAdmin };
  } catch {
    return null;
  }
}

export function unauthorized(res) {
  return res.status(401).json({ error: '로그인이 필요합니다.' });
}
