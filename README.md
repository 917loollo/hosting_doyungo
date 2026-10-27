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

## v4 수정 사항
- `vercel.json`의 잘못된 `runtime: nodejs22.x` 제거 (배포 실패 원인). Node 버전은 `package.json`의 `engines`로 지정.
- `package.json`에 `"type": "module"` 추가 (ESM `import` 사용).
- 관리자 쿠키를 서명된 세션 토큰으로 교체 (이전에는 쿠키 `doyun_host_admin=1`만 직접 만들면 누구나 관리자 가능했음).
- Blob 읽기 시 `useCache: false` — 수정 후 예전 내용이 보이는 문제 방지.
- `ADMIN_PASSWORD`를 바꾸면 기존 로그인 세션은 모두 무효화됩니다.
