import Link from "next/link";
import { BvtSeal } from "./BvtSeal";

/**
 * SiteFooter — editorial multi-column footer.
 *
 * Design reference: FT + The Modern House + Stripe. A quiet, dense footer
 * is a luxury tell — it reads as a publication with a masthead, not as a
 * "contact us" page. Gold hairline at the top, five columns on desktop,
 * stacked on mobile, with a fine-print colophon.
 *
 * Rendered globally via app/layout.tsx.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  const columns: Array<{
    label: string;
    links: Array<{ href: string; label: string; external?: boolean }>;
  }> = [
    {
      label: "Audits",
      links: [
        { href: "/#listings-section", label: "Browse all audits" },
        { href: "/methodology", label: "Methodology" },
        { href: "/#how-it-works", label: "How we score" },
      ],
    },
    {
      label: "Locations",
      links: [
        { href: "/canggu", label: "Canggu" },
        { href: "/uluwatu", label: "Uluwatu" },
        { href: "/seminyak", label: "Seminyak" },
        { href: "/ungasan", label: "Ungasan" },
        { href: "/sanur", label: "Sanur" },
      ],
    },
    {
      label: "Company",
      links: [
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
        { href: "/privacy", label: "Privacy" },
      ],
    },
    {
      label: "For buyers",
      links: [
        { href: "/#paste-url", label: "Audit a specific listing" },
        { href: "/#newsletter", label: "Weekly best-yields email" },
        { href: "/contact", label: "Request a custom review" },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-[color:var(--bvt-hairline)] bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-muted)]">
      {/* Gold hairline mark — editorial tell */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="relative">
          <div className="absolute left-0 top-0 h-px w-16 bg-[color:var(--bvt-accent)]" />
        </div>

        {/* Masthead row — brand + positioning */}
        <div className="pt-14 pb-10 grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-[color:var(--bvt-hairline)]">
          <div className="md:col-span-4">
            <Link
              href="/"
              aria-label="Bali Villa Truth home"
              className="group inline-flex items-center gap-3"
            >
              <BvtSeal size={40} className="flex-shrink-0" />
              <span className="font-display text-[22px] tracking-tight text-[color:var(--bvt-ink)] leading-none">
                Bali Villa Truth
              </span>
            </Link>
            <p className="mt-4 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)] max-w-[32ch]">
              Independent, stress-tested ROI audits for Bali villa investors.
              We don't sell villas — we check the math.
            </p>
            <p className="mt-4 label-micro">
              Not affiliated with any agent or developer
            </p>
          </div>

          {/* Four link columns */}
          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {columns.map((col) => (
              <div key={col.label}>
                <div className="label-micro mb-3">{col.label}</div>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-[13px] text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)] transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Colophon */}
        <div className="py-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between text-[11px] text-[color:var(--bvt-ink-dim)]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>© {year} Bali Villa Truth.</span>
            <span className="hidden md:inline text-[color:var(--bvt-ink-faint)]">·</span>
            <span>
              All audits for informational purposes only. Not investment advice.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="mailto:hello@balivillatruth.com"
              className="hover:text-[color:var(--bvt-ink)] transition-colors"
            >
              hello@balivillatruth.com
            </a>
            <span className="label-micro">Audits re-run weekly</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
