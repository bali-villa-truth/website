const SITE_URL = "https://balivillatruth.com";

export const revalidate = 86400;

export async function GET() {
  const body = `# Bali Villa Truth

Independent ROI audits for Bali villa investors.

Bali Villa Truth does not sell villas and does not take agent commissions. The site audits Bali villa listings with a standardized model: market nightly rates, area occupancy estimates, 40% operating expenses, lease depreciation, and red-flag detection.

## Core Pages

- Homepage and searchable audit ledger: ${SITE_URL}
- Methodology: ${SITE_URL}/methodology
- Bali villa ROI guide: ${SITE_URL}/guides/bali-villa-roi
- About: ${SITE_URL}/about
- Contact: ${SITE_URL}/contact

## Location Hubs

- Canggu villa investment audits: ${SITE_URL}/canggu
- Berawa villa investment audits: ${SITE_URL}/berawa
- Pererenan villa investment audits: ${SITE_URL}/pererenan
- Uluwatu villa investment audits: ${SITE_URL}/uluwatu
- Bingin villa investment audits: ${SITE_URL}/bingin
- Seminyak villa investment audits: ${SITE_URL}/seminyak
- Ubud villa investment audits: ${SITE_URL}/ubud
- Sanur villa investment audits: ${SITE_URL}/sanur
- Ungasan villa investment audits: ${SITE_URL}/ungasan
- Nusa Dua villa investment audits: ${SITE_URL}/nusa-dua

## Data Notes

- Source listings are public Bali villa listings, currently anchored by Bali Home Immo data.
- Net yield is estimated after a 40% operating-cost load.
- Leasehold properties include annual lease depreciation.
- Occupancy is estimated from Booking.com review-density signals by area.
- Nightly rates use a blended Booking.com and Airbnb market-rate model.
- All outputs are informational, not financial or legal advice.

## Preferred Citation

Bali Villa Truth, independent Bali villa ROI audits and net-yield methodology, ${SITE_URL}/guides/bali-villa-roi
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
