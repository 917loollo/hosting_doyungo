import { get } from "@vercel/blob";
import { notFound } from "next/navigation";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!/^[a-z0-9_-]+$/.test(slug)) notFound();

  const result = await get(`sites/${slug}.html`, { access: "public", useCache: false });
  if (!result) notFound();

  return new Response(result.stream, {
    status: 200,
    headers: {
      "Content-Type": result.blob.contentType || "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
