# doyungo.com Hosting — Firebase 로그인 edition

누구나 가입해서 HTML 단일 파일 또는 ZIP으로 업로드한 다중 파일 사이트를 `/<이름>` 주소로 공개할 수 있는 호스팅 서비스입니다. ZIP 안의 `index.html`, CSS, JS, 이미지, 폰트와 폴더 구조를 보존합니다.

## 구조
- 로그인: Firebase Auth (이메일/비밀번호, 전화번호, Google). 브라우저가 받은 ID 토큰을 `Authorization: Bearer`로 API에 보냅니다.
- 서버(`api/_auth.js`)가 Google 공개키(JWKS)로 토큰을 검증합니다. 서비스 계정 키는 필요 없습니다.
- 저장(Vercel Blob, Private):
  - `sites/{uid}/{slug}/index.html` 및 프로젝트 내 모든 파일 — 사용자 사이트 (기존 `sites/{uid}/{slug}.html`도 호환)
  - `slugs/{slug}.json` — 주소 소유자 기록 (먼저 만든 사람이 소유)
  - `sites/{slug}.html` — 구버전 사이트 (계속 서비스되지만 콘솔에서는 수정 불가)
- 사용자당 사이트 20개. 프로젝트는 압축 해제 후 전체 3MB까지, 파일별 편집은 1MB까지 지원합니다 (`api/sites.js`에서 변경).
- `/:slug` 및 `/:slug/*`는 `/api/site`가 Blob에서 읽어 출력하며, 응답에 `Content-Security-Policy: sandbox`를 붙여
  사용자 HTML이 콘솔의 로그인 정보를 읽지 못하게 격리합니다.

## 환경변수 (Vercel)
- `BLOB_READ_WRITE_TOKEN` (필수)
- `PUBLIC_BASE_URL` (선택, 예: `https://doyungo.com`)
- `FIREBASE_PROJECT_ID` (선택, 기본값 `doyungo-host`)
- `ADMIN_EMAIL` (선택, 기본값 `loollo@doyungo.com`) — 이 이메일로 로그인하고 **이메일 인증이 끝난** 계정은 관리자입니다.
  관리자는 모든 사용자 사이트와 구버전 사이트를 보고 수정·삭제할 수 있습니다.
- `ADMIN_PASSWORD` (필수 아님, 관리자 로그인용) — 로그인 화면 아래 **관리자** 버튼에서 이 값으로 로그인하면 모든 사이트를 관리할 수 있습니다.

## Firebase 콘솔 설정 (필수)
1. Authentication → Sign-in method에서 **이메일/비밀번호, 전화, Google** 사용 설정.
2. Authentication → Settings → **승인된 도메인**에 `hosting-doyungo.vercel.app`, `doyungo.com`(및 `www.`) 추가.
3. 전화 인증은 SMS 발송량 제한/요금이 있으니 Firebase 요금제를 확인하세요.

## 배포
GitHub에 올리고 Vercel에서 Redeploy. Blob은 Private 그대로 유지합니다.

## 다중 파일 프로젝트 사용
1. 로그인 후 사이트 주소를 입력합니다.
2. ZIP 선택으로 프로젝트 ZIP을 올리거나 HTML 코드를 편집합니다.
3. ZIP 최상위(또는 ZIP 안의 단일 최상위 폴더)에 `index.html`이 있어야 합니다.
4. 파일 트리에서 텍스트 파일을 열어 수정하고, 파일 추가/삭제를 할 수 있습니다.
5. `사이트 배포 / 업데이트`를 누르면 `/<사이트이름>` 및 상대경로의 CSS·JS·이미지 파일이 함께 배포됩니다.

요청 본문 제한을 고려해 ZIP 압축 해제 후 총 파일 크기는 3MB, 파일 개수는 기본적으로 API 요청 제한 내에서 사용하는 것을 권장합니다.
