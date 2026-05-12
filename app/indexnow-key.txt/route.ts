export const revalidate = 86400;

export async function GET() {
  return new Response("bvt-idx-20260512-4e2a8c9f7d1b43a2", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
