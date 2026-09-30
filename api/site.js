import { Readable } from 'node:stream';
import { get } from '@vercel/blob';

const token = () => process.env.BLOB_READ_WRITE_TOKEN;

function valid(slug) {
  return typeof slug === 'string'
    && /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug)
    && !['api', 'favicon', 'index', 'host'].includes(slug);
}

function page(title, message, code = 404) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#eef5ff,#f8efff);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1d1d1f}.box{padding:32px;border-radius:28px;background:#ffffff99;border:1px solid #ffffffaa;box-shadow:0 20px 60px #0001;text-align:center}.code{font-size:56px;font-weight:800;margin-bottom:8px}.msg{color:#666}</style></head><body><div class="box"><div class="code">${code}</div><div class="msg">${message}</div></div></body></html>`;
}

export default async function handler(req, res) {
  const slug = req.query?.slug;

  if (!valid(slug)) {
    res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(page('404 | doyungo.com', '존재하지 않는 사이트입니다.'));
  }

  try {
    const result = await get(`sites/${slug}.html`, {
      access: 'private',
      useCache: false,
      token: token()
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(page('404 | doyungo.com', `/${slug} 사이트가 없습니다.`));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', result.blob?.contentType || 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache');

    // Vercel 공식 Private Blob 전달 방식
    return Readable.fromWeb(result.stream).pipe(res);
  } catch (error) {
    console.error('SITE_LOAD_ERROR', error);
    res.status(500).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(page('500 | doyungo.com', '사이트를 불러오는 중 오류가 발생했습니다.', 500));
  }
}
