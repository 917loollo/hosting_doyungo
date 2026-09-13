import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  if (!/^[a-z0-9_-]{1,40}$/.test(slug) || slug === "host" || slug === "api") {
    return notFound();
  }

  try {
    const result = await get(`sites/${slug}.html`, {
      access: "public",
      useCache: false
    });

    if (!result) return notFound();

    return new Response(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.blob.contentType || "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return notFound();
  }
}

function notFound() {
  return new Response(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 - DOYUNGO HOST</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,system-ui;background:#f5f5f7;text-align:center}h1{font-size:90px;margin:0;letter-spacing:-7px}p{color:#666}a{color:#007aff;font-weight:700;text-decoration:none}</style>
</head><body><div><h1>404</h1><p>존재하지 않는 사이트입니다.</p><a href="/host">DOYUNGO HOST</a></div></body></html>`, {
    status: 404, headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}