'use client';
import { ArrowLeft, Calculator, AlertTriangle, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function Methodology() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      
      {/* HEADER */}
      <header className="max-w-3xl mx-auto mb-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Listings
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Our <span className="text-blue-600">Methodology</span>
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          How we calculate ROI and why our numbers differ from what agents show you.
        </p>
      </header>

      <main className="max-w-3xl mx-auto space-y-8">
        
        {/* WHY WE EXIST */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <ShieldCheck className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-bold">Why We Exist</h2>
          </div>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              Most Bali villa listings show ROI projections of 15-20%. These numbers are often inflated - based on 85% occupancy rates that do not reflect reality, or lease terms that are not disclosed upfront.
            </p>
            <p>
              We built Bali Villa Truth to give investors the real numbers. Independent analysis, no agent relationships, no incentive to inflate.
            </p>
          </div>
        </section>

        {/* THE FORMULA */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <Calculator className="text-green-600" size={20} />
            </div>
            <h2 className="text-xl font-bold">The Formula</h2>
          </div>
          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 font-mono text-sm mb-4">
            <div className="mb-2">
              <span className="text-slate-400">Annual Revenue</span> = Nightly Rate x 365 x Occupancy Rate
            </div>
            <div>
              <span className="text-slate-400">ROI</span> = Annual Revenue / Purchase Price x 100
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Simple math, but the inputs matter. Industry benchmarks for Bali: <strong>leasehold 10–15%</strong>, <strong>freehold 5–8%</strong>. We use conservative occupancy (55–60%) and nightly estimates so our projections align with these ranges. Here is how we determine each variable:
          </p>
        </section>

        {/* NIGHTLY RATE */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <h2 className="text-lg font-bold mb-4">Estimated Nightly Rate</h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              We do not use the agent projected rental income. Instead, we estimate rates based on:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                <span><strong>Bedroom count</strong> - baseline comparable rate for the area</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                <span><strong>Location premium</strong> - beachfront and ocean views command higher rates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                <span><strong>Property condition</strong> - brand new builds outperform older renovations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                <span><strong>Walkability</strong> - distance to beach, cafes, and amenities</span>
              </li>
            </ul>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
              <p className="text-xs text-blue-800">
                <strong>Example:</strong> A 3BR villa in Pererenan starts at a base rate of $350/night. Add beachfront access (+40%) and luxury finishes (+15%), and the adjusted rate becomes $542/night.
              </p>
            </div>
          </div>
        </section>

        {/* OCCUPANCY RATE */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <h2 className="text-lg font-bold mb-4">Occupancy Rate</h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              <strong>Agents assume 85% occupancy. We do not.</strong>
            </p>
            <p>
              Our estimates range from <strong>55% to 75%</strong> based on:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">*</span>
                <span>Location desirability (Seminyak vs. Tabanan)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">*</span>
                <span>Property quality signals (new vs. dated)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">*</span>
                <span>Seasonal demand patterns</span>
              </li>
            </ul>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-700">55%</div>
                <div className="text-[10px] text-red-600">Lower Demand</div>
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-slate-700">65%</div>
                <div className="text-[10px] text-slate-600">Standard</div>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-700">75%</div>
                <div className="text-[10px] text-green-600">High Demand</div>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WE DON'T DO */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <h2 className="text-xl font-bold">What We Do Not Factor In</h2>
          </div>
          <div className="text-sm text-slate-600 leading-relaxed">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <span><strong>Management fees</strong> - typically 15-25% of revenue, but varies by operator</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <span><strong>Taxes</strong> - Indonesian tax obligations depend on your structure</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <span><strong>Maintenance</strong> - pool, garden, AC servicing, repairs</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <span><strong>Furnishing costs</strong> - if the property is not turnkey</span>
              </li>
            </ul>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4">
              <p className="text-xs text-amber-800">
                <strong>Why?</strong> These costs vary dramatically by owner situation. Our ROI is a gross estimate for comparison purposes - not a guaranteed net return.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT FLAGGED MEANS */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <h2 className="text-lg font-bold mb-4">What High ROI Means</h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              When we flag a villa with HIGH ROI (above 50%), it means the numbers look exceptional - and should be verified carefully.
            </p>
            <p>
              A high ROI could indicate:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-green-500">+</span>
                <span>A genuinely underpriced opportunity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">!</span>
                <span>Optimistic pricing from the seller</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">!</span>
                <span>Hidden issues not reflected in the listing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">-</span>
                <span>Incorrect data from the source listing</span>
              </li>
            </ul>
            <p className="mt-3">
              <strong>A flag does not mean do not buy</strong> - it means verify before you commit.
            </p>
          </div>
        </section>

        {/* DATA SOURCES */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <h2 className="text-lg font-bold mb-4">Our Data Sources</h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              We crawl listings from Bali major villa sales platforms weekly. Our data is extracted automatically and audited by our algorithm.
            </p>
            <p>
              <strong>We do not have commercial relationships with any agents or developers.</strong> Our only incentive is providing accurate information to investors.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 md:p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Ready to Find Your Investment?</h2>
          <p className="text-blue-100 text-sm mb-4">Browse our audited listings and unlock full analysis.</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            View All Listings
          </Link>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="max-w-3xl mx-auto mt-12 pt-8 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div>
            <span className="font-bold text-slate-700">Bali Villa Truth</span>
            <span className="mx-2">|</span>
            <span>Independent villa investment analysis</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="mailto:tips@balivillatruth.com" className="hover:text-blue-600 transition-colors">
              Contact
            </a>
            <span className="text-slate-300">|</span>
            <a href="#" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </a>
            <span className="text-slate-300">|</span>
            <a href="#" className="hover:text-blue-600 transition-colors">
              Terms
            </a>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-4">
          2026 Bali Villa Truth. This site provides informational analysis only and does not constitute financial or legal advice.
        </p>
      </footer>
    </div>
  );
}
