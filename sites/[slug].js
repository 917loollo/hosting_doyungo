import { getUser, unauthorized } from '../_auth.js';
import { B, token, valid, titleFromHtml, readBlob, ownerOf, sitePath, legacyPath, listAll, projectPrefix, safeFilePath, contentTypeFor } from '../_store.js';

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return unauthorized(res);
  const slug = req.query?.slug;
  if (!valid(slug)) return res.status(400).json({ error: '잘못된 사이트 이름입니다.' });
  try {
    const owner = await ownerOf(slug);
    const canAccess = owner === user.uid || user.isAdmin;
    if (!canAccess) return res.status(404).json({ error: '사이트를 찾을 수 없습니다.' });
    const prefix = owner ? projectPrefix(owner, slug) : null;
    const legacy = !owner || !await readBlob(prefix + 'index.html');
    if (req.method === 'GET') {
      const requested = req.query?.file;
      if (requested) {
        const p = safeFilePath(requested);
        if (!p || legacy) return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
        const file = await readBlob(prefix + p);
        if (!file) return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
        return res.status(200).json({ path: p, content: file.buf.toString('base64'), contentType: file.contentType || contentTypeFor(p) });
      }
      if (legacy) {
        const r = await readBlob(owner ? sitePath(owner, slug) : legacyPath(slug));
        if (!r) return res.status(404).json({ error: '사이트를 찾을 수 없습니다.' });
        const html = r.buf.toString('utf8');
        return res.status(200).json({ slug, html, title: titleFromHtml(html), files: [{ path: 'index.html', size: r.buf.length }] });
      }
      const blobs = await listAll(prefix);
      const files = blobs.map(x => ({ path: x.pathname.slice(prefix.length), size: x.size || 0, updatedAt: x.uploadedAt }));
      const index = await readBlob(prefix + 'index.html');
      const html = index?.buf.toString('utf8') || '';
      return res.status(200).json({ slug, html, title: titleFromHtml(html), files });
    }
    if (req.method === 'DELETE') {
      if (legacy) await B.del([owner ? sitePath(owner, slug) : legacyPath(slug)], { token: token() });
      else {
        const blobs = await listAll(prefix);
        if (blobs.length) await B.del([...blobs.map(x => x.pathname), `slugs/${slug}.json`], { token: token() });
        else await B.del([`slugs/${slug}.json`], { token: token() });
      }
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) { console.error('SITE_ADMIN_ERROR', e); return res.status(500).json({ error: e.message || '서버 오류' }); }
}
