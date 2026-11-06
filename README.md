# doyungo.com Hosting — Firebase 로그인 edition

누구나 가입해서 자기 HTML 사이트를 `/<이름>` 주소로 공개할 수 있는 호스팅 서비스입니다.

## 구조
- 로그인: Firebase Auth (이메일/비밀번호, 전화번호, Google). 브라우저가 받은 ID 토큰을 `Authorization: Bearer`로 API에 보냅니다.
- 서버(`api/_auth.js`)가 Google 공개키(JWKS)로 토큰을 검증합니다. 서비스 계정 키는 필요 없습니다.
- 저장(Vercel Blob, Private):
  - `sites/{uid}/{slug}.html` — 사용자 사이트
  - `slugs/{slug}.json` — 주소 소유자 기록 (먼저 만든 사람이 소유)
  - `sites/{slug}.html` — 구버전 사이트 (계속 서비스되지만 콘솔에서는 수정 불가)
- 사용자당 사이트 20개, HTML 2MB 제한 (`api/_store.js`, `api/sites.js`에서 변경).
- `/:slug`는 `/api/site`가 Blob에서 읽어 출력하며, 응답에 `Content-Security-Policy: sandbox`를 붙여
  사용자 HTML이 콘솔의 로그인 정보를 읽지 못하게 격리합니다.

## 환경변수 (Vercel)
- `BLOB_READ_WRITE_TOKEN` (필수)
- `PUBLIC_BASE_URL` (선택, 예: `https://doyungo.com`)
- `FIREBASE_PROJECT_ID` (선택, 기본값 `doyungo-host`)
- `ADMIN_PASSWORD`는 더 이상 쓰지 않습니다.

## Firebase 콘솔 설정 (필수)
1. Authentication → Sign-in method에서 **이메일/비밀번호, 전화, Google** 사용 설정.
2. Authentication → Settings → **승인된 도메인**에 `hosting-doyungo.vercel.app`, `doyungo.com`(및 `www.`) 추가.
3. 전화 인증은 SMS 발송량 제한/요금이 있으니 Firebase 요금제를 확인하세요.

## 배포
GitHub에 올리고 Vercel에서 Redeploy. Blob은 Private 그대로 유지합니다.
