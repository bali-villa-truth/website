'use client';
import Link from 'next/link';
import { BookOpen, TrendingUp, Home, Calendar, DollarSign, AlertTriangle, ExternalLink, BarChart3, Shield } from 'lucide-react';

export default function Methodology() {
  return (
    <div className="bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-16">

        {/* Breadcrumb */}
        <nav className="mb-10 text-[12px]" aria-label="Breadcrumb">
          <Link href="/" className="text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)] transition-colors">
            Home
          </Link>
          <span className="mx-2 text-[color:var(--bvt-ink-faint)]">/</span>
          <span className="text-[color:var(--bvt-ink)]">Methodology</span>
        </nav>

        {/* HEADER — editorial masthead */}
        <header className="mb-16 md:mb-20 max-w-[900px]">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Editorial standards</span>
          </div>
          <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[56px] md:text-[72px]">
            How every number
            <br />
            <span className="text-[color:var(--bvt-accent)]">is calculated.</span>
          </h1>
          <p className="mt-8 max-w-[62ch] text-[17px] md:text-[19px] leading-[1.6] text-[color:var(--bvt-ink-body)]">
            We show you every assumption behind every number. No hidden floors,
            no inflated rates, no false precision. If we don&apos;t have real
            data, we tell you — and we give you the tools to plug in your own.
          </p>
        </header>

        {/* === SECTION: Data Sources === */}
        <section className="mb-12 md:mb-16">
          <SectionHeading icon={<ExternalLink size={18} />} title="Where the data comes from" />
          <div className="space-y-4 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[68ch]">
            <p>
              Every listing on Bali Villa Truth is sourced from <strong className="text-[color:var(--bvt-ink)]">Bali Home Immo (BHI)</strong>,
              one of the largest real estate aggregators in Bali. We scrape their public listings to capture asking prices,
              locations, bedroom counts, land size, lease terms, and property details.
            </p>
            <p>
              Nightly rental rates are derived from a <strong className="text-[color:var(--bvt-ink)]">50/50 blend of Booking.com and Airbnb market data</strong>.
              We scrape actual villa listings across 12 areas and 5 bedroom tiers on both platforms to build our rate model
              — Booking.com gave us 2,499 data points and Airbnb added 415 more. Blending both platforms gives us a more
              honest market rate: Booking.com skews toward established properties, Airbnb toward newer and boutique stays.
              Neither alone tells the full story. A 15% &quot;reality discount&quot; is applied to the platform medians to
              account for the fact that asking rates are not the same as realized rates. We also use Booking.com review
              density data to estimate area-specific occupancy — more details in the occupancy section below.
            </p>
            <p>
              Exchange rates are fetched from <strong className="text-[color:var(--bvt-ink)]">ExchangeRate-API</strong> at the start of each pipeline run
              and used consistently throughout processing. The frontend also fetches live rates for display-time
              currency conversion.
            </p>
          </div>
        </section>

        {/* === SECTION: Nightly Rate === */}
        <section className="mb-12 md:mb-16">
          <SectionHeading icon={<Home size={18} />} title="Nightly rate" />
          <div className="space-y-5 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[68ch]">
            <p>
              Every listing gets an estimated nightly rental rate based on its area and bedroom count.
              Here&apos;s how we arrive at it:
            </p>

            <Step num={1} title="Area + bedroom rate lookup">
              Every listing gets a nightly rate based purely on its area and bedroom count. We maintain a
              rate model blending real Booking.com and Airbnb data for 12 Bali areas across 5 bedroom tiers.
              For example, a 2-bedroom villa in Canggu is estimated at $143/night, while a 2-bedroom
              in Ungasan is $96/night. These are medians from actual listings on both platforms, not assumptions.
              Every villa in the same area and bedroom tier gets the same base rate — the rental market
              sets prices by location and size, not by what sellers are asking.
            </Step>

            <Step num={2} title="Budget property discount">
              If a villa&apos;s asking price falls below the <strong className="text-[color:var(--bvt-ink)]">25th percentile</strong> for its area and bedroom tier,
              we apply a flat 30% discount to the nightly rate. A $107K villa in Nusa Dua almost certainly can&apos;t
              command the same $170/night as a $500K property with an infinity pool and ocean view — even though
              they&apos;re in the same area with the same bedroom count. The discount acknowledges this reality
              without reintroducing circular math: it&apos;s a binary trigger (below threshold → yes/no), not a
              continuous function of price. You&apos;ll see &quot;Budget Villa&quot; flagged on these listings with the
              discounted rate shown transparently — e.g. &quot;$119/nt (discounted from $170 area median)&quot;.
            </Step>

            <Step num={3} title="No other adjustments">
              Beyond the budget discount, the rate goes straight into the yield formula. We don&apos;t cap it,
              inflate it, or apply continuous price-based scaling. If a mid-range villa shows a high yield,
              that&apos;s real information — the rental market rate for that area is high relative to the purchase
              price. We flag unusually high yields so you can investigate, but we never hide the number.
            </Step>

            <InfoBox>
              <strong className="text-[color:var(--bvt-ink)]">What we deliberately removed:</strong> Earlier versions of BVT applied two manipulations
              that undermined trust. First, a price-based rate adjustment that scaled nightly rates up or
              down based on the villa&apos;s sale price — this created circular math where yields converged to
              the same number regardless of price. Second, a yield cap and floor that artificially compressed
              all results into a narrow band. Both defeated the purpose of comparison. The budget discount
              (step 2) is the honest middle ground: it acknowledges that cheap properties can&apos;t command
              median rates, without letting price flow continuously into yield math.
            </InfoBox>
          </div>
        </section>

        {/* === SECTION: Occupancy === */}
        <section className="mb-12 md:mb-16">
          <SectionHeading icon={<Calendar size={18} />} title="Occupancy rate" />
          <div className="space-y-5 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[68ch]">
            <p>
              We estimate area-specific occupancy rates ranging from <strong className="text-[color:var(--bvt-ink)]">40% to 80%</strong> based on
              Booking.com review density. Areas with more reviews per property indicate higher demand,
              which we use as a proxy for occupancy. This replaced our earlier flat 65% assumption.
            </p>

            <Step num={1} title="Review density as a demand proxy">
              We sample villa listings on Booking.com across 12 Bali areas, collecting review counts
              and scores per property. More reviews generally means more bookings — a property with 400 reviews
              has almost certainly hosted more guests than one with 15. We use a blended median/mean of review
              counts per area to reduce the skew from outlier mega-resorts.
            </Step>

            <Step num={2} title="Relative ranking, not absolute conversion">
              We don&apos;t try to convert review counts directly into occupancy numbers — that would require
              knowing average stay length, review-to-booking ratios, and listing ages, which we don&apos;t have.
              Instead, we rank areas by review density and map them onto a 40%–80% range. The busiest area
              gets the highest occupancy, the quietest gets the lowest, and everything else is interpolated.
              This relative approach avoids brittle assumptions while still differentiating between areas.
            </Step>

            <Step num={3} title="Confidence levels">
              Not all estimates are equally reliable. We show you how confident we are based on how many
              properties we sampled per area:
            </Step>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 not-prose">
              <ConfidenceCard level="High confidence" count="n ≥ 15" desc="Large sample size. Reliable estimate for the area." tone="strong" />
              <ConfidenceCard level="Medium confidence" count="n = 8–14" desc="Moderate sample. Reasonable estimate, but more data would help." tone="medium" />
              <ConfidenceCard level="Low confidence" count="n < 8" desc="Small sample. Treat as a rough estimate — the area may not be well-represented." tone="weak" />
            </div>

            <div className="bg-[color:var(--bvt-bg-elev)] border border-[color:var(--bvt-hairline)] rounded-md p-5">
              <p className="font-semibold text-[color:var(--bvt-ink)] mb-2 flex items-center gap-2 text-[13px]">
                <AlertTriangle size={14} className="text-[color:var(--bvt-accent)]" />
                <span className="label-micro">What this is not</span>
              </p>
              <p className="text-[14px] leading-[1.65] text-[color:var(--bvt-ink-body)]">
                This is not actual occupancy data. It&apos;s an estimate derived from a proxy (review density)
                for a proxy (demand). It&apos;s better than a flat guess — it captures the real difference
                between a bustling Seminyak and a quiet Tabanan — but it&apos;s still an approximation.
                For areas where we couldn&apos;t gather enough data, we fall back to a flat 65% and label
                it clearly as &ldquo;assumed.&rdquo;
              </p>
            </div>

            <p>
              In the compare panel, you can adjust occupancy from 20% to 95% to stress-test how
              different scenarios affect your returns. If you have on-the-ground knowledge that
              Canggu villas book at 80%, plug that in — your local insight will always beat our model.
            </p>
          </div>
        </section>

        {/* === SECTION: Net Yield (ROI) === */}
        <section className="mb-12 md:mb-16">
          <SectionHeading icon={<TrendingUp size={18} />} title="Net yield (the badge number)" />
          <div className="space-y-5 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[68ch]">
            <p>
              The green, amber, or red badge on every listing shows the <strong className="text-[color:var(--bvt-ink)]">estimated net yield</strong> —
              what percentage of the purchase price you&apos;d earn annually after all operating costs.
              Here&apos;s the formula:
            </p>

            <div className="bg-[color:var(--bvt-bg-elev)] border border-[color:var(--bvt-hairline)] rounded-md p-5 font-mono text-[12px] leading-[1.9] tabular-nums overflow-x-auto text-[color:var(--bvt-ink)]">
              <div className="text-[color:var(--bvt-ink-faint)] mb-2">{`// The full calculation`}</div>
              <div>gross_revenue = nightly_rate × 365 × occupancy</div>
              <div>expenses = gross_revenue × 40%</div>
              <div>net_revenue = gross_revenue − expenses</div>
              <div className="mt-3 text-[color:var(--bvt-accent)]">{`// For leaseholds only:`}</div>
              <div>lease_cost = asking_price / remaining_years</div>
              <div>adjusted_revenue = net_revenue − lease_cost</div>
              <div className="mt-3 text-[color:var(--bvt-accent)] font-bold">net_yield = (adjusted_revenue / asking_price) × 100</div>
            </div>

            <p>
              The crossed-out &ldquo;Gross&rdquo; percentage you see above the badge is the number many agents
              quote — it ignores all operating costs and lease depreciation. We show it struck through so you can
              see exactly how much those costs eat into your returns.
            </p>
          </div>
        </section>

        {/* === SECTION: Operating Costs === */}
        <section className="mb-12 md:mb-16">
          <SectionHeading icon={<DollarSign size={18} />} title="Operating costs (40%)" />
          <div className="space-y-5 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[68ch]">
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
        <section className="mb-12 md:mb-16">
          <SectionHeading icon={<Calendar size={18} />} title="Lease depreciation" />
          <div className="space-y-5 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[68ch]">
            <p>
              Most Bali properties available to foreign buyers are leaseholds — you&apos;re buying the right
              to use the land for a fixed number of years. When that lease expires, the asset reverts to the landowner.
            </p>
            <p>
              We deduct an annual lease cost from net revenue for <strong className="text-[color:var(--bvt-ink)]">all leasehold properties</strong>,
              calculated as:
            </p>

            <div className="bg-[color:var(--bvt-bg-elev)] border border-[color:var(--bvt-hairline)] rounded-md p-4 font-mono text-[12px] tabular-nums text-[color:var(--bvt-ink)]">
              annual_lease_cost = asking_price / remaining_lease_years
            </div>

            <p>
              This means a $300,000 villa with 20 years left on the lease has $15,000/year deducted
              from net revenue before calculating the yield. A villa with 10 years has $30,000/year deducted.
              Shorter leases take a larger hit — as they should.
            </p>

            <p>
              Freehold properties (rare for foreign buyers in Bali) don&apos;t have this deduction.
              Properties with fewer than 15 years remaining are additionally flagged with a{' '}
              <span className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold tracking-wider bg-[color:var(--bvt-accent)]/15 text-[color:var(--bvt-accent)] border border-[color:var(--bvt-accent)]/30 uppercase">Short Lease</span>{' '}
              warning badge.
            </p>
          </div>
        </section>

        {/* === SECTION: Red Flags === */}
        <section className="mb-12 md:mb-16">
          <SectionHeading icon={<AlertTriangle size={18} />} title="Red flags" />
          <div className="space-y-5 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[68ch]">
            <p>
              We automatically flag listings that warrant extra scrutiny. These aren&apos;t deal-breakers —
              they&apos;re signals to investigate further.
            </p>

            <div className="space-y-3">
              <FlagRow name="Short Lease" desc="Less than 15 years remaining on the lease. Lease depreciation significantly impacts returns." />
              <FlagRow name="Budget Villa" desc="Asking price is below the 25th percentile for its area and bedroom tier. Nightly rate is discounted 30% from the area median to reflect that budget properties typically can't command median rates. Tooltip shows the exact discount." />
              <FlagRow name="High Yield" desc="Gross yield exceeds 20%. This could mean it's genuinely underpriced, or that the asking price doesn't reflect reality. Investigate the property directly." />
              <FlagRow name="Optimistic Claim" desc="Gross yield is 15–20%. The gap between gross and net yield (after expenses and depreciation) is where investors lose money." />
            </div>
          </div>
        </section>

        {/* === SECTION: Compare Panel === */}
        <section className="mb-12 md:mb-16">
          <SectionHeading icon={<BarChart3 size={18} />} title="The compare panel (your sandbox)" />
          <div className="space-y-5 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[68ch]">
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
        <section className="mb-12 md:mb-16">
          <SectionHeading icon={<Shield size={18} />} title="What we don't know" />
          <div className="space-y-5 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[68ch]">
            <p>We believe in being upfront about the limits of our analysis:</p>
            <ul className="space-y-4 list-none pl-0">
              <LimitItem title="Actual occupancy rates">
                Our occupancy estimates are derived from Booking.com review density — a proxy for demand,
                not a direct measure of bookings. Review counts don&apos;t account for seasonality,
                direct bookings (which skip OTAs entirely), or how long a property has been listed.
                We show confidence levels so you can judge how much weight to give each estimate.
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
        <section className="mb-12 md:mb-16">
          <SectionHeading icon={<BookOpen size={18} />} title="How we keep it current" />
          <div className="space-y-5 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[68ch]">
            <p>
              Our pipeline runs periodically to capture new listings and price changes. Booking.com rate data
              is refreshed approximately monthly. Occupancy estimates are refreshed quarterly — review
              counts change slowly, so more frequent updates would add noise without signal.
              When prices change by more than 1%, we log the event and snapshot the ROI at that point.
            </p>
            <p>
              This methodology page is a living document. When we change how we calculate something, we
              update it here. The most recent updates: area-specific occupancy estimation with confidence
              indicators (replacing the flat 65% assumption), graduated budget discounts for cheap
              properties, and transparent rate sourcing showing where every nightly rate comes from.
            </p>
          </div>
        </section>

        {/* Global SiteFooter renders via app/layout.tsx */}
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-3 font-display text-[26px] md:text-[30px] leading-tight tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-6 pb-4 border-b border-[color:var(--bvt-hairline)]">
      <span className="text-[color:var(--bvt-accent)]">{icon}</span>
      {title}
    </h2>
  );
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full border border-[color:var(--bvt-accent)]/40 bg-[color:var(--bvt-accent)]/10 flex items-center justify-center text-[12px] font-mono tabular-nums font-semibold text-[color:var(--bvt-accent)] mt-0.5">
        {num}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-[color:var(--bvt-ink)] mb-1 text-[15px]">{title}</p>
        <p className="text-[color:var(--bvt-ink-body)] leading-[1.65]">{children}</p>
      </div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-[color:var(--bvt-accent)] bg-[color:var(--bvt-bg-elev)]/60 pl-5 pr-5 py-4 text-[14px] leading-[1.65] text-[color:var(--bvt-ink-body)]">
      {children}
    </div>
  );
}

