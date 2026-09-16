import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE = "doyun_host_admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = String(body.password ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return NextResponse.json({ error: "ADMIN_PASSWORD 환경변수가 설정되지 않았습니다." }, { status: 500 });
  if (password !== expected) return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "authenticated", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}

export async function GET() {
  const store = await cookies();
  return NextResponse.json({ authenticated: store.get(COOKIE)?.value === "authenticated" });
}
