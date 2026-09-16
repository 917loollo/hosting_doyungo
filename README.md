# Doyun Host — GitHub → Vercel

## 1. GitHub
압축을 푼 뒤 **이 폴더 안의 파일과 폴더를 저장소 루트에 업로드**하세요. `hosting-doyungo/hosting-doyungo/`처럼 한 단계 더 들어가면 안 됩니다.

## 2. Vercel
GitHub 저장소를 Vercel 프로젝트로 연결하고 Framework가 Next.js로 감지되는지 확인하세요.

## 3. Blob
Vercel 프로젝트의 Storage에서 Blob store를 만들고 이 프로젝트에 연결하세요. Blob SDK가 제공하는 인증 방식에 따라 연결된 환경변수가 자동으로 구성될 수 있습니다.

## 4. 관리자 비밀번호
Vercel 프로젝트의 Settings → Environment Variables에서 Production에 다음을 추가하세요.

`ADMIN_PASSWORD` = 원하는 관리자 비밀번호

저장 후 Redeploy하세요.

## 5. 사용
`/host`에서 로그인한 뒤 slug와 HTML을 입력하면 `/slug` 주소로 사이트가 공개됩니다.

예약된 주소: `/host`, `/api`, `/favicon.ico`