function ConfidenceCard({ level, count, desc, tone }: { level: string; count: string; desc: string; tone: 'strong' | 'medium' | 'weak' }) {
  const accentClass =
    tone === 'strong' ? 'text-[color:var(--bvt-accent)]' :
    tone === 'medium' ? 'text-[color:var(--bvt-accent)]/70' :
    'text-[color:var(--bvt-ink-muted)]';
  return (
    <div className="bg-[color:var(--bvt-bg-elev)] border border-[color:var(--bvt-hairline)] rounded-md p-4">
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <span className={`label-micro ${accentClass}`}>{level}</span>
        <span className={`font-mono tabular-nums text-[13px] font-semibold ${accentClass}`}>{count}</span>
      </div>
      <p className="text-[12px] leading-[1.55] text-[color:var(--bvt-ink-muted)]">{desc}</p>
    </div>
  );
}

function CostCard({ title, pct, desc }: { title: string; pct: string; desc: string }) {
  return (
    <div className="bg-[color:var(--bvt-bg-elev)] border border-[color:var(--bvt-hairline)] rounded-md p-4">
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <span className="label-micro text-[color:var(--bvt-ink)]">{title}</span>
        <span className="text-[color:var(--bvt-accent)] font-mono tabular-nums font-bold text-[20px] leading-none">{pct}</span>
      </div>
      <p className="text-[12px] leading-[1.55] text-[color:var(--bvt-ink-muted)]">{desc}</p>
    </div>
  );
}

