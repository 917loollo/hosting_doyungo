# DOYUN HOST — 실제 HTML 호스팅

## 기능
- `index.html`이 관리자 화면의 메인
- 관리자 비밀번호 로그인
- HTML 저장/수정/삭제
- Vercel Blob에 실제 저장
- `https://doyungo.com/원하는이름` 형태의 공개 URL
- iOS 27 느낌의 glass UI

## 배포
1. 이 폴더 전체를 GitHub 새 저장소에 업로드합니다.
2. Vercel에서 GitHub 저장소를 Import합니다.
3. Vercel Storage → Blob을 연결합니다.
4. Environment Variables에 `ADMIN_PASSWORD`를 원하는 관리자 비밀번호로 추가합니다.
5. `PUBLIC_BASE_URL`도 추가합니다. 예: `https://doyungo.com`
6. Redeploy합니다.

### 주의
Vercel Blob 연결 후 `BLOB_READ_WRITE_TOKEN`이 프로젝트에 생성되어야 합니다.
관리자 화면은 사이트 루트 `/`에서 열립니다.
예: `https://doyungo.com/test` → 저장한 HTML 공개 페이지
