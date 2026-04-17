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
  return (
    <div className="min-h-screen bg-[#0a1120] text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <nav className="text-xs text-slate-500 mb-8">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">Privacy Policy</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
          Privacy policy
        </h1>
        <p className="text-sm text-slate-500 mb-12">
          Last updated: April 16, 2026
        </p>

        <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-3">The short version</h2>
            <p>
              We collect the minimum data needed to run the site: page views
              (via Google Analytics) and the email address you give us when you
              request a PDF audit. We don&apos;t sell your data. We don&apos;t
              send marketing emails. You can ask us to delete your record at
              any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-3">What we collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-slate-100">Email address</strong> — only
                when you submit it to receive a PDF audit or save favorites.
                Stored in our Supabase database alongside the listing you
                requested.
              </li>
              <li>
                <strong className="text-slate-100">Page analytics</strong> —
                Google Analytics 4 tracks aggregate page views and referrer
                sources. We do not use advertising cookies or remarketing pixels.
              </li>
              <li>
                <strong className="text-slate-100">Favorites / filter choices</strong> —
                stored in your browser&apos;s localStorage. Never leaves your
                device unless you sign in with an email.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-3">What we don&apos;t collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your name, phone number, or physical address</li>
              <li>Payment information (we don&apos;t accept payments on this site)</li>
              <li>Cookies beyond what Google Analytics sets</li>
              <li>Anything that would let third-party advertisers target you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-3">Who we share data with</h2>
            <p>
              Three vendors process data on our behalf:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong className="text-slate-100">Supabase</strong> — stores email addresses and audit requests.</li>
              <li><strong className="text-slate-100">Resend</strong> — sends the PDF audit email you requested.</li>
              <li><strong className="text-slate-100">Google Analytics</strong> — aggregate site traffic.</li>
            </ul>
            <p className="mt-3">
              We do not sell data to advertisers, data brokers, real estate
              agents, or developers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-3">Your rights</h2>
            <p>
              You can ask us to delete your email address and associated data at
              any time by writing to{" "}
              <a
                href="mailto:audits@balivillatruth.com"
                className="text-[#d4943a] hover:underline"
              >
                audits@balivillatruth.com
              </a>
              . We&apos;ll confirm removal within 48 hours. If you&apos;re in
              the EU/UK, this includes rights under GDPR; if you&apos;re in
              California, this includes rights under CCPA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-3">Changes</h2>
            <p>
              If we change this policy we&apos;ll update the date at the top
              and — for material changes — email anyone in our contact list.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300">← Back to listings</Link>
          <span className="mx-3 text-slate-700">|</span>
          <Link href="/contact" className="hover:text-slate-300">Contact</Link>
        </div>
      </div>
    </div>
  );
}
