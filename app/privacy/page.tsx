import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Bali Villa Truth",
  description:
    "How Bali Villa Truth handles browser-local Saved and comparisons, requested audit emails, newsletter subscriptions, analytics, and private dashboard sessions.",
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
          Browsing audits, saving villas and comparing them does not require an
          account or email address. Saved and comparison selections stay in this
          browser. Requesting an audit PDF or subscribing to updates is a separate
          choice that sends your email to BVT. We don&apos;t sell your data.
          This site uses Google Analytics; you can ask about or request deletion
          of the personal information you have shared with us.
        </p>
      ),
    },
    {
      n: "02",
      h: "What we collect",
      body: (
        <ul className="divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)]">
          {[
            ["Requested audit emails", "The PDF form sends your email address and requested listing ID to BVT. BVT attempts to record audit requests in Supabase. When the email provider accepts the PDF message for sending, inbox delivery is not verified; a request can still be submitted if lead storage fails. Requesting a PDF is not an account sign-in or newsletter subscription."],
            ["Newsletter subscriptions", "The separate newsletter form sends your email address and signup source to BVT for storage in Supabase. Signup is confirmed only after a successful storage response. A confirmation email may be submitted through Resend; provider acceptance does not confirm inbox delivery. Research updates have no fixed delivery schedule. To request removal, email audits@balivillatruth.com from your subscribed address with the subject Unsubscribe. This opt-in is separate from an audit PDF request and is not required for browsing or saving villas."],
            ["Saved / comparison selections", "Saved listing IDs and up to five comparison IDs use this browser's localStorage. The current site does not import or upload account favorites, use a stored email to retrieve them, or provide cross-device sync. Calculator settings reset to the BVT defaults when reopened; filters are not stored as an account profile."],
            ["Page analytics and hosting", "Google Analytics 4 measures visits, pages and referrers. Hosting and database providers process normal web requests, which can include technical data such as IP address and browser information. Local Saved storage is separate from these requests."],
            ["Private dashboard sessions", "The password-protected internal dashboards use secure, HttpOnly session cookies. These are separate from Google Analytics cookies and are not needed to save or compare villas."],
            ["Enquiries and corrections", "The contact links open a draft in your email app. Nothing is sent until you send it. Any listing reference, message or supporting documents you choose to send become part of that correspondence. Please omit passport, bank and other sensitive records from an initial enquiry."],
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
      h: "Your browser controls",
      body: (
        <ul className="divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)]">
          {[
            "You can remove Saved villas and clear comparisons on the site. Removing Saved IDs does not delete comparison IDs, and vice versa.",
            "Clearing this site's browser data removes local selections and stored sessions on that browser. It does not delete an audit request or newsletter record held by BVT.",
            "On a shared browser profile, another person may see your local shortlist. Saved is not a password-protected account or a backup; another browser or device will not inherit it.",
            "Older versions may have left an email address in browser storage or created email-associated favorites. The current site does not read that email to retrieve favorites. This change does not erase older server records; you can ask about their removal.",
            "Paid checkout is currently disabled. Saving, browsing and comparing villas does not require payment details.",
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
          <p>The site uses these service providers:</p>
          <ul className="divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)] mt-4">
            {[
              ["Vercel", "Hosts the site and processes web requests."],
              ["Supabase", "Serves listing data and stores audit requests and newsletter records."],
              ["Resend", "Handles requested PDF emails and newsletter email services."],
              ["Google Analytics", "Measures site usage and traffic sources."],
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
          . Specify whether your request concerns audit emails, newsletter
          records, older email-associated favorites or another enquiry. We may
          need to verify that the request comes from the address concerned;
          an email typed into a browser is not proof of account ownership.
          Clearing local browser data and deleting server-held records are
          separate actions. No response or deletion time is guaranteed here.
        </p>
      ),
    },
    {
      n: "06",
      h: "Changes",
      body: (
        <p>
          We update the date on this page when its description changes. The
          current policy describes the deployed site; it does not promise
          future account sync, newsletter frequency or a paid service launch.
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
            <span className="label-micro">Last updated · September 29, 2026</span>
          </div>
          <h1 className="font-display text-[color:var(--bvt-ink)] leading-[1.05] tracking-normal text-[32px] sm:text-[44px] md:text-[56px]">
            Privacy, in plain English.
          </h1>
        </header>

        <div className="max-w-[76ch] space-y-16 md:space-y-20 text-[color:var(--bvt-ink-body)]">
          {sections.map((s) => (
            <section key={s.n} className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
              <div className="md:col-span-3 min-w-0">
                <div className="font-mono text-[13px] text-[color:var(--bvt-accent)]">{s.n}</div>
                <h2 className="font-display text-[22px] md:text-[26px] leading-tight tracking-normal text-[color:var(--bvt-ink)] mt-2">
                  {s.h}
                </h2>
              </div>
              <div className="md:col-span-9 min-w-0 break-words text-[15px] leading-[1.7]">{s.body}</div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
