import { get, put, list, del } from '@vercel/blob';

export const B = { get, put, list, del }; // 테스트에서 교체 가능
export const token = () => process.env.BLOB_READ_WRITE_TOKEN;
export const MAX_SITES_PER_USER = 20;

export function valid(s) {
  return typeof s === 'string'
    && /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(s)
    && !['api', 'favicon', 'index', 'host'].includes(s);
}

export function titleFromHtml(html) {
  const m = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

export async function readBlob(pathname) {
  try {
    const r = await B.get(pathname, { access: 'private', useCache: false, token: token() });
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    const chunks = [];
    for await (const c of r.stream) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    return { buf: Buffer.concat(chunks), contentType: r.blob?.contentType };
  } catch (e) {
    if (e?.name === 'BlobNotFoundError') return null;
    throw e;
  }
}

// slug → 소유자 uid (없으면 null)
export async function ownerOf(slug) {
  const r = await readBlob(`slugs/${slug}.json`);
  if (!r) return null;
  try { return JSON.parse(r.buf.toString('utf8')).uid || null; } catch { return null; }
}

// 주소 선점: 이미 내 것이면 true, 남의 것(또는 예전 방식으로 올린 사이트)이면 false
export async function claimSlug(slug, uid) {
  const owner = await ownerOf(slug);
  if (owner) return owner === uid;
  if (await readBlob(`sites/${slug}.html`)) return false; // 구버전 사이트와 충돌 방지
  try {
    await B.put(`slugs/${slug}.json`, JSON.stringify({ uid }), {
      access: 'private', addRandomSuffix: false, allowOverwrite: false,
      contentType: 'application/json', token: token()
    });
    return true;
  } catch {
    return (await ownerOf(slug)) === uid; // 동시에 누가 먼저 선점한 경우
  }
}

export const sitePath = (uid, slug) => `sites/${uid}/${slug}.html`;

export async function listAll(prefix) {
  const blobs = [];
  let cursor;
  do {
    const out = await B.list({ prefix, cursor, limit: 1000, token: token() });
    blobs.push(...out.blobs);
    cursor = out.hasMore ? out.cursor : undefined;
  } while (cursor);
  return blobs;
}

export const legacyPath = slug => `sites/${slug}.html`;
