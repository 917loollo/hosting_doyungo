# doyungo.com Hosting — Private Blob edition

Vercel + Vercel Blob 기반 HTML 호스팅 서비스입니다.

## 핵심
- Blob Store는 **Private**로 유지합니다.
- `POST /api/sites`가 `sites/{slug}.html`로 HTML을 저장합니다.
- `/:slug`는 `/api/site?slug=:slug`로 rewrite됩니다.
- `/api/site`가 Private Blob을 서버에서 읽어 HTML을 브라우저에 직접 출력합니다.
- `/test` 같은 주소도 저장된 `sites/test.html`이 있으면 그대로 표시됩니다.

## 환경변수
- `BLOB_READ_WRITE_TOKEN`
- `ADMIN_PASSWORD`

## 배포
1. GitHub에 파일을 업로드합니다.
2. Vercel에서 Redeploy 합니다.
3. Blob을 Public으로 바꾸지 않습니다.
4. 관리자에서 slug와 HTML을 저장합니다.
5. `https://hosting-doyungo.vercel.app/slug`로 접속합니다.
