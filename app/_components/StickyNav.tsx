import Link from "next/link";
import { BvtSeal } from "./BvtSeal";

/**
 * StickyNav — the one nav bar for the whole site.
 *
 * Design reference: Stripe (dense information, generous whitespace) + Linear
 * (dark with a single accent + glass blur). The brand mark uses the serif
 * display face so it reads as a publication, not a startup.
 *
 * Rendered globally via app/layout.tsx, so individual pages no longer need
 * their own nav or breadcrumb-to-home links.
 */
export default function StickyNav() {
  const nav: Array<{ href: string; label: string }> = [
    { href: "/canggu", label: "Canggu" },
    { href: "/uluwatu", label: "Uluwatu" },
    { href: "/seminyak", label: "Seminyak" },
    { href: "/methodology", label: "Methodology" },
    { href: "/about", label: "About" },
  ];

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-40 border-b border-[color:var(--bvt-hairline)]/60 bg-[color:var(--bvt-bg)]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[color:var(--bvt-bg)]/60"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        {/* Brand — audit seal + serif wordmark */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 md:gap-3"
          aria-label="Bali Villa Truth home"
        >
          <BvtSeal size={28} showRingText={false} className="flex-shrink-0" />
          <span className="font-display text-lg md:text-[19px] tracking-tight text-[color:var(--bvt-ink)] leading-none">
            Bali Villa Truth
          </span>
          <span className="hidden lg:inline-block label-micro pl-2 border-l border-[color:var(--bvt-hairline-2)] ml-1">
            Independent audits
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 text-[13px] text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)] transition-colors rounded-md hover:bg-white/[0.03]"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/#listings-section"
            className="ml-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--bvt-bg)] bg-[color:var(--bvt-accent)] hover:bg-[color:var(--bvt-accent-warm)] px-3.5 py-1.5 rounded-md transition-colors"
          >
            Browse audits
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Mobile — single CTA, hamburger free (our nav is shallow) */}
        <div className="md:hidden">
          <Link
            href="/#listings-section"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--bvt-bg)] bg-[color:var(--bvt-accent)] px-3 py-1.5 rounded-md"
          >
            Audits
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
