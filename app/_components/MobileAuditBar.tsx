'use client';

/**
 * Mobile-only sticky bottom CTA bar for the listing detail page.
 *
 * Why it lives at the page root (NOT inside the BookingSidebar):
 * iOS Safari has a long-standing bug where `position: fixed` inside an
 * `overflow: auto` ancestor gets trapped to the scrolling box instead of
 * escaping to the viewport. The desktop sticky sidebar uses
 * `overflow-y-auto` so the bar must render OUTSIDE that subtree.
 *
 * Behavior: the bar stays pinned to the bottom of the viewport on mobile.
 * Tapping "Get it →" smooth-scrolls the user to the inline email field
 * (id="audit-email") rendered by ListingClient and focuses it. We don't
 * try to host the form inside the bar — single source of truth lives in
 * ListingClient's React state.
 */
export default function MobileAuditBar() {
  const scrollToAuditCTA = () => {
    const el = document.getElementById('audit-email');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Slight delay so focus lands after the smooth-scroll settles.
    setTimeout(() => (el as HTMLInputElement).focus({ preventScroll: true }), 650);
  };

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[color:var(--bvt-bg-elev)]/95 backdrop-blur-md border-t border-[color:var(--bvt-hairline-2)] shadow-[0_-6px_24px_rgba(0,0,0,0.5)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] tracking-[0.18em] uppercase text-[color:var(--bvt-accent)] font-semibold leading-none">
            Deep Audit · Pro
          </p>
          <p className="font-serif text-[15px] text-[color:var(--bvt-ink)] leading-tight mt-1 tracking-tight truncate">
            $49 · Full report in 30s
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToAuditCTA}
          className="shrink-0 bg-[color:var(--bvt-accent)] hover:bg-[color:var(--bvt-accent-warm)] text-[color:var(--bvt-bg)] text-[11px] font-semibold tracking-[0.14em] uppercase py-3 px-5 transition-colors"
          aria-label="Scroll to audit upgrade form"
        >
          Get it →
        </button>
      </div>
    </div>
  );
}
