import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Bali Villa Truth",
  description:
    "How Bali Villa Truth handles your email, analytics data, and any personal information you share with us. Plain-English privacy policy.",
  alternates: { canonical: "https://balivillatruth.com/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const sections: Array<{ n: string; h: string; body: React.ReactNode }> = [
    {
      n: "01",
      h: "The short version",
      body: (
        <p>
          We collect the minimum data needed to run the site: page views (via
          Google Analytics) and the email address you give us when you request
          a PDF audit. We don&apos;t sell your data. We don&apos;t send
          marketing emails. You can ask us to delete your record at any time.
        </p>
      ),
    },
    {
      n: "02",
      h: "What we collect",
      body: (
        <ul className="divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)]">
          {[
            ["Email address", "Only when you submit it to receive a PDF audit or save favorites. Stored in our Supabase database alongside the listing you requested."],
            ["Page analytics", "Google Analytics 4 tracks aggregate page views and referrer sources. We do not use advertising cookies or remarketing pixels."],
            ["Favorites / filter choices", "Stored in your browser's localStorage. Never leaves your device unless you sign in with an email."],
          ].map(([t, b], i) => (
            <li key={i} className="py-4">
              <div className="font-display text-[18px] text-[color:var(--bvt-ink)] mb-1.5">{t}</div>
              <p className="text-[15px] leading-[1.6] text-[color:var(--bvt-ink-body)]">{b}</p>
            </li>
          ))}
        </ul>
      ),
    },
    {
      n: "03",
      h: "What we don't collect",
      body: (
        <ul className="divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)]">
          {[
            "Your name, phone number, or physical address",
            "Payment information — we don't accept payments on this site",
            "Cookies beyond what Google Analytics sets",
            "Anything that would let third-party advertisers target you",
          ].map((x, i) => (
            <li key={i} className="py-4 flex gap-4">
              <span className="font-mono text-[11px] text-[color:var(--bvt-accent)] tabular-nums mt-1">·</span>
              <span className="text-[15px] leading-[1.6] text-[color:var(--bvt-ink-body)]">{x}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      n: "04",
      h: "Who we share data with",
      body: (
        <>
          <p>Three vendors process data on our behalf:</p>
          <ul className="divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)] mt-4">
            {[
              ["Supabase", "Stores email addresses and audit requests."],
              ["Resend", "Sends the PDF audit email you requested."],
              ["Google Analytics", "Aggregate site traffic — no advertising pixels."],
            ].map(([t, b], i) => (
              <li key={i} className="py-4">
                <div className="font-display text-[18px] text-[color:var(--bvt-ink)] mb-1.5">{t}</div>
                <p className="text-[15px] leading-[1.6] text-[color:var(--bvt-ink-body)]">{b}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[15px] leading-[1.6] text-[color:var(--bvt-ink-muted)]">
            We do not sell data to advertisers, data brokers, real estate
            agents, or developers.
          </p>
        </>
      ),
    },
    {
      n: "05",
      h: "Your rights",
      body: (
        <p>
          You can ask us to delete your email address and associated data at
          any time by writing to{" "}
          <a
            href="mailto:audits@balivillatruth.com"
            className="link-editorial"
          >
            audits@balivillatruth.com
          </a>
          . We&apos;ll confirm removal within 48 hours. If you&apos;re in the
          EU/UK, this includes rights under GDPR; if you&apos;re in California,
          this includes rights under CCPA.
        </p>
      ),
    },
    {
      n: "06",
      h: "Changes",
      body: (
        <p>
          If we change this policy we&apos;ll update the date at the top and —
          for material changes — email anyone in our contact list.
        </p>
      ),
    },
  ];

  return (
    <div className="bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)]">
      <article className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-16">
        <nav className="mb-10 text-[12px]" aria-label="Breadcrumb">
          <Link href="/" className="text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)] transition-colors">
            Home
          </Link>
          <span className="mx-2 text-[color:var(--bvt-ink-faint)]">/</span>
          <span className="text-[color:var(--bvt-ink)]">Privacy</span>
        </nav>

        <header className="mb-16 md:mb-24">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Last updated · April 16, 2026</span>
          </div>
          <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[56px] md:text-[72px]">
            Privacy, in plain English.
          </h1>
        </header>

        <div className="max-w-[76ch] space-y-16 md:space-y-20 text-[color:var(--bvt-ink-body)]">
          {sections.map((s) => (
            <section key={s.n} className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
              <div className="md:col-span-3">
                <div className="font-mono text-[13px] text-[color:var(--bvt-accent)]">{s.n}</div>
                <h2 className="font-display text-[22px] md:text-[26px] leading-tight tracking-[-0.01em] text-[color:var(--bvt-ink)] mt-2">
                  {s.h}
                </h2>
              </div>
              <div className="md:col-span-9 text-[15px] leading-[1.7]">{s.body}</div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
