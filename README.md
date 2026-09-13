# DOYUNGO HOST

Vercel에 배포하여 `doyungo.com/원하는이름` 형태로 HTML 사이트를 만드는 개인용 호스팅 서비스입니다.

## 배포 순서

1. GitHub에 이 프로젝트 전체를 업로드
2. Vercel에서 GitHub 저장소를 Import
3. Vercel Blob Store를 프로젝트에 연결
4. Settings → Environment Variables에서 `ADMIN_PASSWORD` 추가
5. Redeploy
6. `/host`에서 관리자 로그인
7. 주소 이름과 HTML 코드를 입력하여 사이트 생성
8. Vercel 프로젝트의 Domains에 `doyungo.com` 연결

예:
`doyungo.com/game`

## 주의

현재 버전은 사이트당 단일 HTML을 저장합니다. CSS/JS/이미지 여러 파일을 올리는 ZIP 호스팅은 별도 확장이 필요합니다.
