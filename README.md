# DOYUNGO HOST — Light Symphony / Private Blob Edition

HTML-first hosting manager for Vercel.

## Important
This version is designed for a **Private Vercel Blob store**. Sites are stored privately in Blob, and visitors receive the HTML through the Vercel serverless route `/:slug`. Therefore the Blob store itself does NOT need public access.

## Environment variables
- `ADMIN_PASSWORD` — administrator login password
- `PUBLIC_BASE_URL` — optional, e.g. `https://doyungo.com`
- `BLOB_READ_WRITE_TOKEN` — created automatically when connecting the Blob store with a read-write token

## Deploy
1. Upload all files to GitHub.
2. Import the repository into Vercel.
3. Connect your existing Blob store.
4. Make sure `ADMIN_PASSWORD` exists in Production.
5. Redeploy.

## URLs
- `/` — HTML-first hosting manager
- `/:slug` — public hosted HTML page

Example: `https://doyungo.com/test`

The public page is served by the Vercel function, while the underlying Blob object remains private.
