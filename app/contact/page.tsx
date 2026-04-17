import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact — Bali Villa Truth",
  description:
    "Get in touch with Bali Villa Truth. Request a custom audit, ask a question, or share feedback. We reply within 48 hours — typically same-day.",
  alternates: { canonical: "https://balivillatruth.com/contact" },
  openGraph: {
    title: "Contact — Bali Villa Truth",
    description:
      "Get in touch. Custom audits, feedback, or due-diligence questions welcome.",
    url: "https://balivillatruth.com/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0a1120] text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <nav className="text-xs text-slate-500 mb-8">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">Contact</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Contact <span className="text-[#d4943a]">us</span>
        </h1>
        <p className="text-slate-400 text-lg leading-relaxed mb-10">
          We&apos;re a small, independent team. There&apos;s no sales funnel — just
          one email that reaches us directly.
        </p>

        <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 md:p-8 mb-8">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">
            Email
          </div>
          <a
            href="mailto:audits@balivillatruth.com"
            className="text-2xl md:text-3xl font-bold text-[#d4943a] hover:text-[#e5a84d] transition-colors"
          >
            audits@balivillatruth.com
          </a>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed">
            We reply within 48 hours (usually same day, Bali time — UTC+8).
            Include a BHI listing URL if you want a quick second opinion on a
            specific property.
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-200 mb-2">
              Good reasons to write
            </h2>
            <ul className="text-sm text-slate-400 space-y-1.5 leading-relaxed">
              <li>· Audit a listing we haven&apos;t covered yet</li>
              <li>· Second opinion before signing a lease</li>
              <li>· Spotted an error in our data? Please tell us</li>
              <li>· Feature requests, feedback, partnership ideas</li>
            </ul>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-200 mb-2">
              What we can&apos;t do
            </h2>
            <ul className="text-sm text-slate-400 space-y-1.5 leading-relaxed">
              <li>· Legal or tax advice — talk to a notaris</li>
              <li>· Introduce you to agents (we&apos;re not brokers)</li>
              <li>· Guarantee ROI — our numbers are estimates</li>
              <li>· Respond to cold sales or SEO pitches</li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Our analysis is informational only and is not financial, legal, or
          investment advice. Always consult an independent Indonesian notaris
          and tax advisor before investing in Bali real estate.
        </p>

        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300">← Back to listings</Link>
          <span className="mx-3 text-slate-700">|</span>
          <Link href="/methodology" className="hover:text-slate-300">Methodology</Link>
          <span className="mx-3 text-slate-700">|</span>
          <Link href="/about" className="hover:text-slate-300">About</Link>
        </div>
      </div>
    </div>
  );
}
