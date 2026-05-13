const SITE_HOST = "balivillatruth.com";
const SITE_URL = `https://${SITE_HOST}`;
const INDEXNOW_KEY = "bvt-idx-20260512-4e2a8c9f7d1b43a2";

const DEFAULT_URLS = [
  SITE_URL,
  `${SITE_URL}/methodology`,
  `${SITE_URL}/guides/bali-villa-roi`,
  `${SITE_URL}/guides/bali-villa-leasehold-vs-freehold-roi`,
  `${SITE_URL}/about`,
  `${SITE_URL}/contact`,
  `${SITE_URL}/canggu`,
  `${SITE_URL}/berawa`,
  `${SITE_URL}/pererenan`,
  `${SITE_URL}/uluwatu`,
  `${SITE_URL}/bingin`,
  `${SITE_URL}/seminyak`,
  `${SITE_URL}/ubud`,
  `${SITE_URL}/sanur`,
  `${SITE_URL}/ungasan`,
  `${SITE_URL}/nusa-dua`,
  `${SITE_URL}/sitemap.xml`,
];

function normalizeUrls(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : typeof input === "string" ? [input] : DEFAULT_URLS;

  return Array.from(
    new Set(
      raw
        .map((value) => {
          try {
            const url = new URL(String(value), SITE_URL);
            if (url.hostname !== SITE_HOST && url.hostname !== `www.${SITE_HOST}`) return null;
            url.hostname = SITE_HOST;
            return url.toString();
          } catch {
            return null;
          }
        })
        .filter(Boolean) as string[]
    )
  ).slice(0, 10000);
}

async function submit(urlList: string[]) {
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/indexnow-key.txt`,
      urlList,
    }),
  });

  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    body: text,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const urls = normalizeUrls(url.searchParams.getAll("url"));
  const result = await submit(urls.length > 0 ? urls : DEFAULT_URLS);

  return Response.json({
    submitted: urls.length > 0 ? urls : DEFAULT_URLS,
    indexnow: result,
  }, { status: result.ok ? 200 : 502 });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const urls = normalizeUrls(payload.urls || payload.url);
  const result = await submit(urls);

  return Response.json({
    submitted: urls,
    indexnow: result,
  }, { status: result.ok ? 200 : 502 });
}
