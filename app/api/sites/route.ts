import { put, list } from "@vercel/blob";
import { cookies } from "next/headers";

async function isAdmin() {
  const store = await cookies();
  return store.get("doyun_host_admin")?.value === "authenticated";
}
function validSlug(slug: string) { return /^[a-z0-9_-]{1,40}$/.test(slug); }

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const result = await list({ prefix: "sites/" });
  const sites = result.blobs.filter(b => b.pathname.endsWith(".html")).map(b => ({
    slug: b.pathname.replace("sites/","").replace(".html",""),
    url: `/${b.pathname.replace("sites/","").replace(".html","")}`
  }));
  return Response.json({ sites });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const body = await request.json();
  const slug = String(body.slug || "").trim().toLowerCase();
  const html = String(body.html || "");

  if (!validSlug(slug)) return Response.json({ error: "주소는 영문 소문자, 숫자, -, _만 사용할 수 있습니다." }, { status: 400 });
  if (!html.trim()) return Response.json({ error: "HTML 코드를 입력해주세요." }, { status: 400 });
  if (["host","api","favicon.ico"].includes(slug)) return Response.json({ error: "사용할 수 없는 주소입니다." }, { status: 400 });

  await put(`sites/${slug}.html`, html, {
    access: "public", addRandomSuffix: false, allowOverwrite: true,
    contentType: "text/html; charset=utf-8"
  });

  return Response.json({ success: true, slug });
}