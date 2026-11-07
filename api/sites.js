import { getUser, unauthorized } from './_auth.js';
import { B, token, valid, titleFromHtml, claimSlug, ownerOf, readBlob, listAll, sitePath, legacyPath, MAX_SITES_PER_USER } from './_store.js';

const baseUrl = req => process.env.PUBLIC_BASE_URL
  || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return unauthorized(res);
  try {
    const prefix = `sites/${user.uid}/`;

    if (req.method === 'GET') {
      // 관리자: 모든 사용자 + 예전 방식(sites/slug.html) 사이트 전부
      if (user.isAdmin) {
        const blobs = await listAll('sites/');
        const sites = blobs.filter(b => b.pathname.endsWith('.html')).map(b => {
          const rest = b.pathname.slice(6, -5);
          const i = rest.indexOf('/');
          const slug = i < 0 ? rest : rest.slice(i + 1);
          const owner = i < 0 ? 'legacy' : rest.slice(0, i);
          return { slug, owner, mine: owner === user.uid, url: `${baseUrl(req)}/${slug}`, updatedAt: b.uploadedAt };
        });
        return res.status(200).json({ sites, admin: true });
      }
      const blobs = await listAll(prefix);
      const sites = blobs.filter(b => b.pathname.endsWith('.html')).map(b => {
        const slug = b.pathname.slice(prefix.length, -5);
        return { slug, url: `${baseUrl(req)}/${slug}`, updatedAt: b.uploadedAt };
      });
      return res.status(200).json({ sites, admin: false });
    }

    if (req.method === 'POST') {
      let b = req.body;
      if (typeof b === 'string') b = JSON.parse(b || '{}');
      b = b || {};
      if (!valid(b.slug)) return res.status(400).json({ error: '사용할 수 없는 사이트 이름입니다.' });
      if (typeof b.html !== 'string' || b.html.length > 2000000) {
        return res.status(400).json({ error: 'HTML은 2MB 이하로 입력하세요.' });
      }

      let path = sitePath(user.uid, b.slug);
      let handled = false;

      // 관리자는 남의 사이트/예전 사이트도 그 자리에 덮어써서 수정할 수 있음
      if (user.isAdmin) {
        const owner = await ownerOf(b.slug);
        if (owner) { path = sitePath(owner, b.slug); handled = true; }
        else if (await readBlob(legacyPath(b.slug))) { path = legacyPath(b.slug); handled = true; }
      }

      if (!handled) {
        if (!user.isAdmin) {
          const mine = await listAll(prefix);
          const exists = mine.some(x => x.pathname === path);
          if (!exists && mine.length >= MAX_SITES_PER_USER) {
            return res.status(400).json({ error: `사이트는 최대 ${MAX_SITES_PER_USER}개까지 만들 수 있습니다.` });
          }
        }
        if (!(await claimSlug(b.slug, user.uid))) {
          return res.status(409).json({ error: '이미 다른 사람이 사용 중인 주소입니다.' });
        }
      }

      await B.put(path, b.html, {
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
