'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon, BookOpen, TrendingUp, Home, Calendar, DollarSign, Percent, AlertTriangle, ExternalLink, BarChart3, Shield } from 'lucide-react';

export default function Methodology() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gradient-to-b from-slate-50 to-white text-slate-900'} min-h-screen transition-colors duration-200`}>
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-16">

        {/* NAV */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
            <ArrowLeft size={16} /> Back to listings
          </Link>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* HEADER */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Our <span className="text-blue-600 dark:text-blue-400">Methodology</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">How every number on Bali Villa Truth is calculated</p>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
            <strong className="flex items-center gap-1.5 mb-1"><Shield size={14} /> Our commitment</strong>
            We show you every assumption behind every number. No hidden floors, no inflated rates, no false precision.
            If we don&apos;t have real data, we tell you — and we give you the tools to plug in your own.
          </div>
        </header>

        {/* === SECTION: Data Sources === */}
        <section className="mb-10">
          <SectionHeading icon={<ExternalLink size={18} />} title="Where the data comes from" />
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              Every listing on Bali Villa Truth is sourced from <strong>Bali Home Immo (BHI)</strong>,
              one of the largest real estate aggregators in Bali. We scrape their public listings to capture asking prices,
              locations, bedroom counts, land size, lease terms, and property details.
            </p>
            <p>
              Nightly rental rates are derived from <strong>Booking.com market data</strong>. We scraped 2,499 actual
              villa listings across 12 areas and 5 bedroom tiers to build our rate model. This gives us real market
              rates — not agent estimates or wishful thinking.
            </p>
            <p>
              Exchange rates are fetched from <strong>ExchangeRate-API</strong> at the start of each pipeline run
              and used consistently throughout processing. The frontend also fetches live rates for display-time
              currency conversion.
            </p>
          </div>
        </section>

        {/* === SECTION: Nightly Rate === */}
        <section className="mb-10">
          <SectionHeading icon={<Home size={18} />} title="Nightly rate" />
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              Every listing gets an estimated nightly rental rate based on its area and bedroom count.
              Here&apos;s how we arrive at it:
            </p>

            <Step num={1} title="Base rate lookup">
              We maintain a rate model with real Booking.com data for 12 Bali areas across 5 bedroom tiers.
              For example, a 2-bedroom villa in Canggu starts at a base rate of $143/night, while a 2-bedroom
              in Ungasan starts at $96/night. These are medians from actual Booking.com listings, not assumptions.
            </Step>

            <Step num={2} title="Price-based adjustment">
              A villa priced well above the median for its area likely commands higher nightly rates (and vice versa).
              We apply a dampened adjustment: a villa at 2x the median price gets approximately 1.3x the base rate —
              not 2x. This prevents extreme distortions while acknowledging that pricier villas generally earn more per night.
              The adjustment is clamped between 0.6x and 1.6x to prevent absurd outliers.
            </Step>

            <Step num={3} title="Price cap">
              No villa can show a gross yield above 25%. This prevents cheap properties from displaying
              unrealistically high nightly rates. The cap formula: maximum nightly rate = (asking price × 25%) / (365 × occupancy).
            </Step>

            <InfoBox>
              <strong>What we removed:</strong> Until recently, we also applied a &ldquo;yield floor&rdquo; that artificially
              inflated nightly rates so no listing showed below 4% net yield. We removed this in our transparency overhaul.
              If a luxury villa genuinely yields 1-2%, you should see that number — not a manufactured minimum.
            </InfoBox>
          </div>
        </section>

        {/* === SECTION: Occupancy === */}
        <section className="mb-10">
          <SectionHeading icon={<Calendar size={18} />} title="Occupancy rate" />
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              We use a <strong>flat 65% occupancy rate</strong> across all areas — approximately 237 rented nights per year.
            </p>

            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" /> Why not area-specific rates?
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                We don&apos;t have reliable, area-specific occupancy data for Bali villas. Previously, we used tiered
                rates (75% for &ldquo;premium&rdquo; areas, 55% for &ldquo;emerging&rdquo; areas) — but those implied
                a precision we didn&apos;t actually have. A flat 65% is honest about the limitation.
              </p>
            </div>

            <p>
              In the compare panel, you can adjust occupancy from 20% to 95% to stress-test how
              different scenarios affect your returns. This is where area knowledge matters — if you know
              Canggu villas book at 80%, plug that in.
            </p>
          </div>
        </section>

        {/* === SECTION: Net Yield (ROI) === */}
        <section className="mb-10">
          <SectionHeading icon={<TrendingUp size={18} />} title="Net yield (the badge number)" />
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              The green, amber, or red badge on every listing shows the <strong>estimated net yield</strong> —
              what percentage of the purchase price you&apos;d earn annually after all operating costs.
              Here&apos;s the formula:
            </p>

            <div className="bg-slate-900 dark:bg-slate-800 text-slate-100 rounded-xl p-5 font-mono text-xs leading-loose overflow-x-auto">
              <div className="text-slate-500 mb-2">{`// The full calculation`}</div>
              <div>gross_revenue = nightly_rate × 365 × occupancy</div>
              <div>expenses = gross_revenue × 40%</div>
              <div>net_revenue = gross_revenue − expenses</div>
              <div className="mt-2 text-amber-400">{`// For leaseholds only:`}</div>
              <div>lease_cost = asking_price / remaining_years</div>
              <div>adjusted_revenue = net_revenue − lease_cost</div>
              <div className="mt-2 text-emerald-400 font-bold">net_yield = (adjusted_revenue / asking_price) × 100</div>
            </div>

            <p>
              The crossed-out &ldquo;Gross&rdquo; percentage you see above the badge is the number many agents
              quote — it ignores all operating costs and lease depreciation. We show it struck through so you can
              see exactly how much those costs eat into your returns.
            </p>
          </div>
        </section>

        {/* === SECTION: Operating Costs === */}
        <section className="mb-10">
          <SectionHeading icon={<DollarSign size={18} />} title="Operating costs (40%)" />
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              We deduct 40% of gross rental revenue for operating expenses. This breaks down as:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CostCard title="Property Management" pct="15%" desc="On-ground manager, cleaning, laundry, guest communication" />
              <CostCard title="OTA / Booking Fees" pct="15%" desc="Airbnb, Booking.com, and other platform commissions" />
              <CostCard title="Maintenance" pct="10%" desc="Pool care, garden, AC servicing, wifi, repairs" />
            </div>

            <p>
              Is 40% exact? No — some well-managed villas run at 35%, others at 50%. It&apos;s a reasonable
              industry midpoint. In the compare panel, you can adjust this between 20% and 60% to match
              your own operating model.
            </p>
          </div>
        </section>

        {/* === SECTION: Lease Depreciation === */}
        <section className="mb-10">
          <SectionHeading icon={<Calendar size={18} />} title="Lease depreciation" />
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              Most Bali properties available to foreign buyers are leaseholds — you&apos;re buying the right
              to use the land for a fixed number of years. When that lease expires, the asset reverts to the landowner.
            </p>
            <p>
              We deduct an annual lease cost from net revenue for <strong>all leasehold properties</strong>,
              calculated as:
            </p>

            <div className="bg-slate-900 dark:bg-slate-800 text-slate-100 rounded-xl p-4 font-mono text-xs">
              annual_lease_cost = asking_price / remaining_lease_years
            </div>

            <p>
              This means a $300,000 villa with 20 years left on the lease has $15,000/year deducted
              from net revenue before calculating the yield. A villa with 10 years has $30,000/year deducted.
              Shorter leases take a larger hit — as they should.
            </p>

            <p>
              Freehold properties (rare for foreign buyers in Bali) don&apos;t have this deduction.
              Properties with fewer than 15 years remaining are additionally flagged with a
              <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">SHORT LEASE</span>
              warning badge.
            </p>
          </div>
        </section>

        {/* === SECTION: Price Cap === */}
        <section className="mb-10">
          <SectionHeading icon={<Percent size={18} />} title="Price cap (25% gross yield limit)" />
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              No listing can display a gross yield above 25%. This prevents very cheap properties
              from showing unrealistic returns. The cap works by limiting the maximum nightly rate
              the system will assign:
            </p>

            <div className="bg-slate-900 dark:bg-slate-800 text-slate-100 rounded-xl p-4 font-mono text-xs">
              max_nightly = (asking_price × 0.25) / (365 × 0.65)
            </div>

            <p>
              If the Booking.com-based rate model produces a higher rate, we use this cap instead.
              Properties that hit the price cap are flagged with a
              <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">PRICE CAP</span>
              warning so you know the rate was constrained.
            </p>
          </div>
        </section>

        {/* === SECTION: Red Flags === */}
        <section className="mb-10">
          <SectionHeading icon={<AlertTriangle size={18} />} title="Red flags" />
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              We automatically flag listings that warrant extra scrutiny. These aren&apos;t deal-breakers —
              they&apos;re signals to investigate further.
            </p>

            <div className="space-y-3">
              <FlagRow name="SHORT LEASE" desc="Less than 15 years remaining on the lease. Lease depreciation significantly impacts returns." />
              <FlagRow name="PRICE CAP" desc="The nightly rate was capped to prevent unrealistic yields. Usually means the asking price is very low relative to the area." />
              <FlagRow name="BUDGET VILLA" desc="Price per bedroom is under $50,000. May indicate lower build quality, poor location within the area, or unusual property characteristics." />
            </div>
          </div>
        </section>

        {/* === SECTION: Compare Panel === */}
        <section className="mb-10">
          <SectionHeading icon={<BarChart3 size={18} />} title="The compare panel (your sandbox)" />
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              The badge shows our best estimate using the assumptions above. But those are <em>our</em> assumptions —
              they might not match your reality.
            </p>
            <p>
              The compare panel lets you select up to 5 villas and adjust three variables with sliders:
            </p>

            <div className="space-y-2">
              <SliderRow label="Nightly rate multiplier" range="0.5× to 2.0×" desc="Think rates are higher or lower? Adjust here." />
              <SliderRow label="Occupancy" range="20% to 95%" desc="Plug in your own occupancy estimate for the area." />
              <SliderRow label="Operating costs" range="20% to 60%" desc="Self-managed villa? Lower the costs. Full-service management? Raise them." />
            </div>

            <p>
              The yields in the compare panel update in real-time as you move the sliders. This is explicitly a
              different number from the badge — the badge is our pipeline estimate, the compare panel is your
              personal stress-test.
            </p>
          </div>
        </section>

        {/* === SECTION: What We Don't Know === */}
        <section className="mb-10">
          <SectionHeading icon={<Shield size={18} />} title="What we don't know" />
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>We believe in being upfront about the limits of our analysis:</p>
            <ul className="space-y-3 list-none">
              <LimitItem title="Actual occupancy rates">
                We assume 65% across the board. Real occupancy varies by area, season, marketing quality,
                and property condition. We&apos;re actively working on sourcing area-specific data.
              </LimitItem>
              <LimitItem title="True operating costs">
                Our 40% estimate is a reasonable industry midpoint, but your actual costs depend on
                management style, property age, staff arrangements, and platform mix.
              </LimitItem>
              <LimitItem title="Booking.com vs. actual rental performance">
                Our rate model is based on listed rates on Booking.com, not actual bookings.
                Actual rates may be lower (discounts, last-minute deals) or higher (direct bookings, premium guests).
              </LimitItem>
              <LimitItem title="Property condition and build quality">
                A listing&apos;s price doesn&apos;t tell us if the roof leaks or if the pool pump needs replacing.
                On-the-ground due diligence is irreplaceable.
              </LimitItem>
              <LimitItem title="Regulatory changes">
                Indonesian property law, tax rules, and visa regulations change. Our analysis reflects current conditions.
              </LimitItem>
            </ul>
          </div>
        </section>

        {/* === SECTION: Updates === */}
        <section className="mb-10">
          <SectionHeading icon={<BookOpen size={18} />} title="How we keep it current" />
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              Our pipeline runs periodically to capture new listings and price changes. Booking.com rate data
              is refreshed approximately monthly. When prices change by more than 1%, we log the event and
              snapshot the ROI at that point.
            </p>
            <p>
              This methodology page is a living document. When we change how we calculate something, we
              update it here. The most recent update was our &ldquo;transparency overhaul&rdquo; — unifying
              occupancy to a flat 65%, removing the artificial yield floor, and extending lease depreciation
              to all leasehold properties.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Bali Villa Truth</span><span className="mx-2">&bull;</span><span>Independent villa investment analysis</span></div>
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Back to listings
            </Link>
          </div>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-4">&copy; 2026 Bali Villa Truth. This site provides informational analysis only.</p>
        </footer>
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
      <span className="text-blue-600 dark:text-blue-400">{icon}</span>
      {title}
    </h2>
  );
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
        {num}
      </div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</p>
        <p className="text-slate-600 dark:text-slate-400">{children}</p>
      </div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-blue-800 dark:text-blue-200">
      {children}
    </div>
  );
}

function CostCard({ title, pct, desc }: { title: string; pct: string; desc: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{title}</span>
        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{pct}</span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function FlagRow({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
      <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 mt-0.5">
        {name}
      </span>
      <p className="text-xs text-slate-600 dark:text-slate-400">{desc}</p>
    </div>
  );
}

function SliderRow({ label, range, desc }: { label: string; range: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono px-2 py-1 rounded mt-0.5">{range}</span>
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{label}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

function LimitItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-500 mt-2"></span>
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">{title}</p>
        <p className="text-slate-600 dark:text-slate-400">{children}</p>
      </div>
    </li>
  );
}
