import { del, put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function isAdmin() {
  const store = await cookies();
  return store.get("doyun_host_admin")?.value === "authenticated";
}

export async function PUT(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({}));
  const html = String(body.html ?? "");
  if (!html.trim()) return NextResponse.json({ error: "HTML 코드를 입력하세요." }, { status: 400 });
  const blob = await put(`sites/${slug}.html`, html, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "text/html; charset=utf-8" });
  return NextResponse.json({ ok: true, url: blob.url });
}

export async function DELETE(_request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await context.params;
  await del(`sites/${slug}.html`);
  return NextResponse.json({ ok: true });
}
