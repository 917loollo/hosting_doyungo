import { list, put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE = "doyun_host_admin";
const reserved = new Set(["host", "api", "favicon.ico"]);

async function isAdmin() {
  const store = await cookies();
  return store.get(COOKIE)?.value === "authenticated";
}

function validSlug(slug: string) {
  return /^[a-z0-9_-]+$/.test(slug) && slug.length >= 1 && slug.length <= 60 && !reserved.has(slug);
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await list({ prefix: "sites/" });
  const sites = result.blobs.filter(b => b.pathname.endsWith(".html")).map(b => ({ slug: b.pathname.slice("sites/".length, -5), url: b.url, uploadedAt: b.uploadedAt }));
  return NextResponse.json({ sites });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const slug = String(body.slug ?? "").trim().toLowerCase();
  const html = String(body.html ?? "");
  if (!validSlug(slug)) return NextResponse.json({ error: "주소 이름은 영문 소문자, 숫자, -, _만 사용할 수 있습니다." }, { status: 400 });
  if (!html.trim()) return NextResponse.json({ error: "HTML 코드를 입력하세요." }, { status: 400 });

  const blob = await put(`sites/${slug}.html`, html, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "text/html; charset=utf-8" });
  return NextResponse.json({ ok: true, slug, url: blob.url });
}
