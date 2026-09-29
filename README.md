# DOYUNGO HOST · Light Symphony

HTML-first Vercel hosting console. The main UI is `index.html`; Vercel Functions handle admin authentication and Vercel Blob storage.

## Vercel setup
1. Import this repository into Vercel.
2. Connect a Vercel Blob store to the project.
3. In the Blob connection dialog, enable **Add a read-write token env var to this connection**.
4. Confirm `BLOB_READ_WRITE_TOKEN` exists in Environment Variables for Production and Preview.
5. Add `ADMIN_PASSWORD` as a Secret for Production and Preview.
6. Optional: add `PUBLIC_BASE_URL` such as `https://doyungo.com`. If omitted, the current deployment host is used.
7. Redeploy after changing environment variables.

## Result
Open the root page to log in. Create a site such as `test`; the public URL becomes `https://doyungo.com/test` when `PUBLIC_BASE_URL=https://doyungo.com` is set.
