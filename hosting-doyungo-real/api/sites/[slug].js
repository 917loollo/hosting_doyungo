import { getUser, unauthorized } from '../_auth.js';
import { B, token, valid, titleFromHtml, readBlob, ownerOf, sitePath } from '../_store.js';

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return unauthorized(res);

  const slug = req.query?.slug;
  if (!valid(slug)) return res.status(400).json({ error: '잘못된 사이트 이름입니다.' });

  try {
    if ((await ownerOf(slug)) !== user.uid) {
      return res.status(404).json({ error: '사이트를 찾을 수 없습니다.' });
    }

    if (req.method === 'GET') {
      const r = await readBlob(sitePath(user.uid, slug));
      if (!r) return res.status(404).json({ error: '사이트를 찾을 수 없습니다.' });
      const html = r.buf.toString('utf8');
      return res.status(200).json({ slug, html, title: titleFromHtml(html) });
    }

    if (req.method === 'DELETE') {
      await B.del([sitePath(user.uid, slug), `slugs/${slug}.json`], { token: token() });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('SITE_ADMIN_ERROR', e);
    return res.status(500).json({ error: e.message || '서버 오류' });
  }
}
