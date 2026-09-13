import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = await request.json();
  const password = String(body.password || "");
  const correctPassword = process.env.ADMIN_PASSWORD;

  if (!correctPassword || password !== correctPassword) {
    return Response.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("doyun_host_admin", "authenticated", {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7
  });

  return Response.json({ success: true });
}