function FlagRow({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start border-b border-[color:var(--bvt-hairline)] pb-4 last:border-b-0">
      <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold tracking-wider uppercase bg-[color:var(--bvt-accent)]/15 text-[color:var(--bvt-accent)] border border-[color:var(--bvt-accent)]/30 mt-0.5 whitespace-nowrap">
        {name}
      </span>
      <p className="text-[14px] leading-[1.65] text-[color:var(--bvt-ink-body)]">{desc}</p>
    </div>
  );
}

function SliderRow({ label, range, desc }: { label: string; range: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start py-2">
      <span className="flex-shrink-0 bg-[color:var(--bvt-bg-elev)] border border-[color:var(--bvt-hairline)] text-[color:var(--bvt-ink-muted)] text-[11px] font-mono tabular-nums px-2 py-1 rounded-sm mt-0.5 whitespace-nowrap">{range}</span>
      <div className="flex-1">
        <p className="font-semibold text-[color:var(--bvt-ink)] text-[14px] mb-0.5">{label}</p>
        <p className="text-[13px] leading-[1.55] text-[color:var(--bvt-ink-muted)]">{desc}</p>
      </div>
    </div>
  );
}

function LimitItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 items-start">
      <span className="flex-shrink-0 w-1 h-1 rounded-full bg-[color:var(--bvt-accent)] mt-[0.65rem]" aria-hidden></span>
      <div className="flex-1">
        <p className="font-semibold text-[color:var(--bvt-ink)] mb-1">{title}</p>
        <p className="text-[color:var(--bvt-ink-body)] leading-[1.65]">{children}</p>
      </div>
    </li>
  );
}
