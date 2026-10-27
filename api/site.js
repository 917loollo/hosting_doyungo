import { valid, readBlob, ownerOf, sitePath } from './_store.js';

function page(title, message, code = 404) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#eef5ff,#f8efff);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1d1d1f}.box{padding:32px;border-radius:28px;background:#ffffff99;border:1px solid #ffffffaa;box-shadow:0 20px 60px #0001;text-align:center}.code{font-size:56px;font-weight:800;margin-bottom:8px}.msg{color:#666}</style></head><body><div class="box"><div class="code">${code}</div><div class="msg">${message}</div></div></body></html>`;
}

function send(res, code, html) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.end(html);
}

export default async function handler(req, res) {
  const slug = req.query?.slug;
  if (!valid(slug)) return send(res, 404, page('404 | doyungo.com', '존재하지 않는 사이트입니다.'));

  try {
    const owner = await ownerOf(slug);
    // 소유자 기록이 없으면 구버전(sites/slug.html) 사이트로 간주
    const r = await readBlob(owner ? sitePath(owner, slug) : `sites/${slug}.html`);
    if (!r) return send(res, 404, page('404 | doyungo.com', `/${slug} 사이트가 없습니다.`));

    res.statusCode = 200;
    res.setHeader('Content-Type', r.contentType || 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache');
    // 사용자가 올린 HTML이 콘솔 도메인의 로그인 정보(IndexedDB 등)를 읽지 못하도록 격리
    res.setHeader('Content-Security-Policy',
      'sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-top-navigation-by-user-activation');
    return res.end(r.buf);
  } catch (error) {
    console.error('SITE_LOAD_ERROR', error);
    return send(res, 500, page('500 | doyungo.com', '사이트를 불러오는 중 오류가 발생했습니다.', 500));
  }
}
