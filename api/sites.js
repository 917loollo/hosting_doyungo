import { getUser, unauthorized } from './_auth.js';
import { B, token, valid, titleFromHtml, claimSlug, ownerOf, readBlob, listAll, sitePath, legacyPath, MAX_SITES_PER_USER, projectPrefix, safeFilePath, contentTypeFor, looksUid, ownerOrAdopt } from './_store.js';

const baseUrl = req => process.env.PUBLIC_BASE_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
const MAX_PROJECT_BYTES = 3 * 1024 * 1024;

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return unauthorized(res);
  try {
    const prefix = `sites/${user.uid}/`;
    if (req.method === 'GET') {
      const group = (blobs, keyOf) => {
        const m = new Map();
        for (const b of blobs) {
          const k = keyOf(b); if (!k) continue;
          const g = m.get(k.id) || { ...k, files: 0, updatedAt: null };
          g.files++; if (!g.updatedAt || new Date(b.uploadedAt) > new Date(g.updatedAt)) g.updatedAt = b.uploadedAt;
          m.set(k.id, g);
        }
        return [...m.values()];
      };
      const toSite = g => ({ slug: g.slug, owner: g.owner, mine: g.owner === user.uid, files: g.files, invalid: !valid(g.slug), url: `${baseUrl(req)}/${g.slug}`, updatedAt: g.updatedAt });
      if (user.isAdmin) {
        const blobs = await listAll('sites/');
        const sites = group(blobs, b => {
          const parts = b.pathname.slice(6).split('/');
          const isOwned = parts.length > 1 && looksUid(parts[0]);
          const owner = isOwned ? parts[0] : 'legacy', seg = isOwned ? parts[1] : parts[0];
          const slug = seg.replace(/\.html$/, ''); if (!slug) return null;
          return { id: owner + '/' + slug, slug, owner };
        }).map(toSite);
        return res.status(200).json({ sites, admin: true });
      }
      const blobs = await listAll(prefix);
      const sites = group(blobs, b => {
        const slug = b.pathname.slice(prefix.length).split('/')[0].replace(/\.html$/, ''); if (!slug) return null;
        return { id: slug, slug, owner: user.uid };
      }).map(toSite);
      await Promise.all(sites.filter(s => !s.invalid).map(s => ownerOrAdopt(s.slug, user.uid).catch(() => null)));
      sites.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return res.status(200).json({ sites, admin: false });
    }
    if (req.method === 'POST') {
      let b = req.body; if (typeof b === 'string') b = JSON.parse(b || '{}'); b = b || {};
      if (!valid(b.slug)) return res.status(400).json({ error: '사용할 수 없는 사이트 이름입니다.' });
      // 기존 프로젝트의 단일 파일을 편집하는 요청
      if (typeof b.filePath === 'string' && typeof b.content === 'string') {
        const { safeFilePath, contentTypeFor, projectPrefix } = await import('./_store.js');
        const filePath = safeFilePath(b.filePath);
        if (!filePath) return res.status(400).json({ error: '잘못된 파일 경로입니다.' });
        const data = Buffer.from(b.content, 'base64');
        if (data.length > 1024 * 1024) return res.status(413).json({ error: '파일 하나의 크기는 1MB 이하로 저장해 주세요.' });
        const owner = await ownerOrAdopt(b.slug, user.uid);
        if (!owner || (owner !== user.uid && !user.isAdmin)) return res.status(404).json({ error: '사이트를 찾을 수 없습니다.' });
        const prefix = projectPrefix(owner, b.slug);
        await B.put(prefix + filePath, data, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: contentTypeFor(filePath), token: token() });
        return res.status(200).json({ ok: true, saved: filePath });
      }
      // 기존 단일 HTML 호환
      let files = Array.isArray(b.files) ? b.files : (typeof b.html === 'string' ? [{ path: 'index.html', content: Buffer.from(b.html).toString('base64') }] : []);
      if (!files.length) return res.status(400).json({ error: '업로드할 파일이 없습니다. index.html을 포함해 주세요.' });
      if (files.length > 100) return res.status(400).json({ error: '한 프로젝트에는 최대 100개 파일까지 업로드할 수 있습니다.' });
      let total = 0;
      const normalized = [];
      for (const f of files) {
        const p = safeFilePath(f.path);
        if (!p || typeof f.content !== 'string') return res.status(400).json({ error: '파일 경로 또는 내용이 올바르지 않습니다.' });
        const data = Buffer.from(f.content, 'base64'); total += data.length;
        if (total > MAX_PROJECT_BYTES) return res.status(413).json({ error: '압축 해제 후 전체 파일 크기는 3MB 이하로 업로드해 주세요.' });
        normalized.push({ path: p, data });
      }
      if (!normalized.some(f => f.path === 'index.html')) return res.status(400).json({ error: '사이트 최상위 폴더에 index.html이 필요합니다.' });
      let path = projectPrefix(user.uid, b.slug), owner = user.uid, handled = false;
      if (user.isAdmin) {
        const found = await ownerOf(b.slug);
        if (found) { owner = found; path = projectPrefix(owner, b.slug); handled = true; }
        else if (await readBlob(legacyPath(b.slug))) { path = legacyPath(b.slug); handled = true; }
      }
      if (!handled) {
        if (!user.isAdmin) {
          const mine = await listAll(prefix);
          const existing = mine.some(x => x.pathname.startsWith(path));
          const projectCount = new Set(mine.map(x => x.pathname.slice(prefix.length).split('/')[0]).filter(Boolean)).size;
          if (!existing && projectCount >= MAX_SITES_PER_USER) return res.status(400).json({ error: `사이트는 최대 ${MAX_SITES_PER_USER}개까지 만들 수 있습니다.` });
        }
        if (!(await claimSlug(b.slug, user.uid))) return res.status(409).json({ error: '이미 다른 사람이 사용 중인 주소입니다.' });
      }
      if (handled && path === legacyPath(b.slug)) {
        const html = normalized.find(f => f.path === 'index.html').data.toString('utf8');
        await B.put(path, html, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'text/html; charset=utf-8', token: token() });
      } else {
        // 이전 배포에서 사라진 파일 제거 후 새 파일 세트 저장
        const old = await listAll(path);
        if (old.length) await B.del(old.map(x => x.pathname), { token: token() });
        for (const f of normalized) {
          await B.put(path + f.path, f.data, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: contentTypeFor(f.path), token: token() });
        }
      }
      const html = normalized.find(f => f.path === 'index.html').data.toString('utf8');
      return res.status(200).json({ ok: true, url: `${baseUrl(req)}/${b.slug}`, title: b.title || titleFromHtml(html), files: normalized.length });
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) { console.error('SITES_ERROR', e); return res.status(500).json({ error: e.message || '서버 오류' }); }
}
