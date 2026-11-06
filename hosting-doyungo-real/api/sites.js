import { getUser, unauthorized } from './_auth.js';
import { B, token, valid, titleFromHtml, claimSlug, sitePath, MAX_SITES_PER_USER } from './_store.js';

const baseUrl = req => process.env.PUBLIC_BASE_URL
  || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return unauthorized(res);
  try {
    const prefix = `sites/${user.uid}/`;

    if (req.method === 'GET') {
      const out = await B.list({ prefix, token: token() });
      const sites = out.blobs.filter(b => b.pathname.endsWith('.html')).map(b => {
        const slug = b.pathname.slice(prefix.length, -5);
        return { slug, url: `${baseUrl(req)}/${slug}`, updatedAt: b.uploadedAt };
      });
      return res.status(200).json({ sites });
    }

    if (req.method === 'POST') {
      let b = req.body;
      if (typeof b === 'string') b = JSON.parse(b || '{}');
      b = b || {};
      if (!valid(b.slug)) return res.status(400).json({ error: '사용할 수 없는 사이트 이름입니다.' });
      if (typeof b.html !== 'string' || b.html.length > 2000000) {
        return res.status(400).json({ error: 'HTML은 2MB 이하로 입력하세요.' });
      }
      const mine = await B.list({ prefix, token: token() });
      const exists = mine.blobs.some(x => x.pathname === sitePath(user.uid, b.slug));
      if (!exists && mine.blobs.length >= MAX_SITES_PER_USER) {
        return res.status(400).json({ error: `사이트는 최대 ${MAX_SITES_PER_USER}개까지 만들 수 있습니다.` });
      }
      if (!(await claimSlug(b.slug, user.uid))) {
        return res.status(409).json({ error: '이미 다른 사람이 사용 중인 주소입니다.' });
      }
      await B.put(sitePath(user.uid, b.slug), b.html, {
        access: 'private', addRandomSuffix: false, allowOverwrite: true,
        contentType: 'text/html; charset=utf-8', token: token()
      });
      return res.status(200).json({ ok: true, url: `${baseUrl(req)}/${b.slug}`, title: b.title || titleFromHtml(b.html) });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('SITES_ERROR', e);
    return res.status(500).json({ error: e.message || '서버 오류' });
  }
}
