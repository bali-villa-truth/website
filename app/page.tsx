'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { MapPin, Ruler, Calendar, Lock, X, ShieldCheck, Info, TrendingUp, Search, AlertTriangle, Filter, DollarSign, Percent, Home, Layers, ArrowUpDown, Bed, Bath, Map, LayoutList, ShieldAlert, Eye, SlidersHorizontal, BarChart3, Check, Heart, Sun, Moon, BookOpen, Shield, ChevronDown, Clock, Globe } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FALLBACK_RATES: Record<string, number> = { USD: 1, IDR: 16782, AUD: 1.53, EUR: 0.92, SGD: 1.34 };

// Indonesian real estate glossary for foreign buyers
const GLOSSARY: Record<string, { label: string; tip: string }> = {
  'hak_milik': { label: 'Hak Milik', tip: 'Freehold ownership — the strongest title in Indonesia. Foreigners cannot hold Hak Milik directly; most use a PT PMA (foreign-owned company) or nominee structure.' },
  'hak_sewa': { label: 'Hak Sewa', tip: 'Leasehold — a right to use property for a fixed period. The most common structure for foreign buyers in Bali. The asset reverts to the landowner when the lease expires.' },
  'shm': { label: 'SHM', tip: 'Sertifikat Hak Milik — the freehold land certificate. The highest form of land ownership in Indonesia, reserved for Indonesian citizens.' },
  'imb': { label: 'IMB', tip: 'Izin Mendirikan Bangunan — the building construction permit. Essential for legal builds. Without an IMB (now called PBG), a property may face demolition risk.' },
  'pbg': { label: 'PBG', tip: 'Persetujuan Bangunan Gedung — the new building approval that replaced IMB in 2021. Required for all new construction.' },
  'pt_pma': { label: 'PT PMA', tip: 'Foreign-owned Indonesian company (Penanaman Modal Asing). The legal way for foreigners to hold property — requires minimum investment and ongoing compliance costs.' },
  'notaris': { label: 'Notaris', tip: 'Indonesian notary — handles all property transactions, lease agreements, and company formations. A trusted notaris is essential for any Bali property purchase.' },
};

function GlossaryTip({ term }: { term: keyof typeof GLOSSARY }) {
  const g = GLOSSARY[term];
  if (!g) return null;
  return (
    <span className="relative group/glossary inline-flex items-center">
      <Info size={11} className="text-slate-400 group-hover/glossary:text-blue-500 cursor-help ml-1 flex-shrink-0" />
      <span className="invisible group-hover/glossary:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[10px] leading-relaxed rounded-lg px-3 py-2.5 shadow-xl z-50 pointer-events-none">
        <span className="font-bold text-blue-300">{g.label}</span>
        <span className="block mt-1 text-slate-300">{g.tip}</span>
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></span>
      </span>
    </span>
  );
}

/**
 * Paste-BHI-URL search box (#11).
 * If the pasted URL matches an audited listing, jump straight there.
 * Otherwise, scroll to the listings grid — less friction than hunting through filters.
 */
function PasteListingUrlBox({ listings }: { listings: any[] }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const normalize = (s: string) => s.trim().replace(/\/+$/, '').toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) return;
    const target = normalize(trimmed);
    const match = listings.find(v => v.url && normalize(v.url) === target);
    if (match && match.slug) {
      window.location.href = `/listing/${match.slug}`;
      return;
    }
    if (match) {
      // Fallback when slug missing — scroll to grid and let filter show it
      document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (listings.length === 0) {
      document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setError("We haven't audited that listing yet. Want us to? Email audits@balivillatruth.com");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl mb-6 md:mb-8"
      aria-label="Paste a Bali Home Immo listing URL"
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste any Bali Home Immo URL to see its audit..."
          className="flex-1 bg-white/5 border border-white/10 focus:border-[#d4943a] rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-slate-100 text-sm font-semibold px-5 py-2.5 rounded-lg border border-white/10 transition-colors"
        >
          <Search size={14} />
          Audit It
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-amber-400 mt-1.5 text-left" role="alert">{error}</p>
      )}
    </form>
  );
}

/**
 * FAQ block (#14) — common buyer questions + FAQPage JSON-LD for rich snippets.
 * Questions are informed by the real search intent: lease vs freehold, ROI skepticism,
 * what makes BVT different from agents.
 */
function FAQSection() {
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: 'Is Bali Villa Truth affiliated with Bali Home Immo or any other agent?',
      a: "No. We're an independent auditor. We don't sell villas, take commissions, or get paid by agents. The BHI link on each listing opens the original agent page — we earn nothing if you book.",
    },
    {
      q: 'How is your ROI different from the one on the listing page?',
      a: "Agent ROI is typically gross yield — rental revenue divided by purchase price. We strip out 40% for operating costs (management, OTA commissions, maintenance, utilities) and, for leasehold properties, subtract annual lease depreciation. The result is a cash-on-cash number that reflects what actually lands in your pocket.",
    },
    {
      q: 'Can foreigners own property in Bali?',
      a: "Not directly as Hak Milik (freehold). Foreigners typically hold property through (a) a long-term Hak Sewa lease, usually 25-30 years, or (b) a PT PMA (foreign-owned Indonesian company). Each has legal, tax and exit-liquidity trade-offs — talk to an independent notaris before signing anything.",
    },
    {
      q: 'Why do so many listings have red flags?',
      a: "Bali's market is brochure-driven — ROI claims of 15-25% are common but rarely survive expense modeling. Our flags aren't judgments; they surface assumptions we had to push back on (short lease, inflated nightly rate, missing data). A flagged villa can still be a good buy — you just go in with eyes open.",
    },
    {
      q: 'How often is the data updated?',
      a: 'We re-scrape Bali Home Immo weekly and re-run the audit whenever price or status changes. Every listing page shows its last re-audit date.',
    },
    {
      q: 'Do you offer a paid deep audit?',
      a: "A paid deep-dive service is in the pipeline for Q2 2026 — contract review, exit-scenario modeling, and a live walkthrough. Email audits@balivillatruth.com if you'd like to be first in line.",
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <section className="max-w-[1400px] mx-auto mt-24 md:mt-32 px-6 md:px-10" id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <header className="lg:col-span-4">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Field guide</span>
          </div>
          <h2 className="font-display text-[color:var(--bvt-ink)] text-[36px] md:text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
            The questions<br />buyers actually ask.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[color:var(--bvt-ink-muted)] max-w-[36ch]">
            No hedging, no brochure copy. If you&apos;re about to commit a seven-figure
            sum, these are the things you should already know.
          </p>
        </header>

        <div className="lg:col-span-8">
          <div className="border-t border-[color:var(--bvt-hairline)]">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group border-b border-[color:var(--bvt-hairline)] py-5 md:py-6 px-1"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-6 list-none">
                  <span className="font-display text-[20px] md:text-[22px] leading-tight tracking-[-0.01em] text-[color:var(--bvt-ink)]">
                    {f.q}
                  </span>
                  <span className="shrink-0 mt-1 text-[color:var(--bvt-accent)] transition-transform group-open:rotate-45 font-mono text-[20px] leading-none select-none" aria-hidden>+</span>
                </summary>
                <p className="mt-4 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[65ch]">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Weekly digest newsletter signup (#18). Low-pressure, no-spam copy.
 * Posts to /api/subscribe which saves to leads table with lead_type='Newsletter'.
 */
function NewsletterBlock() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setOk(true);
    } catch {
      setError("Couldn't subscribe — try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-[1400px] mx-auto mt-24 md:mt-32 px-6 md:px-10" id="newsletter">
      <div className="relative overflow-hidden border-t border-b border-[color:var(--bvt-hairline)] py-16 md:py-20">
        {/* Ambient gold halo — subtle, luxury */}
        <div
          aria-hidden
          className="absolute -top-40 -right-40 w-[600px] h-[600px] pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212,148,58,0.08) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
              <span className="label-micro">The Monday dispatch</span>
            </div>
            <h2 className="font-display text-[color:var(--bvt-ink)] text-[36px] md:text-[48px] lg:text-[58px] leading-[1.02] tracking-[-0.02em]">
              Price drops, new red flags,<br />
              <span className="text-[color:var(--bvt-accent)]">one villa worth a closer look.</span>
            </h2>
            <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.6] text-[color:var(--bvt-ink-body)]">
              Monday mornings, in your inbox. Notable price moves from the week,
              the newest audits, and a featured deep-dive with the full math.
              No agent affiliates. No property pitches.
            </p>
            <p className="mt-3 text-[12px] text-[color:var(--bvt-ink-dim)]">
              Unsubscribe with one click. We&apos;ll never sell your email.
            </p>
          </div>

          <div className="lg:col-span-5">
            {ok ? (
              <div className="border border-[color:var(--bvt-accent)]/40 bg-[color:var(--bvt-accent)]/[0.04] rounded-md p-6">
                <div className="label-micro text-[color:var(--bvt-accent)] mb-2">Subscribed</div>
                <p className="font-display text-[22px] leading-tight text-[color:var(--bvt-ink)]">
                  You&apos;re in. Welcome email on its way.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label htmlFor="newsletter-email" className="label-micro block">
                  Your email
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@somewhere.com"
                    required
                    aria-label="Email address for newsletter"
                    className="flex-1 bg-[color:var(--bvt-bg-elev)] border border-[color:var(--bvt-hairline-2)] focus:border-[color:var(--bvt-accent)] rounded-md px-4 py-3 text-[15px] text-[color:var(--bvt-ink)] placeholder-[color:var(--bvt-ink-faint)] outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-1.5 bg-[color:var(--bvt-accent)] hover:bg-[color:var(--bvt-accent-warm)] text-[color:var(--bvt-bg)] font-semibold text-[14px] px-5 py-3 rounded-md transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Subscribing…' : 'Subscribe'}
                    {!submitting && (
                      <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-[12px] text-[color:var(--bvt-bad)] mt-1" role="alert">{error}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BaliVillaTruth() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVilla, setSelectedVilla] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRoi, setHoveredRoi] = useState<number | null>(null);
  const [leadCount, setLeadCount] = useState<number>(0);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);

  // --- FILTER STATES ---
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterPrice, setFilterPrice] = useState(10000000); 
  const [filterRoi, setFilterRoi] = useState(-99);
  const [filterLandSize, setFilterLandSize] = useState(0);
  const [filterBuildSize, setFilterBuildSize] = useState(0);
  const [filterBeds, setFilterBeds] = useState(0);
  const [filterBaths, setFilterBaths] = useState(0);
  const [filterLeaseType, setFilterLeaseType] = useState('All');
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD'); // Show all prices in this currency
  // Default sort: price-asc. Previously 'roi-desc' surfaced HIGH_YIELD flagged listings first
  // which hurt trust — cheapest-first is a neutral default that respects buyer intent.
  const [sortOption, setSortOption] = useState('price-asc');
  const [showMap, setShowMap] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [hoveredListingUrl, setHoveredListingUrl] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, Array<{price_usd: number, recorded_at: string}>>>({});
  const [hoveredPriceBadge, setHoveredPriceBadge] = useState<number | null>(null);

  // --- DARK MODE ---
  // Default to dark (#16 — unify theme: hero is already dark, so dark body
  // removes the jarring light/dark handoff). Users can still toggle to light.
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bvt-dark-mode');
      if (saved === 'false') setDarkMode(false);
      else if (saved === 'true') setDarkMode(true);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('bvt-dark-mode', String(darkMode)); } catch {}
  }, [darkMode]);

  // --- FAVORITES STATES ---
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  const toggleFavorite = (villaId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(villaId)) next.delete(villaId);
      else next.add(villaId);
      // Persist to localStorage
      try { localStorage.setItem('bvt-favorites', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  };

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bvt-favorites');
      if (saved) {
        const ids: number[] = JSON.parse(saved);
        setFavorites(new Set(ids));
      }
      // If we have a stored email, load favorites from Supabase too
      const storedEmail = localStorage.getItem('bvt-email');
      if (storedEmail) {
        setEmail(storedEmail);
        (async () => {
          const { data } = await supabase.from('user_favorites').select('villa_id').eq('email', storedEmail);
          if (data && data.length > 0) {
            setFavorites(prev => {
              const merged = new Set(prev);
              data.forEach((row: any) => merged.add(row.villa_id));
              try { localStorage.setItem('bvt-favorites', JSON.stringify(Array.from(merged))); } catch {}
              return merged;
            });
          }
        })();
      }
    } catch {}
    setFavoritesLoaded(true);
  }, []);

  // --- COMPARE MODE STATES ---
  const [compareSet, setCompareSet] = useState<Set<number>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [sliderNightly, setSliderNightly] = useState(1.0);   // multiplier: 0.5x–2.0x
  const [sliderOccupancy, setSliderOccupancy] = useState(65); // percent: 20–95 — matches pipeline flat 65%
  const [sliderExpense, setSliderExpense] = useState(40);     // percent: 20–60

  const toggleCompare = (villaId: number) => {
    setCompareSet(prev => {
      const next = new Set(prev);
      if (next.has(villaId)) next.delete(villaId);
      else if (next.size < 5) next.add(villaId);
      return next;
    });
  };

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('listings_tracker')
        .select('*')
        .eq('status', 'audited')
        .gt('last_price', 0)
        .limit(5000); // Default is 1000, we need all listings
      
      if (error) console.error(error);
      else {
        const raw = data || [];
        const real = raw.filter((v: any) => (v.last_price || 0) > 0 && (v.villa_name || '').length > 2);
        setListings(real);
      }
      
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      setLeadCount(count || 0);
      
      // Fetch price history for listings with price changes
      const { data: historyData } = await supabase
        .from('price_history')
        .select('listing_url, price_usd, recorded_at')
        .order('recorded_at', { ascending: true });
      if (historyData && historyData.length > 0) {
        const grouped: Record<string, Array<{price_usd: number, recorded_at: string}>> = {};
        for (const row of historyData) {
          if (!grouped[row.listing_url]) grouped[row.listing_url] = [];
          grouped[row.listing_url].push({ price_usd: row.price_usd, recorded_at: row.recorded_at });
        }
        setPriceHistory(grouped);
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const json = await res.json();
        if (json.rates) {
          setRates({ USD: 1, ...json.rates });
        }
      } catch {
        // Keep FALLBACK_RATES
      }
    }
    fetchRates();
  }, []);

  // --- HELPER: Parse Bathrooms from "X Bed / Y Bath" string ---
  const getBathCount = (villa: any) => {
    if (!villa.beds_baths) return 0;
    const parts = villa.beds_baths.split('/');
    if (parts.length < 2) return 0;
    return parseInt(parts[1]) || 0;
  };

  // --- Parse listing price: amount and currency from price_description or last_price ---
  const parseListingPrice = (villa: any): { amount: number; currency: string } => {
    const desc = (villa.price_description || '').trim();
    const match = desc.match(/^(IDR|USD|AUD|EUR|SGD)\s*([\d,.\s]+)/i);
    if (match) {
      const amount = parseFloat(match[2].replace(/\s|,/g, '')) || 0;
      return { amount, currency: match[1].toUpperCase() };
    }
    const p = Number(villa.last_price) || 0;
    return { amount: p, currency: p >= 1e6 ? 'IDR' : 'USD' };
  };

  // --- Convert listing price to USD for filtering/sorting ---
  const getPriceUSD = (villa: any): number => {
    const { amount, currency } = parseListingPrice(villa);
    const r = rates[currency];
    if (!r || r <= 0) return amount;
    return currency === 'USD' ? amount : amount / r;
  };

  // --- Convert and format price in display currency (for table) ---
  const formatPriceInCurrency = (villa: any): string => {
    const priceUSD = getPriceUSD(villa);
    const r = rates[displayCurrency];
    if (!r) return `${displayCurrency} ${priceUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    const value = displayCurrency === 'USD' ? priceUSD : priceUSD * r;
    if (displayCurrency === 'IDR') return `IDR ${Math.round(value).toLocaleString()}`;
    return `${displayCurrency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
  };

  // --- Price per sqm in display currency ---
  const getPricePerSqm = (villa: any): string => {
    const priceUSD = getPriceUSD(villa);
    const landSize = parseInt(villa.land_size) || 0;
    if (!priceUSD || !landSize) return '—';
    const perSqmUSD = priceUSD / landSize;
    const r = rates[displayCurrency];
    if (!r) return `${displayCurrency} ${Math.round(perSqmUSD).toLocaleString()}`;
    const value = displayCurrency === 'USD' ? perSqmUSD : perSqmUSD * r;
    if (displayCurrency === 'IDR') return `IDR ${Math.round(value).toLocaleString()}`;
    return `${displayCurrency} ${Math.round(value).toLocaleString()}`;
  };

  // --- Price change badge: show ↓12% or ↑5% when previous_price exists ---
  const getPriceChangeBadge = (villa: any): { text: string; direction: 'down' | 'up' | null } => {
    const prev = Number(villa.previous_price) || 0;
    const curr = Number(villa.last_price) || 0;
    if (!prev || !curr || prev === curr) return { text: '', direction: null };
    const pctChange = ((curr - prev) / prev) * 100;
    if (Math.abs(pctChange) < 1) return { text: '', direction: null }; // Ignore tiny changes
    const direction = pctChange < 0 ? 'down' : 'up';
    const symbol = direction === 'down' ? '↓' : '↑';
    return { text: `${symbol} ${Math.abs(pctChange).toFixed(0)}%`, direction };
  };

  // --- Mini sparkline SVG for price history ---
  const PriceSparkline = ({ url, currentPriceUsd }: { url: string; currentPriceUsd: number }) => {
    const history = priceHistory[url];
    if (!history || history.length < 1) return null;

    // Build data points: history entries + current price
    const points = [...history.map(h => ({ price: h.price_usd, date: h.recorded_at.slice(0, 10) }))];
    // Add current price as latest point if different from last history entry
    const lastHistoryPrice = points[points.length - 1]?.price || 0;
    if (currentPriceUsd > 0 && Math.abs(currentPriceUsd - lastHistoryPrice) > 100) {
      points.push({ price: currentPriceUsd, date: new Date().toISOString().slice(0, 10) });
    }

    if (points.length < 2) return null;

    const prices = points.map(p => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const w = 160, h = 50, pad = 4;
    const stepX = (w - pad * 2) / (points.length - 1);

    const pathPoints = points.map((p, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (p.price - minP) / range) * (h - pad * 2);
      return `${x},${y}`;
    });
    const linePath = `M ${pathPoints.join(' L ')}`;

    const isDown = prices[prices.length - 1] < prices[0];
    const color = isDown ? '#16a34a' : '#dc2626';

    return (
      <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900 rounded-lg shadow-xl p-3 border border-slate-700" style={{ width: w + 24 }}>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-slate-900" />
        <p className="text-[9px] text-slate-400 mb-1 font-medium">Price History</p>
        <svg width={w} height={h} className="block">
          <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={i} cx={pad + i * stepX} cy={pad + (1 - (p.price - minP) / range) * (h - pad * 2)} r={i === points.length - 1 ? 3.5 : 2} fill={i === points.length - 1 ? color : '#94a3b8'} stroke={i === points.length - 1 ? 'white' : 'none'} strokeWidth={1} />
          ))}
        </svg>
        <div className="flex justify-between text-[8px] text-slate-500 mt-1">
          <span>{points[0].date}</span>
          <span>{points[points.length - 1].date}</span>
        </div>
        <div className="flex justify-between text-[9px] mt-0.5">
          <span className="text-slate-400">${Math.round(prices[0]).toLocaleString()}</span>
          <span style={{ color }}>${Math.round(prices[prices.length - 1]).toLocaleString()}</span>
        </div>
      </div>
    );
  };

  // --- Display nightly & occupancy for analysis (use DB value or conservative default so every property shows analysis) ---
  const getDisplayNightly = (villa: any): number =>
    villa.est_nightly_rate > 0 ? villa.est_nightly_rate : (100 + ((villa.bedrooms || 0) * 35));
  const getDisplayOccupancy = (villa: any): number =>
    (villa.est_occupancy ?? 0.65) * 100;

  // --- FILTER & SORT LOGIC (all listings shown; currency is display-only) ---
  const processedListings = useMemo(() => {
    const filtered = listings.filter(villa => {
      const priceUSD = getPriceUSD(villa);
      const matchLocation = filterLocation === 'All' || (villa.location && villa.location.includes(filterLocation));
      const matchPrice = priceUSD <= filterPrice;
      const matchRoi = (villa.projected_roi || 0) >= filterRoi;
      const matchLand = (villa.land_size || 0) >= filterLandSize;
      const matchBuild = (villa.building_size || 0) >= filterBuildSize;
      const matchBeds = (villa.bedrooms || 0) >= filterBeds;
      const matchBaths = getBathCount(villa) >= filterBaths;
      let matchLease = true;
      if (filterLeaseType !== 'All') {
        const features = (villa.features || '').toLowerCase();
        const years = villa.lease_years || 0;
        if (filterLeaseType === 'Freehold') matchLease = features.includes('freehold') || features.includes('hak milik') || years === 999;
        else if (filterLeaseType === 'Leasehold') matchLease = features.includes('leasehold') || features.includes('hak sewa') || (years > 0 && years < 999);
      }
      const matchSaved = !showFavoritesOnly || favorites.has(villa.id);
      return matchLocation && matchPrice && matchRoi && matchLand && matchBuild && matchBeds && matchBaths && matchLease && matchSaved;
    });

    return filtered.sort((a, b) => {
      const priceA = getPriceUSD(a);
      const priceB = getPriceUSD(b);
      const roiA = a.projected_roi || 0;
      const roiB = b.projected_roi || 0;
      const landA = parseInt(a.land_size) || 0;
      const landB = parseInt(b.land_size) || 0;
      const psmA = landA > 0 ? priceA / landA : 0;
      const psmB = landB > 0 ? priceB / landB : 0;
      switch (sortOption) {
        case 'price-asc': return priceA - priceB;
        case 'price-desc': return priceB - priceA;
        case 'roi-asc': return roiA - roiB;
        case 'roi-desc': return roiB - roiA;
        case 'psm-asc': return psmA - psmB;
        case 'psm-desc': return psmB - psmA;
        default: return 0;
      }
    });
  }, [listings, filterLocation, filterPrice, filterRoi, filterLandSize, filterBuildSize, filterBeds, filterBaths, filterLeaseType, sortOption, rates, showFavoritesOnly, favorites]);

  const handleLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('leads').insert([
      { email, villa_id: selectedVilla.id, villa_name: selectedVilla.villa_name, lead_type: 'Unlock Audit' }
    ]);
    if (!error) {
      window.open(selectedVilla.url, '_blank');
      setSelectedVilla(null);
      setLeadCount(prev => prev + 1);
      // Sync favorites to Supabase and persist email
      try {
        localStorage.setItem('bvt-email', email);
        if (favorites.size > 0) {
          const rows = Array.from(favorites).map(villa_id => ({ email, villa_id }));
          await supabase.from('user_favorites').upsert(rows, { onConflict: 'email,villa_id' });
        }
      } catch {}
      setEmail('');
    } else {
      alert("Error joining. Please try again.");
    }
    setIsSubmitting(false);
  };

  const parseRateFactors = (factorsStr: string | null): string[] => {
    if (!factorsStr) return [];
    return factorsStr.split(' | ').filter(f => f.trim());
  };

  // --- BVT NET ROI: Cost breakdown shown in tooltip (matches pipeline's 40% expense load) ---
  const COST_BREAKDOWN = {
    mgmt: { label: 'Property Management', rate: 0.15, note: 'On-ground manager, cleaning, laundry' },
    ota: { label: 'OTA / Booking Fees', rate: 0.15, note: 'Airbnb/Booking.com commissions' },
    maint: { label: 'Maintenance & Utilities', rate: 0.10, note: 'Pool, garden, AC, wifi, repairs' },
  };
  const TOTAL_COST_RATIO = Object.values(COST_BREAKDOWN).reduce((sum, c) => sum + c.rate, 0); // 0.40



  // --- DYNAMIC ROI: User-adjustable calculation for compare panel ---
  const calculateDynamicROI = (villa: any, nightlyMultiplier: number, occupancyPct: number, expensePct: number) => {
    const priceUSD = getPriceUSD(villa);
    if (priceUSD <= 0) return { grossYield: 0, netYield: 0, annualRevenue: 0, annualExpenses: 0, netRevenue: 0, leaseDepreciation: 0, depreciationYield: 0, isFreehold: true, leaseYears: 0 };

    const baseNightly = villa.est_nightly_rate || getDisplayNightly(villa);
    const adjustedNightly = baseNightly * nightlyMultiplier;
    const occupancy = occupancyPct / 100;
    const annualRevenue = adjustedNightly * 365 * occupancy;
    const annualExpenses = annualRevenue * (expensePct / 100);
    const netRevenue = annualRevenue - annualExpenses;
    const grossYield = (annualRevenue / priceUSD) * 100;

    // Lease depreciation for ALL leasehold villas
    const features = (villa.features || '').toLowerCase();
    const years = Number(villa.lease_years) || 0;
    const isFreehold = features.includes('freehold') || features.includes('hak milik') || years === 999;
    const leaseDepreciation = (!isFreehold && years > 0) ? Math.round(priceUSD / years) : 0;
    const depreciationYield = (!isFreehold && years > 0) ? (1 / years) * 100 : 0;
    const netAfterDepreciation = netRevenue - leaseDepreciation;
    let netYield = (netAfterDepreciation / priceUSD) * 100;

    return {
      grossYield: Math.min(grossYield, 80),
      netYield: Math.max(netYield, -20),
      annualRevenue: Math.round(annualRevenue),
      annualExpenses: Math.round(annualExpenses),
      netRevenue: Math.round(netRevenue),
      leaseDepreciation,
      depreciationYield: Math.round(depreciationYield * 10) / 10,
      isFreehold,
      leaseYears: years,
    };
  };

  // --- RED FLAGS: Read pre-computed flags from pipeline + add client-side checks ---
  // Three levels: 'danger' (red) = deal-breaker risk, 'warning' (amber) = caution,
  // 'assumed' (blue) = BVT filled in missing data with conservative defaults
  type RedFlag = { level: 'warning' | 'danger' | 'assumed'; label: string; detail: string };

  const getRedFlags = (villa: any): RedFlag[] => {
    const flags: RedFlag[] = [];
    const years = Number(villa.lease_years) || 0;
    const priceUSD = getPriceUSD(villa);
    const nightly = getDisplayNightly(villa);
    // Use pipeline values for flag text — consistent with badge and sort order
    const netRoiPipeline = Number(villa.projected_roi) || 0;
    const occupancy = villa.est_occupancy || 0.65;
    const grossRoi = priceUSD > 0 ? ((nightly * 365 * occupancy) / priceUSD) * 100 : 0;
    const grossRevenue = nightly * 365 * occupancy;
    const netRevenue = grossRevenue * 0.60;
    const cashFlowYield = priceUSD > 0 ? (netRevenue / priceUSD) * 100 : 0;

    // --- ALL flags read from pipeline (auditor_remote.py --enrich) ---
    // No client-side flag computation — everything is pre-computed server-side.
    const pipelineFlags = (villa.flags || '').split(',').map((f: string) => f.trim()).filter(Boolean);

    // --- MISSING_DATA: Agent omitted critical listing data, BVT assumed conservative defaults ---
    if (pipelineFlags.includes('MISSING_DATA')) {
      const features = (villa.features || '').toLowerCase();
      const isLeasehold = features.includes('leasehold') || features.includes('hak sewa');
      const missingLease = isLeasehold && (years === 15 || years === 0);
      const missingBeds = Number(villa.bedrooms) === 1 && pipelineFlags.filter((f: string) => f === 'MISSING_DATA').length > 1;

      if (missingLease) {
        const annualDep = priceUSD > 0 && years > 0 ? Math.round(priceUSD / years) : 0;
        flags.push({ level: 'assumed', label: 'Lease Assumed', detail: `Agent omitted lease duration. BVT conservatively assumed a 15-year lease with $${annualDep.toLocaleString()}/yr depreciation to protect your ROI projection. Verify the actual lease term before investing.` });
      }
      if (missingBeds) {
        flags.push({ level: 'assumed', label: 'Beds Assumed', detail: `Agent omitted bedroom count. BVT defaulted to 1 bedroom for rate estimation. The actual nightly rate may differ — verify the floor plan.` });
      }
      // Generic fallback if we can't determine which assumption
      if (!missingLease && !missingBeds) {
        flags.push({ level: 'assumed', label: 'BVT Assumed', detail: `Some listing data was missing. BVT applied conservative defaults to protect the ROI projection. Verify key details before investing.` });
      }
    }

    if (pipelineFlags.includes('BUDGET_VILLA')) {
      const beds = Number(villa.bedrooms) || 1;
      const ppr = Math.round(priceUSD / beds);
      flags.push({ level: 'warning', label: 'Budget Villa', detail: `$${ppr.toLocaleString()}/room is below the $50k threshold. Expect lower build quality, higher maintenance costs, and a less affluent renter demographic.` });
    }

    if (pipelineFlags.includes('SHORT_LEASE')) {
      const annualDepreciation = years > 0 ? Math.round(priceUSD / years) : 0;
      const netRevenueAnnual = Math.round(netRevenue);
      const depreciationExceedsRent = annualDepreciation > netRevenueAnnual;
      const depreciationDetail = annualDepreciation > 0
        ? depreciationExceedsRent
          ? ` Rental income (~$${netRevenueAnnual.toLocaleString()}/yr) cannot cover lease depreciation ($${annualDepreciation.toLocaleString()}/yr).`
          : ` Lease depreciation costs $${annualDepreciation.toLocaleString()}/yr against ~$${netRevenueAnnual.toLocaleString()}/yr net rent.`
        : '';
      flags.push({ level: 'danger', label: 'Short Lease', detail: `Only ${years} years remaining. Your asset depreciates ${years > 0 ? (100/years).toFixed(1) : '∞'}% per year toward $0.${depreciationDetail}` });
    }

    if (pipelineFlags.includes('INFLATED_ROI')) {
      const preCapRate = Number(villa.agent_claimed_rate) || 0;
      const cappedRate = nightly;
      const rateContext = preCapRate > 0 && preCapRate > cappedRate
        ? ` BVT's initial model estimated $${preCapRate}/nt, but this was capped to $${cappedRate}/nt to stay within market limits.`
        : '';
      flags.push({ level: 'warning', label: 'Inflated Claim', detail: `This property's gross yield (${grossRoi.toFixed(0)}%) is unrealistically high — a number like this typically ignores operating costs and lease depreciation. BVT capped the nightly rate to reflect market reality. After 40% expenses, the cash flow yield is ~${cashFlowYield.toFixed(1)}%.${rateContext}` });
    }

    if (pipelineFlags.includes('OPTIMISTIC_ROI')) {
      flags.push({ level: 'warning', label: 'Optimistic Claim', detail: `This property's gross yield is ${grossRoi.toFixed(0)}% — but gross yield ignores operating expenses (${sliderExpense}%) and lease depreciation. After those costs, BVT estimates a net yield of ~${cashFlowYield.toFixed(1)}%. The gap between gross and net is where investors lose money when they rely on headline numbers.` });
    }

    if (pipelineFlags.includes('RATE_PRICE_GAP')) {
      flags.push({ level: 'warning', label: 'Inflated Nightly Rate', detail: `This is a sub-$200k property showing a high nightly rate. Budget builds rarely command premium luxury rates — the demographic paying $200+/nt expects finishes that typically can't be built at this price point. BVT has modeled a rate of $${nightly}/nt that reflects the actual asset class.` });
    }

    // --- RATE_ADJUSTED: Pipeline significantly adjusted the nightly rate (>25% deviation from base model) ---
    // Informational — not a red flag. Tells user the rate was modeled, not just pulled from area averages.
    if (pipelineFlags.includes('RATE_ADJUSTED')) {
      const preCapRate = Number(villa.agent_claimed_rate) || 0;
      const modelRate = nightly;
      const rateSource = villa.rate_source || 'model';
      const wasAuditorCapped = rateSource === 'auditor' && preCapRate > 0 && modelRate < preCapRate;
      const detailText = wasAuditorCapped
        ? `BVT's rate model initially estimated $${preCapRate}/nt, but this implied a gross yield above safe market limits. The rate was capped to $${modelRate}/nt to keep the ROI projection realistic.`
        : `BVT modeled this rate at $${modelRate}/nt — a >25% adjustment from the area baseline. This typically reflects a luxury build premium or a price-tier correction. The math is sound, but verify comparables.`;
      flags.push({ level: 'assumed', label: 'Adjusted Rate', detail: detailText });
    }

    return flags;
  };

  // Badge styling helper for the three flag levels
  const flagBadgeClass = (level: RedFlag['level'], variant: 'compact' | 'bordered' = 'compact') => {
    const base = variant === 'bordered' ? 'border ' : '';
    if (level === 'danger') return base + 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400' + (variant === 'bordered' ? ' border-red-200 dark:border-red-900' : '');
    if (level === 'assumed') return base + 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' + (variant === 'bordered' ? ' border-blue-200 dark:border-blue-900' : '');
    return base + 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400' + (variant === 'bordered' ? ' border-amber-200 dark:border-amber-900' : '');
  };

  const flagTextClass = (level: RedFlag['level']) => {
    if (level === 'danger') return 'text-red-400';
    if (level === 'assumed') return 'text-blue-400';
    return 'text-amber-400';
  };

  const flaggedCount = listings.filter(v => getRedFlags(v).length > 0).length;

  return (
    <div className={`min-h-screen bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)] font-sans ${darkMode ? 'dark' : ''}`}>

      {/* HERO — editorial, The Modern House + FT feature style.
          Large serif display, calm supporting deck, factoids as prose not tiles. */}
      <section className="relative overflow-hidden bg-[color:var(--bvt-bg)]">
        {/* Layered ambient background: mesh-halo + ultra-fine noise for luxury "grain" */}
        <div className="mesh-halo" aria-hidden />
        <div className="noise" aria-hidden />
        {/* Bottom fade into page body — FT-style visual break */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[color:var(--bvt-bg)] to-transparent pointer-events-none" aria-hidden />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 pt-16 md:pt-28 pb-16 md:pb-24">
          {/* Masthead label */}
          <div className="flex items-center gap-3 mb-8 md:mb-10">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Independent audits · Est. 2026</span>
          </div>

          {/* Headline + deck — two-column on desktop for FT-style composition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-8">
              <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[56px] md:text-[72px] lg:text-[88px]">
                We don&apos;t sell villas.
                <br />
                <span className="text-[color:var(--bvt-accent)]">We check the math.</span>
              </h1>
              <p className="mt-8 md:mt-10 max-w-[52ch] text-[17px] md:text-[19px] leading-[1.55] text-[color:var(--bvt-ink-body)]">
                Bali Villa Truth is the independent audit bureau for villa investors.
                We stress-test every asking price against real operating costs,
                market-rate occupancy, and lease decay — then publish the net yield
                that actually lands in your pocket.
              </p>
            </div>

            {/* Right column — factoid "ticker", Bloomberg dashboard feel */}
            <aside className="lg:col-span-4 lg:pt-6">
              <div className="border-t border-[color:var(--bvt-hairline)] pt-6 space-y-5">
                <div>
                  <div className="font-mono tabular-nums text-[28px] md:text-[32px] text-[color:var(--bvt-ink)] leading-none">
                    {listings.length > 0 ? listings.length.toLocaleString() : '2,000'}
                    <span className="text-[color:var(--bvt-accent)]">+</span>
                  </div>
                  <div className="label-micro mt-2">Villas audited</div>
                </div>
                <div className="h-px bg-[color:var(--bvt-hairline)]" />
                <div>
                  <div className="font-mono tabular-nums text-[28px] md:text-[32px] text-[color:var(--bvt-ink)] leading-none">
                    {flaggedCount > 0 ? flaggedCount.toLocaleString() : '400'}
                    <span className="text-[color:var(--bvt-accent)]">+</span>
                  </div>
                  <div className="label-micro mt-2">Red flags surfaced</div>
                </div>
                <div className="h-px bg-[color:var(--bvt-hairline)]" />
                <div>
                  <div className="font-mono tabular-nums text-[28px] md:text-[32px] text-[color:var(--bvt-ink)] leading-none">
                    Weekly
                  </div>
                  <div className="label-micro mt-2">Re-audit cadence</div>
                </div>
              </div>
            </aside>
          </div>

          {/* CTA row — primary gold + editorial text link */}
          <div className="mt-12 md:mt-16 flex flex-col sm:flex-row gap-5 sm:items-center">
            <button
              onClick={() => document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-[color:var(--bvt-bg)] bg-[color:var(--bvt-accent)] hover:bg-[color:var(--bvt-accent-warm)] px-5 py-3 rounded-md transition-colors"
            >
              Browse the audit ledger
              <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <Link href="/methodology" className="link-editorial text-[14px]">
              How we audit →
            </Link>
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className="hidden md:inline-flex ml-auto items-center gap-2 text-[12px] text-[color:var(--bvt-ink-dim)] hover:text-[color:var(--bvt-ink)] transition-colors"
            >
              {darkMode ? <Sun size={13} /> : <Moon size={13} />}
              <span className="label-micro">{darkMode ? 'Dark' : 'Light'}</span>
            </button>
          </div>

          {/* Paste-URL affordance — editorial framed, not a tile */}
          <div className="mt-14 md:mt-20 pt-10 border-t border-[color:var(--bvt-hairline)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4">
                <div className="label-micro">For buyers already shortlisting</div>
                <h3 className="font-display text-[color:var(--bvt-ink)] text-[22px] md:text-[26px] leading-tight tracking-[-0.01em] mt-2">
                  Paste any BHI URL.
                  <br />We&apos;ll pull the audit.
                </h3>
              </div>
              <div className="lg:col-span-8" id="paste-url">
                <PasteListingUrlBox listings={listings} />
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip — FT-style tiny-print positioning below the fold */}
        <div className="relative z-10 border-t border-[color:var(--bvt-hairline)] bg-[color:var(--bvt-bg-elev)]/40">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex flex-wrap justify-between gap-x-8 gap-y-2">
            <div className="flex items-center gap-2 text-[12px] text-[color:var(--bvt-ink-muted)]">
              <Shield size={13} className="text-[color:var(--bvt-accent)]" />
              <span className="text-[color:var(--bvt-ink-body)]">Not a broker</span>
              <span className="text-[color:var(--bvt-ink-dim)]">— we don&apos;t sell villas</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[color:var(--bvt-ink-muted)]">
              <Clock size={13} className="text-[color:var(--bvt-accent)]" />
              <span className="text-[color:var(--bvt-ink-body)]">Re-audited weekly</span>
              <span className="text-[color:var(--bvt-ink-dim)]">with fresh scrapes</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[color:var(--bvt-ink-muted)]">
              <Globe size={13} className="text-[color:var(--bvt-accent)]" />
              <span className="text-[color:var(--bvt-ink-body)]">Booking.com + Airbnb</span>
              <span className="text-[color:var(--bvt-ink-dim)]">blended rate model</span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER + LISTINGS SECTION */}
      <div id="listings-section" className="px-4 md:px-8 pt-16 md:pt-24 pb-8 bg-[color:var(--bvt-bg)]">

      {/* EDITORIAL SECTION INTRO */}
      <div className="max-w-[1400px] mx-auto mb-10 md:mb-14">
        <div className="flex items-center gap-3 mb-6">
          <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
          <span className="label-micro">The ledger · {loading ? '…' : processedListings.length.toLocaleString()} audited dossiers</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-end">
          <h2 className="md:col-span-8 font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[36px] sm:text-[48px] md:text-[64px]">
            Every villa,{" "}
            <span className="text-[color:var(--bvt-accent)]">audited.</span>
          </h2>
          <p className="md:col-span-4 text-[15px] leading-[1.7] text-[color:var(--bvt-ink-muted)]">
            Filter by location, yield band, or lease structure. Every dossier is re-audited weekly against live Bali Home Immo data — prices, red flags, and ROI recomputed from scratch.
          </p>
        </div>
      </div>

      <header className="relative max-w-[1400px] mx-auto mb-6">

        {/* FILTER DASHBOARD — editorial hairline */}
        <div className="border-t border-b border-[color:var(--bvt-hairline)] py-4 md:py-5 mb-8">

            {/* Mobile filter toggle */}
            <div className="flex md:hidden items-center justify-between mb-3">
              <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="flex items-center gap-2 text-[color:var(--bvt-ink)]">
                <Filter size={13} className="text-[color:var(--bvt-accent)]" />
                <span className="label-micro !text-[color:var(--bvt-ink)]">Filter & sort</span>
                <span className="font-mono text-[11px] tabular-nums text-[color:var(--bvt-ink-muted)]">· {processedListings.length}</span>
              </button>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="text-[12px] bg-transparent border border-[color:var(--bvt-hairline)] text-[color:var(--bvt-ink)] px-3 py-1.5 outline-none font-mono tabular-nums">
                <option value="roi-desc" className="bg-[color:var(--bvt-bg)]">ROI: High → Low</option>
                <option value="roi-asc" className="bg-[color:var(--bvt-bg)]">ROI: Low → High</option>
                <option value="price-asc" className="bg-[color:var(--bvt-bg)]">Price: Low → High</option>
                <option value="price-desc" className="bg-[color:var(--bvt-bg)]">Price: High → Low</option>
              </select>
            </div>

            {/* ROW 1: Core Filters (hidden on mobile unless toggled) */}
            <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4 md:gap-y-3">
                <div className="group">
                    <label className="label-micro block mb-1.5">Location</label>
                    <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="w-full bg-transparent border-b border-[color:var(--bvt-hairline)] focus:border-[color:var(--bvt-accent)] hover:border-[color:var(--bvt-ink-muted)] text-[color:var(--bvt-ink)] text-[14px] py-2 outline-none cursor-pointer transition-colors">
                        <option value="All" className="bg-[color:var(--bvt-bg)]">All Bali</option>
                        <option value="Canggu" className="bg-[color:var(--bvt-bg)]">Canggu</option>
                        <option value="Pererenan" className="bg-[color:var(--bvt-bg)]">Pererenan</option>
                        <option value="Berawa" className="bg-[color:var(--bvt-bg)]">Berawa</option>
                        <option value="Uluwatu" className="bg-[color:var(--bvt-bg)]">Uluwatu</option>
                        <option value="Bingin" className="bg-[color:var(--bvt-bg)]">Bingin</option>
                        <option value="Sanur" className="bg-[color:var(--bvt-bg)]">Sanur</option>
                        <option value="Seseh" className="bg-[color:var(--bvt-bg)]">Seseh</option>
                    </select>
                </div>
                <div>
                    <label className="label-micro block mb-1.5">Max Price</label>
                    <select value={filterPrice} onChange={(e) => setFilterPrice(Number(e.target.value))} className="w-full bg-transparent border-b border-[color:var(--bvt-hairline)] focus:border-[color:var(--bvt-accent)] hover:border-[color:var(--bvt-ink-muted)] text-[color:var(--bvt-ink)] text-[14px] font-mono tabular-nums py-2 outline-none cursor-pointer transition-colors">
                        <option value={10000000} className="bg-[color:var(--bvt-bg)]">Any</option>
                        <option value={200000} className="bg-[color:var(--bvt-bg)]">&lt; $200k</option>
                        <option value={350000} className="bg-[color:var(--bvt-bg)]">&lt; $350k</option>
                        <option value={500000} className="bg-[color:var(--bvt-bg)]">&lt; $500k</option>
                        <option value={1000000} className="bg-[color:var(--bvt-bg)]">&lt; $1M</option>
                    </select>
                </div>
                <div>
                    <label className="label-micro block mb-1.5">Min Net Yield</label>
                    <select value={filterRoi} onChange={(e) => setFilterRoi(Number(e.target.value))} className="w-full bg-transparent border-b border-[color:var(--bvt-hairline)] focus:border-[color:var(--bvt-accent)] hover:border-[color:var(--bvt-ink-muted)] text-[color:var(--bvt-ink)] text-[14px] font-mono tabular-nums py-2 outline-none cursor-pointer transition-colors">
                        <option value={-99} className="bg-[color:var(--bvt-bg)]">Any</option>
                        <option value={0} className="bg-[color:var(--bvt-bg)]">0%+</option>
                        <option value={5} className="bg-[color:var(--bvt-bg)]">5%+</option>
                        <option value={10} className="bg-[color:var(--bvt-bg)]">10%+</option>
                        <option value={15} className="bg-[color:var(--bvt-bg)]">15%+</option>
                        <option value={20} className="bg-[color:var(--bvt-bg)]">20%+</option>
                    </select>
                </div>
                <div>
                    <label className="label-micro block mb-1.5">Tenure</label>
                    <select value={filterLeaseType} onChange={(e) => setFilterLeaseType(e.target.value)} className="w-full bg-transparent border-b border-[color:var(--bvt-hairline)] focus:border-[color:var(--bvt-accent)] hover:border-[color:var(--bvt-ink-muted)] text-[color:var(--bvt-ink)] text-[14px] py-2 outline-none cursor-pointer transition-colors">
                        <option value="All" className="bg-[color:var(--bvt-bg)]">All</option>
                        <option value="Freehold" className="bg-[color:var(--bvt-bg)]">Freehold</option>
                        <option value="Leasehold" className="bg-[color:var(--bvt-bg)]">Leasehold</option>
                    </select>
                </div>
                <div>
                    <label className="label-micro block mb-1.5">Currency</label>
                    <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)} className="w-full bg-transparent border-b border-[color:var(--bvt-hairline)] focus:border-[color:var(--bvt-accent)] hover:border-[color:var(--bvt-ink-muted)] text-[color:var(--bvt-ink)] text-[14px] font-mono tabular-nums py-2 outline-none cursor-pointer transition-colors" title="Show all prices in this currency">
                        <option value="IDR" className="bg-[color:var(--bvt-bg)]">IDR</option>
                        <option value="USD" className="bg-[color:var(--bvt-bg)]">USD</option>
                        <option value="AUD" className="bg-[color:var(--bvt-bg)]">AUD</option>
                        <option value="EUR" className="bg-[color:var(--bvt-bg)]">EUR</option>
                        <option value="SGD" className="bg-[color:var(--bvt-bg)]">SGD</option>
                    </select>
                </div>
                <div className="col-span-2 md:col-span-3 lg:col-span-1">
                    <label className="label-micro block mb-1.5 !text-[color:var(--bvt-accent)]">Sort by</label>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full bg-transparent border-b border-[color:var(--bvt-accent-dim)] focus:border-[color:var(--bvt-accent)] hover:border-[color:var(--bvt-accent)] text-[color:var(--bvt-ink)] text-[14px] py-2 outline-none cursor-pointer transition-colors">
                        <option value="roi-desc" className="bg-[color:var(--bvt-bg)]">ROI: High → Low</option>
                        <option value="roi-asc" className="bg-[color:var(--bvt-bg)]">ROI: Low → High</option>
                        <option value="price-asc" className="bg-[color:var(--bvt-bg)]">Price: Low → High</option>
                        <option value="price-desc" className="bg-[color:var(--bvt-bg)]">Price: High → Low</option>
                        <option value="psm-asc" className="bg-[color:var(--bvt-bg)]">Price/m²: Low → High</option>
                        <option value="psm-desc" className="bg-[color:var(--bvt-bg)]">Price/m²: High → Low</option>
                    </select>
                </div>
            </div>

            {/* ROW 2: Detail Filters */}
            <div className="flex flex-wrap items-end gap-x-8 gap-y-4 pt-5 mt-5 border-t border-[color:var(--bvt-hairline)]">
                <div>
                    <label className="label-micro block mb-1.5">Beds</label>
                    <select value={filterBeds} onChange={(e) => setFilterBeds(Number(e.target.value))} className="bg-transparent border-b border-[color:var(--bvt-hairline)] focus:border-[color:var(--bvt-accent)] text-[color:var(--bvt-ink)] text-[14px] font-mono tabular-nums py-1.5 pr-4 outline-none cursor-pointer">
                        <option value={0} className="bg-[color:var(--bvt-bg)]">Any</option>
                        <option value={1} className="bg-[color:var(--bvt-bg)]">1+</option>
                        <option value={2} className="bg-[color:var(--bvt-bg)]">2+</option>
                        <option value={3} className="bg-[color:var(--bvt-bg)]">3+</option>
                        <option value={4} className="bg-[color:var(--bvt-bg)]">4+</option>
                        <option value={5} className="bg-[color:var(--bvt-bg)]">5+</option>
                    </select>
                </div>

                <div>
                    <label className="label-micro block mb-1.5">Baths</label>
                    <select value={filterBaths} onChange={(e) => setFilterBaths(Number(e.target.value))} className="bg-transparent border-b border-[color:var(--bvt-hairline)] focus:border-[color:var(--bvt-accent)] text-[color:var(--bvt-ink)] text-[14px] font-mono tabular-nums py-1.5 pr-4 outline-none cursor-pointer">
                        <option value={0} className="bg-[color:var(--bvt-bg)]">Any</option>
                        <option value={1} className="bg-[color:var(--bvt-bg)]">1+</option>
                        <option value={2} className="bg-[color:var(--bvt-bg)]">2+</option>
                        <option value={3} className="bg-[color:var(--bvt-bg)]">3+</option>
                    </select>
                </div>

                <div>
                    <label className="label-micro block mb-1.5">Min Land m²</label>
                    <input type="number" placeholder="—" value={filterLandSize === 0 ? '' : filterLandSize} onChange={(e) => setFilterLandSize(Number(e.target.value))} className="bg-transparent border-b border-[color:var(--bvt-hairline)] focus:border-[color:var(--bvt-accent)] text-[color:var(--bvt-ink)] text-[14px] font-mono tabular-nums py-1.5 w-24 outline-none placeholder:text-[color:var(--bvt-ink-faint)]" />
                </div>

                <div>
                    <label className="label-micro block mb-1.5">Min Build m²</label>
                    <input type="number" placeholder="—" value={filterBuildSize === 0 ? '' : filterBuildSize} onChange={(e) => setFilterBuildSize(Number(e.target.value))} className="bg-transparent border-b border-[color:var(--bvt-hairline)] focus:border-[color:var(--bvt-accent)] text-[color:var(--bvt-ink)] text-[14px] font-mono tabular-nums py-1.5 w-24 outline-none placeholder:text-[color:var(--bvt-ink-faint)]" />
                </div>

                <button
                    onClick={() => {setFilterLocation('All'); setFilterPrice(10000000); setFilterRoi(-99); setFilterLandSize(0); setFilterBuildSize(0); setFilterBeds(0); setFilterBaths(0); setFilterLeaseType('All'); setSortOption('roi-desc'); setShowFavoritesOnly(false);}}
                    className="ml-auto label-micro !text-[color:var(--bvt-ink-muted)] hover:!text-[color:var(--bvt-accent)] transition-colors py-1.5"
                >
                    Reset all ↻
                </button>
            </div>
            </div>{/* end mobile collapsible wrapper */}
        </div>
      </header>

      {/* RESULTS BAR — editorial masthead strip */}
      <div className={`${showMap ? 'max-w-[100rem]' : 'max-w-[1400px]'} mx-auto mb-6 md:mb-8 flex flex-wrap justify-between items-center gap-3 transition-all`}>
         <div className="flex items-center gap-5">
           <p className="hidden md:flex items-center gap-2">
             <span className="label-micro">
               {loading ? 'Loading dossiers' : `Showing ${processedListings.length.toLocaleString()} of ${listings.length.toLocaleString()}`}
             </span>
           </p>
           <button
             onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
             className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
               showFavoritesOnly
                 ? 'text-[color:var(--bvt-accent)]'
                 : 'text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)]'
             }`}
           >
             <Heart size={11} className={showFavoritesOnly ? 'fill-[color:var(--bvt-accent)] text-[color:var(--bvt-accent)]' : ''} strokeWidth={1.5} />
             <span className="font-mono tabular-nums">Saved · {favorites.size}</span>
           </button>
           {showFavoritesOnly && favorites.size > 0 && compareSet.size === 0 && !showCompare && (
             <button
               onClick={() => {
                 const batch = Array.from(favorites).slice(0, 5);
                 setCompareSet(new Set(batch));
                 setShowCompare(true);
                 setSliderNightly(1.0); setSliderOccupancy(65); setSliderExpense(40);
               }}
               className="flex items-center gap-1.5 text-[11px] font-medium text-[color:var(--bvt-accent)] hover:text-[color:var(--bvt-accent-warm)] transition-colors"
             >
               <SlidersHorizontal size={11} strokeWidth={1.5} /> Compare saved →
             </button>
           )}
         </div>
         <div className="flex gap-5 md:gap-6 items-center">
            <div className="flex items-center gap-1.5">
                <ShieldAlert size={11} className="text-[color:var(--bvt-warn)]" strokeWidth={1.5}/>
                <span className="label-micro !text-[color:var(--bvt-warn)]">
                  <span className="font-mono tabular-nums">{flaggedCount}</span> flagged
                </span>
            </div>
            <button onClick={() => setShowMap(!showMap)} className={`hidden md:flex items-center gap-1.5 text-[11px] font-medium transition-colors ${showMap ? 'text-[color:var(--bvt-accent)]' : 'text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)]'}`}>
              <Map size={12} strokeWidth={1.5} /> {showMap ? 'Hide map' : 'Show map'}
            </button>
         </div>
      </div>

      {/* MOBILE VIEW TOGGLE: List / Map */}
      <div className="md:hidden max-w-[1400px] mx-auto mb-5">
        <div className="flex border border-[color:var(--bvt-hairline)]">
          <button onClick={() => setMobileView('list')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-medium tracking-wide uppercase transition-colors ${mobileView === 'list' ? 'bg-[color:var(--bvt-bg-soft)] text-[color:var(--bvt-ink)]' : 'text-[color:var(--bvt-ink-muted)]'}`}>
            <LayoutList size={12} strokeWidth={1.5} /> Ledger
          </button>
          <button onClick={() => setMobileView('map')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-medium tracking-wide uppercase border-l border-[color:var(--bvt-hairline)] transition-colors ${mobileView === 'map' ? 'bg-[color:var(--bvt-bg-soft)] text-[color:var(--bvt-ink)]' : 'text-[color:var(--bvt-ink-muted)]'}`}>
            <Map size={12} strokeWidth={1.5} /> Map
          </button>
        </div>
      </div>

      {/* MOBILE MAP VIEW */}
      {mobileView === 'map' && (
        <div className="md:hidden max-w-[1400px] mx-auto mb-4" style={{ height: 'calc(100vh - 12rem)' }}>
          <BaliMapView listings={processedListings} displayCurrency={displayCurrency} rates={rates} hoveredListingUrl={hoveredListingUrl} favorites={favorites} compareSet={compareSet} onToggleFavorite={toggleFavorite} onToggleCompare={toggleCompare} onUnlockVilla={setSelectedVilla} darkMode={darkMode} />
        </div>
      )}

      {/* SPLIT LAYOUT: TABLE + MAP */}
      <div className={`${showMap ? 'max-w-[100rem]' : 'max-w-[1400px]'} mx-auto flex gap-6 transition-all`}>
      {/* MOBILE CARD VIEW */}
      <main className={`${mobileView === 'list' ? 'block' : 'hidden'} md:hidden transition-all w-full`}>
        <div className="divide-y divide-[color:var(--bvt-hairline)] border-t border-b border-[color:var(--bvt-hairline)]">
          {processedListings.length === 0 ? (
            loading ? (
              // Loading skeleton
              <div>
                {[0,1,2,3].map(i => (
                  <div key={i} className="py-4 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-[color:var(--bvt-bg-soft)]" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-[color:var(--bvt-bg-soft)] w-3/4" />
                        <div className="h-3 bg-[color:var(--bvt-bg-soft)] w-1/2" />
                        <div className="h-2 bg-[color:var(--bvt-bg-soft)] w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                {showFavoritesOnly ? <Heart size={28} strokeWidth={1} className="mx-auto mb-4 text-[color:var(--bvt-ink-faint)]" /> : <Filter size={28} strokeWidth={1} className="mx-auto mb-4 text-[color:var(--bvt-ink-faint)]" />}
                <p className="text-[13px] text-[color:var(--bvt-ink-muted)]">{showFavoritesOnly ? 'No saved dossiers yet.' : 'No properties match your filters.'}</p>
              </div>
            )
          ) : (
            processedListings.map((villa, idx) => {
              const netRoi = Number(villa.projected_roi) || 0;
              const occupancy = villa.est_occupancy || 0.65;
              const nightly = getDisplayNightly(villa);
              const priceUSD = getPriceUSD(villa);
              const grossRoi = priceUSD > 0 ? ((nightly * 365 * occupancy) / priceUSD) * 100 : 0;
              const isFreehold = (() => { const f = (villa.features || '').toLowerCase(); const ly = Number(villa.lease_years); return f.includes('freehold') || f.includes('hak milik') || ly === 999; })();
              const leaseYears = Number(villa.lease_years) || 0;
              const redFlags = getRedFlags(villa);
              const hasDanger = redFlags.some(f => f.level === 'danger');
              const hasWarning = redFlags.length > 0;

              return (
                <div key={villa.id} className="py-5 group">
                  {/* Top: index, image, name */}
                  <div className="flex items-start gap-4 mb-4">
                    <span className="font-mono text-[10px] tabular-nums text-[color:var(--bvt-accent)] mt-1 w-6">{String(idx + 1).padStart(2, '0')}</span>
                    <div className="relative w-20 h-20 flex-shrink-0">
                      {villa.thumbnail_url ? (
                        <img src={villa.thumbnail_url} alt="" className="w-20 h-20 object-cover bg-[color:var(--bvt-bg-soft)] border border-[color:var(--bvt-hairline)]" loading="lazy" />
                      ) : (
                        <div className="w-20 h-20 bg-[color:var(--bvt-bg-soft)] border border-[color:var(--bvt-hairline)] flex items-center justify-center">
                          <Home size={18} strokeWidth={1.5} className="text-[color:var(--bvt-ink-faint)]" />
                        </div>
                      )}
                      {/* Heart overlay — top right */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(villa.id); }}
                        title={favorites.has(villa.id) ? 'Remove from saved' : 'Save listing'}
                        className="absolute top-1.5 right-1.5 w-[22px] h-[22px] flex items-center justify-center rounded-full bg-[color:var(--bvt-bg)]/75 backdrop-blur-sm"
                      >
                        <Heart size={12} strokeWidth={1.5} className={favorites.has(villa.id) ? 'text-[color:var(--bvt-accent)] fill-[color:var(--bvt-accent)]' : 'text-[color:var(--bvt-ink)]'} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[17px] leading-[1.15] text-[color:var(--bvt-ink)] tracking-[-0.005em] mb-1">
                        {villa.villa_name || 'Luxury Villa'}
                      </div>
                      <div className="label-micro">{villa.location || "Bali"}</div>
                      {(hasDanger || hasWarning) && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {hasDanger && <span className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wide uppercase text-[color:var(--bvt-bad)]"><ShieldAlert size={9} strokeWidth={1.5}/> Verify</span>}
                          {!hasDanger && hasWarning && <span className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wide uppercase text-[color:var(--bvt-warn)]"><AlertTriangle size={9} strokeWidth={1.5}/> Caution</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metrics row — hairline columns */}
                  <div className="grid grid-cols-3 border-t border-[color:var(--bvt-hairline)] ml-10">
                    <div className="py-3 pr-3">
                      <div className="label-micro mb-1">Price</div>
                      <div className="font-mono text-[13px] tabular-nums text-[color:var(--bvt-ink)]">{formatPriceInCurrency(villa)}</div>
                    </div>
                    <div className="py-3 px-3 border-l border-[color:var(--bvt-hairline)]">
                      <div className="label-micro mb-1">Net Yield</div>
                      <div className={`font-mono text-[15px] tabular-nums ${
                        netRoi >= 12 ? 'text-[color:var(--bvt-good)]' :
                        netRoi >= 7 ? 'text-[color:var(--bvt-ink)]' :
                        netRoi >= 0 ? 'text-[color:var(--bvt-ink-muted)]' :
                        'text-[color:var(--bvt-bad)]'
                      }`}>{netRoi.toFixed(1)}<span className="text-[color:var(--bvt-ink-dim)] ml-0.5">%</span></div>
                    </div>
                    <div className="py-3 pl-3 border-l border-[color:var(--bvt-hairline)]">
                      <div className="label-micro mb-1">Tenure</div>
                      <div className="text-[12px] text-[color:var(--bvt-ink)] leading-tight">{villa.bedrooms || '?'}-bed · {isFreehold ? 'Freehold' : leaseYears > 0 ? `${leaseYears}yr` : 'Leasehold'}</div>
                    </div>
                  </div>

                  {/* Footer — compare / unlock */}
                  <div className="flex items-center justify-between gap-3 ml-10 mt-3 pt-3 border-t border-[color:var(--bvt-hairline)]">
                    <button
                      onClick={() => toggleCompare(villa.id)}
                      disabled={!compareSet.has(villa.id) && compareSet.size >= 5}
                      className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                        compareSet.has(villa.id)
                          ? 'text-[color:var(--bvt-accent)]'
                          : compareSet.size >= 5
                            ? 'text-[color:var(--bvt-ink-faint)] cursor-not-allowed'
                            : 'text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)]'
                      }`}
                    >
                      <BarChart3 size={11} strokeWidth={1.5} /> {compareSet.has(villa.id) ? 'Selected' : 'Compare'}
                    </button>
                    <span className="font-mono text-[10px] tabular-nums text-[color:var(--bvt-ink-dim)] flex-1 text-center">
                      ${getDisplayNightly(villa)}/nt · {Math.round(getDisplayOccupancy(villa))}% occ
                    </span>
                    <button onClick={() => setSelectedVilla(villa)} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[color:var(--bvt-ink)] hover:text-[color:var(--bvt-accent)] transition-colors">
                      <Lock size={10} strokeWidth={1.5}/> Unlock →
                    </button>
                  </div>
                  {redFlags.length > 0 && (
                    <div className="ml-10 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      {redFlags.map((flag, idx) => (
                        <span key={idx} className={`text-[10px] font-medium tracking-wide uppercase ${
                          flag.level === 'danger' ? 'text-[color:var(--bvt-bad)]' :
                          flag.level === 'assumed' ? 'text-[color:var(--bvt-ink-muted)]' :
                          'text-[color:var(--bvt-warn)]'
                        }`}>
                          · {flag.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* DESKTOP TABLE — editorial ledger */}
      <main className={`hidden md:block transition-all ${showMap ? 'w-[60%] flex-shrink-0' : 'w-full'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-t border-b border-[color:var(--bvt-hairline-2)] text-[10px] uppercase tracking-[0.18em] font-medium text-[color:var(--bvt-ink-dim)]">
                <th className="py-3 w-10 pr-2 text-left font-medium"><span className="sr-only">No.</span></th>
                <th className="py-3 pr-5 font-medium">Asset</th>
                <th className="py-3 px-5 font-medium">Price · {displayCurrency}</th>
                <th className="py-3 px-5 font-medium">Price/m²</th>
                <th className="py-3 px-5 text-center font-medium">Net Yield</th>
                <th className="py-3 px-5 font-medium">Tenure · Specs</th>
                <th className="py-3 pl-5 text-right font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--bvt-hairline)]">
              {processedListings.length === 0 ? (
                  loading ? (
                    [0,1,2,3,4,5].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-6 pr-2"><div className="h-3 bg-[color:var(--bvt-bg-soft)] w-6" /></td>
                        <td className="py-6 pr-5"><div className="h-3 bg-[color:var(--bvt-bg-soft)] w-48" /></td>
                        <td className="py-6 px-5"><div className="h-3 bg-[color:var(--bvt-bg-soft)] w-24" /></td>
                        <td className="py-6 px-5"><div className="h-3 bg-[color:var(--bvt-bg-soft)] w-16" /></td>
                        <td className="py-6 px-5"><div className="h-4 bg-[color:var(--bvt-bg-soft)] w-14 mx-auto" /></td>
                        <td className="py-6 px-5"><div className="h-3 bg-[color:var(--bvt-bg-soft)] w-24" /></td>
                        <td className="py-6 pl-5"><div className="h-3 bg-[color:var(--bvt-bg-soft)] w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                        <td colSpan={7} className="py-20 text-center">
                            {showFavoritesOnly ? <Heart size={32} strokeWidth={1} className="mx-auto mb-4 text-[color:var(--bvt-ink-faint)]" /> : <Filter size={32} strokeWidth={1} className="mx-auto mb-4 text-[color:var(--bvt-ink-faint)]" />}
                            <p className="text-[14px] text-[color:var(--bvt-ink-muted)]">{showFavoritesOnly ? 'No saved dossiers yet. Click the heart to save one.' : 'No properties match your filters.'}</p>
                        </td>
                    </tr>
                  )
              ) : (
                processedListings.map((villa, idx) => {
                    const rateFactors = parseRateFactors(villa.rate_factors);
                    const redFlags = getRedFlags(villa);
                    const netRoi = Number(villa.projected_roi) || 0;
                    const occupancy = villa.est_occupancy || 0.65;
                    const nightly = getDisplayNightly(villa);
                    const priceUSD = getPriceUSD(villa);
                    const grossRoi = priceUSD > 0 ? ((nightly * 365 * occupancy) / priceUSD) * 100 : 0;
                    const isFreehold = (() => { const f = (villa.features || '').toLowerCase(); const ly = Number(villa.lease_years); return f.includes('freehold') || f.includes('hak milik') || ly === 999; })();
                    const leaseYears = Number(villa.lease_years) || 0;
                    const leaseDepreciation = (!isFreehold && leaseYears > 0) ? (1 / leaseYears) * 100 : 0;
                    const grossRevenue = nightly * 365 * occupancy;
                    const netRevenue = grossRevenue * 0.60;
                    const preDepreciationNet = priceUSD > 0 ? (netRevenue / priceUSD) * 100 : 0;
                    const hasDanger = redFlags.some(f => f.level === 'danger');
                    const hasWarning = redFlags.length > 0;

                    return (
                    <tr key={villa.id} className={`transition-colors group ${hoveredListingUrl === villa.url ? 'bg-[color:var(--bvt-ink)]/[0.04]' : 'hover:bg-[color:var(--bvt-ink)]/[0.025]'}`} onMouseEnter={() => setHoveredListingUrl(villa.url)} onMouseLeave={() => setHoveredListingUrl(null)}>
                        <td className="py-6 pr-2 align-middle">
                          <span className="font-mono text-[11px] tabular-nums text-[color:var(--bvt-accent)]">{String(idx + 1).padStart(2, '0')}</span>
                        </td>
                        <td className="py-6 pr-5 align-middle">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail with overlaid compare / favorite controls */}
                          <div className="relative w-24 h-16 flex-shrink-0 group/thumb">
                            {villa.thumbnail_url ? (
                              <img src={villa.thumbnail_url} alt="" className="w-24 h-16 object-cover bg-[color:var(--bvt-bg-soft)] border border-[color:var(--bvt-hairline)]" loading="lazy" />
                            ) : (
                              <div className="w-24 h-16 bg-[color:var(--bvt-bg-soft)] border border-[color:var(--bvt-hairline)] flex items-center justify-center">
                                <Home size={16} strokeWidth={1.5} className="text-[color:var(--bvt-ink-faint)]" />
                              </div>
                            )}
                            {/* Compare checkbox — top-left overlay */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleCompare(villa.id); }}
                              disabled={!compareSet.has(villa.id) && compareSet.size >= 5}
                              title={compareSet.has(villa.id) ? 'Remove from compare' : compareSet.size >= 5 ? 'Max 5 villas' : 'Add to compare'}
                              className={`absolute top-1.5 left-1.5 w-[18px] h-[18px] flex items-center justify-center backdrop-blur-sm transition-all ${
                                compareSet.has(villa.id)
                                  ? 'bg-[color:var(--bvt-accent)] text-[color:var(--bvt-bg)] opacity-100'
                                  : compareSet.size >= 5
                                    ? 'bg-[color:var(--bvt-bg)]/70 border border-[color:var(--bvt-hairline)] text-transparent opacity-0 cursor-not-allowed'
                                    : 'bg-[color:var(--bvt-bg)]/70 border border-[color:var(--bvt-hairline-2)] text-transparent opacity-0 group-hover/thumb:opacity-100 hover:border-[color:var(--bvt-accent)]'
                              }`}
                            >
                              <Check size={11} strokeWidth={3} />
                            </button>
                            {/* Heart — top-right overlay */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(villa.id); }}
                              title={favorites.has(villa.id) ? 'Remove from saved' : 'Save listing'}
                              className={`absolute top-1.5 right-1.5 w-[22px] h-[22px] flex items-center justify-center rounded-full backdrop-blur-sm transition-all ${
                                favorites.has(villa.id)
                                  ? 'bg-[color:var(--bvt-bg)]/80 opacity-100'
                                  : 'bg-[color:var(--bvt-bg)]/60 opacity-0 group-hover/thumb:opacity-100 hover:bg-[color:var(--bvt-bg)]/80'
                              }`}
                            >
                              <Heart size={12} strokeWidth={1.5} className={favorites.has(villa.id) ? 'text-[color:var(--bvt-accent)] fill-[color:var(--bvt-accent)]' : 'text-[color:var(--bvt-ink)]'} />
                            </button>
                          </div>
                          <div className="min-w-0">
                            <div className="font-display text-[17px] leading-[1.15] tracking-[-0.005em] text-[color:var(--bvt-ink)] group-hover:text-[color:var(--bvt-accent)] transition-colors flex items-center gap-2.5">
                                <span className="truncate">{villa.villa_name || 'Luxury Villa'}</span>
                                {hasDanger && <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-medium tracking-[0.12em] uppercase text-[color:var(--bvt-bad)]"><ShieldAlert size={9} strokeWidth={1.5}/> Verify</span>}
                                {!hasDanger && hasWarning && <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-medium tracking-[0.12em] uppercase text-[color:var(--bvt-warn)]"><AlertTriangle size={9} strokeWidth={1.5}/> Caution</span>}
                            </div>
                            <div className="mt-1 label-micro">
                                {villa.location || "Bali"}
                            </div>
                          </div>
                        </div>
                        </td>
                        <td className="py-6 px-5 align-middle">
                         <div className="flex items-center gap-2">
                           <span className="font-mono tabular-nums text-[14px] text-[color:var(--bvt-ink)]">{formatPriceInCurrency(villa)}</span>
                           {(() => {
                             const badge = getPriceChangeBadge(villa);
                             if (!badge.direction) return null;
                             const hasHistory = priceHistory[villa.url] && priceHistory[villa.url].length >= 1;
                             return (
                               <span className={`relative font-mono tabular-nums text-[10px] cursor-help ${
                                 badge.direction === 'down'
                                   ? 'text-[color:var(--bvt-good)]'
                                   : 'text-[color:var(--bvt-bad)]'
                               }`}
                               onMouseEnter={() => setHoveredPriceBadge(villa.id)}
                               onMouseLeave={() => setHoveredPriceBadge(null)}>
                                 {badge.direction === 'down' ? '▾' : '▴'} {badge.text}
                                 {hasHistory && hoveredPriceBadge === villa.id && (
                                   <PriceSparkline url={villa.url} currentPriceUsd={getPriceUSD(villa)} />
                                 )}
                               </span>
                             );
                           })()}
                         </div>
                        </td>
                        <td className="py-6 px-5 align-middle font-mono tabular-nums text-[12px] text-[color:var(--bvt-ink-muted)]">
                         {getPricePerSqm(villa)}
                        </td>
                        <td className="py-6 px-5 align-middle">
                        <div className="flex flex-col items-center relative">
                            <div className="relative cursor-help text-center" onMouseEnter={() => setHoveredRoi(villa.id)} onMouseLeave={() => setHoveredRoi(null)}>
                            {/* BVT Adjusted ROI — prominent numeric */}
                            <div className={`font-mono tabular-nums text-[22px] leading-none ${
                              netRoi >= 12 ? 'text-[color:var(--bvt-good)]' :
                              netRoi >= 7 ? 'text-[color:var(--bvt-ink)]' :
                              netRoi >= 0 ? 'text-[color:var(--bvt-ink-muted)]' :
                              'text-[color:var(--bvt-bad)]'
                            }`}>
                                {netRoi.toFixed(1)}<span className="text-[14px] text-[color:var(--bvt-ink-dim)] ml-0.5">%</span>
                            </div>
                            <p className="text-[10px] text-[color:var(--bvt-ink-dim)] mt-1.5 font-mono tabular-nums">
                              <span className="line-through opacity-60">{grossRoi.toFixed(1)}%</span>
                              <span className="mx-1.5 text-[color:var(--bvt-ink-faint)]">·</span>
                              ${getDisplayNightly(villa)}/nt
                            </p>

                            {/* Pre-depreciation yield for leaseholds */}
                            {!isFreehold && leaseDepreciation > 0 && (
                              <p className="text-[10px] text-[color:var(--bvt-warn)] font-mono tabular-nums mt-1">Pre-exp: {preDepreciationNet.toFixed(1)}%</p>
                            )}

                            {/* Red flag markers under ROI */}
                            {redFlags.length > 0 && (
                              <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 mt-1.5">
                                {redFlags.map((flag, idx) => (
                                  <span key={idx} className={`text-[9px] font-medium tracking-[0.1em] uppercase ${
                                    flag.level === 'danger' ? 'text-[color:var(--bvt-bad)]' :
                                    flag.level === 'assumed' ? 'text-[color:var(--bvt-ink-muted)]' :
                                    'text-[color:var(--bvt-warn)]'
                                  }`}>
                                    {flag.label}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Simplified tooltip with pipeline-sourced values */}
                            {hoveredRoi === villa.id && (
                                <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-slate-900 text-white text-[10px] rounded-lg p-3 shadow-xl pointer-events-none">
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900"></div>
                                <div className="font-bold mb-1 text-blue-400 flex items-center gap-1"><Eye size={11}/> BVT Yield Breakdown</div>

                                {/* Gross vs Net comparison */}
                                <div className="mb-2 pb-2 border-b border-slate-700 flex gap-4">
                                  <div className="flex-1 text-center">
                                    <div className="text-slate-500 text-[9px] mb-0.5">Gross Yield</div>
                                    <div className="text-lg font-bold text-slate-400 line-through">{grossRoi.toFixed(1)}%</div>
                                  </div>
                                  <div className="flex-1 text-center">
                                    <div className="text-blue-400 text-[9px] mb-0.5 font-bold">Net Yield</div>
                                    <div className={`text-lg font-bold ${netRoi >= 7 ? 'text-emerald-400' : netRoi >= 0 ? 'text-amber-400' : 'text-red-400'}`}>{netRoi.toFixed(1)}%</div>
                                  </div>
                                </div>

                                {/* Transparent assumptions */}
                                <div className="mb-2 pb-2 border-b border-slate-700">
                                    <div className="text-slate-500 font-bold mb-1">Computed using</div>
                                    <div className="text-slate-300 text-[9px] space-y-1">
                                      <div><span className="text-emerald-400 font-bold">${nightly}/night</span> <span className="text-slate-500">— based on Booking.com market data for {villa.location || 'this area'}, {villa.bedrooms || '?'}-bed villas</span></div>
                                      <div><span className="text-emerald-400 font-bold">{Math.round(365 * occupancy)} nights/yr</span> <span className="text-slate-400">(65% occ)</span> <span className="text-slate-500">— assumed, we don't have occupancy data for this area</span></div>
                                      <div><span className="text-emerald-400 font-bold">40% to operating costs</span> <span className="text-slate-500">(mgmt 15%, OTA fees 15%, maintenance 10%)</span></div>
                                    </div>
                                    <p className="text-slate-500 text-[9px] flex items-center gap-1 mt-1.5"><SlidersHorizontal size={9} className="text-slate-600"/> Select villas with the checkbox to compare and adjust these assumptions</p>
                                </div>

                                {/* Capital depreciation for leaseholds */}
                                {!isFreehold && leaseDepreciation > 0 && (
                                <div className="mb-2 pb-2 border-b border-slate-700">
                                    <div className="text-orange-400 font-bold mb-1">Lease Depreciation</div>
                                    {(() => {
                                      const depCostAnnual = leaseYears > 0 ? Math.round(priceUSD / leaseYears) : 0;
                                      return (
                                        <>
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Lease expiry ({leaseYears}yr)</span>
                                            <span className="text-orange-400 font-mono">-{leaseDepreciation.toFixed(1)}%/yr</span>
                                          </div>
                                          {depCostAnnual > 0 && (
                                            <div className="text-orange-300 text-[8px] mt-0.5">≈ ${depCostAnnual.toLocaleString()}/yr in capital loss — your asset heads to $0</div>
                                          )}
                                        </>
                                      );
                                    })()}
                                </div>
                                )}

                                {/* Red flags in tooltip */}
                                {redFlags.length > 0 && (
                                  <div className="mb-2 pb-2 border-b border-slate-700">
                                    {redFlags.map((flag, idx) => (
                                      <div key={idx} className={`flex items-start gap-1.5 mb-1 ${flagTextClass(flag.level)}`}>
                                        {flag.level === 'assumed' ? <Info size={10} className="mt-0.5 flex-shrink-0" /> : <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />}
                                        <span>{flag.detail}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {!isFreehold && leaseDepreciation > 0 && (
                                  <div className="mb-2 pb-2 border-b border-slate-700">
                                    <p className="text-slate-400 text-[9px]"><span className="text-emerald-400 font-bold">Cash Flow ({preDepreciationNet.toFixed(1)}%)</span> = money hitting your account each year. <span className="text-blue-400 font-bold">Net Yield ({netRoi.toFixed(1)}%)</span> = true return after accounting for your asset depreciating to $0.</p>
                                  </div>
                                )}
                                </div>
                            )}
                            </div>
                        </div>
                        </td>
                        <td className="py-6 px-5 align-middle text-[12px] text-[color:var(--bvt-ink-muted)] space-y-1">
                            {/* Tenure — lead with the most important fact */}
                            <div>
                                {(() => {
                                    const f = (villa.features || "").trim();
                                    const years = Number(villa.lease_years) || 0;
                                    const isFreehold = f.includes("Freehold") || f.includes("Hak Milik") || years === 999;
                                    const isLeasehold = f.includes("Leasehold") || f.includes("Hak Sewa") || (years > 0 && years < 999);
                                    if (isFreehold) return <span className="text-[color:var(--bvt-good)] inline-flex items-center gap-1 font-medium"><span className="h-1.5 w-1.5 bg-[color:var(--bvt-good)] rounded-full" />Freehold<GlossaryTip term="hak_milik" /></span>;
                                    if (isLeasehold) {
                                        const yearsLabel = years > 0 && years < 999 ? <><span className="font-mono tabular-nums text-[color:var(--bvt-ink)]">{years}yr</span> remaining</> : <>years unstated</>;
                                        return <span className="text-[color:var(--bvt-ink-body)] inline-flex items-center gap-1"><span className="h-1.5 w-1.5 bg-[color:var(--bvt-ink-dim)] rounded-full" />Leasehold<GlossaryTip term="hak_sewa" /> · {yearsLabel}</span>;
                                    }
                                    if (years > 0 && years < 999) return <span className="text-[color:var(--bvt-ink-body)]"><span className="font-mono tabular-nums text-[color:var(--bvt-ink)]">{years}yr</span> remaining</span>;
                                    if (years === 999) return <span className="text-[color:var(--bvt-good)] font-medium">Freehold</span>;
                                    return <span className="text-[color:var(--bvt-ink-faint)] italic">Unverified</span>;
                                })()}
                            </div>

                            {/* Beds · baths · land · build — compact editorial row */}
                            <div className="font-mono tabular-nums text-[11px] text-[color:var(--bvt-ink-dim)] pt-0.5">
                                {villa.bedrooms ? `${villa.bedrooms}bd` : '?bd'}
                                {villa.beds_baths && ` / ${villa.beds_baths.split('/')[1]?.trim().split(' ')[0] || '?'}ba`}
                                <span className="mx-1.5 text-[color:var(--bvt-ink-faint)]">·</span>
                                {villa.land_size || '?'}m² land
                                {villa.building_size > 0 && (
                                  <>
                                    <span className="mx-1.5 text-[color:var(--bvt-ink-faint)]">·</span>
                                    {villa.building_size}m² build
                                  </>
                                )}
                            </div>
                        </td>
                        <td className="py-6 pl-5 text-right align-middle">
                        <button onClick={() => setSelectedVilla(villa)} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--bvt-ink)] hover:text-[color:var(--bvt-accent)] transition-colors group/btn">
                            <Lock size={11} strokeWidth={1.5}/>
                            <span className="border-b border-[color:var(--bvt-accent-dim)] group-hover/btn:border-[color:var(--bvt-accent)] pb-px transition-colors">Unlock dossier</span>
                            <span aria-hidden className="text-[color:var(--bvt-accent)]">→</span>
                        </button>
                        </td>
                    </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* MAP PANEL (sticky alongside table) */}
      {showMap && (
        <div className="w-[40%] flex-shrink-0 sticky top-4 self-start" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          <BaliMapView listings={processedListings} displayCurrency={displayCurrency} rates={rates} hoveredListingUrl={hoveredListingUrl} favorites={favorites} compareSet={compareSet} onToggleFavorite={toggleFavorite} onToggleCompare={toggleCompare} onUnlockVilla={setSelectedVilla} darkMode={darkMode} />
        </div>
      )}
      </div>{/* end split layout flex */}

      {/* MODAL */}
      {selectedVilla && (
        <div className="fixed inset-0 dark:bg-black/80 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setSelectedVilla(null)} className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"><X size={20}/></button>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck className="text-blue-600 dark:text-blue-400" size={32} /></div>
              <h2 className="text-2xl font-bold dark:text-slate-100 mb-2">Unlock Full Audit</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Enter your professional email to unlock the original source link and our 5-year ROI projection for <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedVilla.villa_name}</span>.</p>
              <form onSubmit={handleLeadCapture} className="space-y-4">
                <input type="email" required placeholder="name@company.com" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900 disabled:opacity-50">{isSubmitting ? 'Verifying...' : 'Unlock Now'}</button>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">By clicking, you agree to our Investor Privacy Terms.</p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING COMPARE BAR */}
      {compareSet.size > 0 && !showCompare && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl shadow-2xl px-4 md:px-6 py-3 flex items-center gap-2 md:gap-4 animate-in slide-in-from-bottom duration-300 max-w-[95vw]">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-400" />
            <span className="font-bold text-sm">{compareSet.size} villa{compareSet.size !== 1 ? 's' : ''} selected</span>
          </div>
          <button
            onClick={() => { setShowCompare(true); setSliderNightly(1.0); setSliderOccupancy(65); setSliderExpense(40); }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <SlidersHorizontal size={14} /> Compare Now
          </button>
          <button
            onClick={() => setCompareSet(new Set())}
            className="text-slate-400 hover:text-white text-sm font-medium px-2 py-1 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* COMPARE PANEL MODAL */}
      {showCompare && (() => {
        const compareVillas = listings.filter(v => compareSet.has(v.id));
        const BVT_DEFAULTS = { nightly: 1.0, occupancy: 65, expense: 40 };

        return (
          <div className="fixed inset-0 dark:bg-black/80 bg-slate-900/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl my-8 relative">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <SlidersHorizontal size={20} className="text-blue-600 dark:text-blue-400" /> Villa ROI Calculator
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Adjust assumptions to see how yields change across your selection</p>
                </div>
                <button onClick={() => setShowCompare(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 p-2"><X size={24}/></button>
              </div>

              {/* Sliders */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Nightly Rate Multiplier */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Nightly Rate</label>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{sliderNightly.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range" min="0.5" max="2.0" step="0.1"
                      value={sliderNightly}
                      onChange={(e) => setSliderNightly(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      <span>0.5x</span>
                      <span className="text-blue-500 dark:text-blue-400 font-bold">BVT: {BVT_DEFAULTS.nightly}x</span>
                      <span>2.0x</span>
                    </div>
                  </div>

                  {/* Occupancy */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Occupancy</label>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{sliderOccupancy}%</span>
                    </div>
                    <input
                      type="range" min="20" max="95" step="1"
                      value={sliderOccupancy}
                      onChange={(e) => setSliderOccupancy(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      <span>20%</span>
                      <span className="text-blue-500 dark:text-blue-400 font-bold">BVT: {BVT_DEFAULTS.occupancy}%</span>
                      <span>95%</span>
                    </div>
                  </div>

                  {/* Expense Load */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide relative group/expense inline-flex items-center gap-1">
                        Expense Load
                        <Info size={12} className="text-slate-400 group-hover/expense:text-blue-500 cursor-help" />
                        <span className="invisible group-hover/expense:visible absolute top-full left-0 mt-2 w-56 bg-slate-900 text-white text-[10px] leading-relaxed rounded-lg px-3 py-2.5 shadow-xl z-50 pointer-events-none font-normal normal-case tracking-normal">
                          <span className="font-bold text-blue-300 block mb-1">What&apos;s included:</span>
                          {Object.entries(COST_BREAKDOWN).map(([key, cost]) => (
                            <span key={key} className="flex justify-between"><span className="text-slate-300">{cost.label}</span><span className="text-red-400 font-mono">{(cost.rate * 100).toFixed(0)}%</span></span>
                          ))}
                          <span className="block mt-1.5 pt-1.5 border-t border-slate-700 text-slate-500">Mgmt, OTA commissions, pool, garden, AC, wifi, repairs</span>
                          <span className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-900"></span>
                        </span>
                      </label>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{sliderExpense}%</span>
                    </div>
                    <input
                      type="range" min="20" max="60" step="1"
                      value={sliderExpense}
                      onChange={(e) => setSliderExpense(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      <span>20%</span>
                      <span className="text-blue-500 dark:text-blue-400 font-bold">BVT: {BVT_DEFAULTS.expense}%</span>
                      <span>60%</span>
                    </div>
                  </div>
                </div>

                {/* Reset to BVT defaults */}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => { setSliderNightly(1.0); setSliderOccupancy(65); setSliderExpense(40); }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    Reset to BVT Defaults
                  </button>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 pr-4 w-36">Metric</th>
                      {compareVillas.map(v => (
                        <th key={v.id} className="text-center py-3 px-3 min-w-[140px]">
                          <div className="text-slate-700 dark:text-slate-300 text-[11px] normal-case font-bold truncate max-w-[160px]">{v.villa_name}</div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">{v.location}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {/* Price */}
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">Price</td>
                      {compareVillas.map(v => (
                        <td key={v.id} className="text-center py-2.5 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">{formatPriceInCurrency(v)}</td>
                      ))}
                    </tr>
                    {/* Lease */}
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">Lease</td>
                      {compareVillas.map(v => {
                        const f = (v.features || '').toLowerCase();
                        const yrs = Number(v.lease_years) || 0;
                        const isFH = f.includes('freehold') || f.includes('hak milik') || yrs === 999;
                        return (
                          <td key={v.id} className={`text-center py-2.5 px-3 ${isFH ? 'text-green-600 dark:text-green-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                            <span className="inline-flex items-center justify-center">{isFH ? <>Freehold<GlossaryTip term="hak_milik" /></> : yrs > 0 ? <>{yrs}yr lease<GlossaryTip term="hak_sewa" /></> : 'Unknown'}</span>
                          </td>
                        );
                      })}
                    </tr>
                    {/* Nightly Rate */}
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">Nightly Rate</td>
                      {compareVillas.map(v => {
                        const base = v.est_nightly_rate || getDisplayNightly(v);
                        const adjusted = Math.round(base * sliderNightly);
                        return (
                          <td key={v.id} className="text-center py-2.5 px-3 font-mono">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">${adjusted}</span>
                            {sliderNightly !== 1.0 && <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-1">(base ${base})</span>}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Occupancy & Expense (shared) */}
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">Occupancy</td>
                      {compareVillas.map(v => (
                        <td key={v.id} className="text-center py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{sliderOccupancy}%</td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">Expense Load</td>
                      {compareVillas.map(v => (
                        <td key={v.id} className="text-center py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{sliderExpense}%</td>
                      ))}
                    </tr>
                    {/* Dynamic calculations */}
                    {(() => {
                      const results = compareVillas.map(v => ({
                        id: v.id,
                        ...calculateDynamicROI(v, sliderNightly, sliderOccupancy, sliderExpense),
                      }));
                      const bestYield = Math.max(...results.map(r => r.netYield));

                      return (
                        <>
                          <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                            <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">Gross Revenue</td>
                            {results.map(r => (
                              <td key={r.id} className="text-center py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">${r.annualRevenue.toLocaleString()}/yr</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-100 dark:border-slate-700">
                            <td className="py-2.5 pr-4 text-slate-400 dark:text-slate-500 font-medium">Gross Yield</td>
                            {results.map(r => (
                              <td key={r.id} className="text-center py-2.5 px-3 font-mono text-slate-400 dark:text-slate-500 line-through">{r.grossYield.toFixed(1)}%</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                            <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">Expenses</td>
                            {results.map(r => (
                              <td key={r.id} className="text-center py-2.5 px-3 font-mono text-red-500 dark:text-red-400">-${r.annualExpenses.toLocaleString()}/yr</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                            <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-300 font-bold">Net Revenue</td>
                            {results.map(r => (
                              <td key={r.id} className="text-center py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">${r.netRevenue.toLocaleString()}/yr</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 dark:border-slate-700 bg-emerald-50/40 dark:bg-emerald-950/20">
                            <td className="py-2.5 pr-4 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                              Cash Flow Yield
                              <span className="block text-[9px] text-emerald-500 dark:text-emerald-400 font-normal">Cash-on-cash return</span>
                            </td>
                            {results.map(r => {
                              const priceUSD = getPriceUSD(compareVillas.find(v => v.id === r.id));
                              const cashFlowYield = priceUSD > 0 ? (r.netRevenue / priceUSD) * 100 : 0;
                              return (
                                <td key={r.id} className="text-center py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                                  {cashFlowYield.toFixed(1)}%
                                </td>
                              );
                            })}
                          </tr>
                          <tr className="border-b border-slate-100 dark:border-slate-700 bg-amber-50/40 dark:bg-amber-950/30">
                            <td className="py-2.5 pr-4 text-amber-700 dark:text-amber-400 font-medium text-sm">
                              Lease Depreciation
                              <span className="block text-[9px] text-amber-500 dark:text-amber-400 font-normal">Asset value loss/yr</span>
                            </td>
                            {results.map(r => (
                              <td key={r.id} className="text-center py-2.5 px-3 font-mono">
                                {r.isFreehold ? (
                                  <span className="text-green-600 dark:text-green-400 text-xs font-medium">Freehold — N/A</span>
                                ) : r.leaseDepreciation > 0 ? (
                                  <div>
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">-${r.leaseDepreciation.toLocaleString()}/yr</span>
                                    <span className="block text-[9px] text-amber-500 dark:text-amber-400">-{r.depreciationYield}% yield ({r.leaseYears}yr lease)</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 text-xs">Unknown tenure</span>
                                )}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-blue-50/50 dark:bg-blue-950/30">
                            <td className="py-3 pr-4 text-blue-700 dark:text-blue-400 font-bold text-sm">
                              Net Yield
                              <span className="block text-[9px] text-blue-400 dark:text-blue-400 font-normal">After depreciation</span>
                            </td>
                            {results.map(r => (
                              <td key={r.id} className={`text-center py-3 px-3 font-mono font-bold text-lg ${
                                r.netYield === bestYield && results.filter(x => x.netYield === bestYield).length === 1
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : r.netYield >= 7 ? 'text-blue-600 dark:text-blue-400' : r.netYield >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {r.netYield.toFixed(1)}%
                                {r.netYield === bestYield && results.filter(x => x.netYield === bestYield).length === 1 && (
                                  <span className="block text-[9px] text-emerald-500 dark:text-emerald-400 font-bold mt-0.5">BEST</span>
                                )}
                              </td>
                            ))}
                          </tr>
                          {/* Red Flags row */}
                          <tr className="border-b border-slate-100 dark:border-slate-700">
                            <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">Flags</td>
                            {compareVillas.map(v => {
                              const flags = getRedFlags(v);
                              return (
                                <td key={v.id} className="text-center py-2.5 px-3">
                                  {flags.length === 0 ? (
                                    <span className="text-green-500 dark:text-green-400 text-[10px] font-medium">Clean</span>
                                  ) : (
                                    <div className="flex flex-wrap justify-center gap-1">
                                      {flags.map((f, i) => (
                                        <span key={i} className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${flagBadgeClass(f.level)}`}>{f.label}</span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                          {/* Unlock row */}
                          <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                            <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium">Unlock Source</td>
                            {compareVillas.map(v => (
                              <td key={v.id} className="text-center py-3 px-3">
                                <button
                                  onClick={() => { setSelectedVilla(v); }}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                >
                                  <Lock size={12} /> Unlock
                                </button>
                              </td>
                            ))}
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Footer note */}
              <div className="px-6 pb-6 text-[10px] text-slate-400 italic">
                These projections are estimates based on your inputs. Actual returns depend on management quality, market conditions, and property-specific factors. BVT does not provide financial advice.
              </div>
            </div>
          </div>
        );
      })()}

      {/* FAQ SECTION (#14) — answers top buyer questions + JSON-LD for rich results */}
      <FAQSection />

      {/* NEWSLETTER (#18) — weekly digest signup */}
      <NewsletterBlock />

      {/* Footer is rendered globally via app/layout.tsx (SiteFooter) */}
      </div>{/* end listings-section */}
    </div>
  );
}

// --- AREA COORDINATES for Bali Map ---
const AREA_COORDS: Record<string, [number, number]> = {
  'Canggu': [-8.6478, 115.1385],
  'Pererenan': [-8.6350, 115.1050],
  'Berawa': [-8.6580, 115.1470],
  'Seminyak': [-8.6880, 115.1600],
  'Kerobokan': [-8.6700, 115.1550],
  'Uluwatu': [-8.8291, 115.0849],
  'Bingin': [-8.8050, 115.1000],
  'Ungasan': [-8.8100, 115.1700],
  'Nusa Dua': [-8.8000, 115.2300],
  'Jimbaran': [-8.7700, 115.1650],
  'Ubud': [-8.5069, 115.2625],
  'Sanur': [-8.6900, 115.2600],
  'Tabanan': [-8.5400, 115.0000],
  'Seseh': [-8.6200, 115.0900],
  'Cemagi': [-8.6250, 115.0800],
  'Kedungu': [-8.5900, 115.0500],
  'Amed': [-8.3500, 115.6600],
  'Lovina': [-8.1500, 115.0200],
  'North Bali': [-8.2000, 115.1000],
  'Lombok': [-8.5800, 116.1000],
  'Nusa Penida': [-8.7300, 115.5400],
};

function BaliMapView({ listings, displayCurrency, rates, hoveredListingUrl, favorites, compareSet, onToggleFavorite, onToggleCompare, onUnlockVilla, darkMode }: { listings: any[]; displayCurrency: string; rates: Record<string, number>; hoveredListingUrl?: string | null; favorites: Set<number>; compareSet: Set<number>; onToggleFavorite: (id: number) => void; onToggleCompare: (id: number) => void; onUnlockVilla: (villa: any) => void; darkMode?: boolean }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapRef, setMapRef] = useState<any>(null);
  const [markersRef, setMarkersRef] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.querySelector('style[data-bvt-popup]')) {
      const style = document.createElement('style');
      style.setAttribute('data-bvt-popup', '1');
      style.textContent = `
        /* Editorial popup */
        .bvt-leaflet-popup .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 0 !important;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px #2d364a;
          background: #0a0e16 !important;
          color: #f5f0e6 !important;
        }
        .bvt-leaflet-popup .leaflet-popup-content { margin: 0 !important; width: 260px !important; }
        .bvt-leaflet-popup .leaflet-popup-tip { background: #0a0e16 !important; box-shadow: 0 0 0 1px #2d364a; }
        .bvt-leaflet-popup .leaflet-popup-close-button {
          z-index: 10; right: 8px !important; top: 8px !important;
          color: #6b7080 !important; font-size: 18px !important;
          font-family: var(--font-display, serif) !important;
        }
        .bvt-leaflet-popup .leaflet-popup-close-button:hover { color: #d4943a !important; }

        /* Editorial price-pill marker */
        .bvt-price-marker {
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .bvt-price-marker__pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 7px;
          background: rgba(10, 14, 22, 0.92);
          border: 1px solid #2d364a;
          color: #f5f0e6;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11px;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.02em;
          white-space: nowrap;
          transform: translate(-50%, -50%);
          transition: border-color 0.15s, transform 0.15s;
        }
        .bvt-price-marker__pill::before {
          content: "";
          width: 5px; height: 5px; border-radius: 999px;
          background: var(--dot, #6b7080);
          flex-shrink: 0;
        }
        .bvt-price-marker:hover .bvt-price-marker__pill,
        .bvt-price-marker--active .bvt-price-marker__pill {
          border-color: #d4943a;
          transform: translate(-50%, -50%) scale(1.08);
          z-index: 1000;
        }
        .bvt-price-marker--hi { --dot: #7cc087; }
        .bvt-price-marker--mid { --dot: #d4943a; }
        .bvt-price-marker--low { --dot: #6b7080; }

        /* Dark editorial Leaflet chrome */
        .leaflet-container { background: #0a0e16 !important; font-family: inherit !important; }
        .leaflet-control-attribution {
          background: rgba(10,14,22,0.7) !important;
          color: #6b7080 !important;
          font-size: 9px !important;
          padding: 1px 6px !important;
          border: none !important;
        }
        .leaflet-control-attribution a { color: #a0a3ad !important; }
        .leaflet-control-zoom a {
          background: rgba(10,14,22,0.9) !important;
          color: #f5f0e6 !important;
          border: 1px solid #232b3d !important;
          font-weight: 300 !important;
        }
        .leaflet-control-zoom a:hover { background: #1a2030 !important; color: #d4943a !important; border-color: #d4943a !important; }
      `;
      document.head.appendChild(style);
    }
    const loadLeaflet = () => new Promise<void>((resolve) => {
      if ((window as any).L) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
    loadLeaflet().then(() => setMapLoaded(true));
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!mapLoaded) return;
    const L = (window as any).L;
    const container = document.getElementById('bali-map');
    if (!container || !L) return;

    if ((container as any)._leafletMap) {
      (container as any)._leafletMap.remove();
      (container as any)._leafletMap = null;
    }

    const map = L.map('bali-map', { zoomControl: true }).setView([-8.65, 115.15], 11);
    (container as any)._leafletMap = map;
    setMapRef(map);

    // Carto Dark Matter — editorial dark basemap (free for non-commercial, same terms as OSM)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '© OSM · Carto',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
    // Labels-only overlay so place names render above our price pills
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      pane: 'shadowPane',
    }).addTo(map);

    setTimeout(() => { map.invalidateSize(); }, 100);

    return () => {
      map.remove();
      if (container) (container as any)._leafletMap = null;
    };
  }, [mapLoaded]);

  // Add/update property markers when listings change
  useEffect(() => {
    if (!mapRef || !mapLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    // Clear existing markers
    Object.values(markersRef).forEach((m: any) => { try { mapRef.removeLayer(m); } catch {} });

    const newMarkers: Record<string, any> = {};
    const markerCluster: any[] = [];

    listings.forEach(villa => {
      const lat = parseFloat(villa.latitude);
      const lng = parseFloat(villa.longitude);
      if (!lat || !lng || lat === 0 || lng === 0) return;

      const roi = villa.projected_roi || 0;
      const roiTier = roi >= 10 ? 'hi' : roi >= 5 ? 'mid' : 'low';

      // Price formatting for popup / marker label
      const desc = (villa.price_description || '').trim();
      const priceMatch = desc.match(/^(IDR|USD|AUD|EUR|SGD)\s*([\d,.\s]+)/i);
      let priceStr = '';
      let priceUSD = 0;
      if (priceMatch) {
        const amount = parseFloat(priceMatch[2].replace(/\s|,/g, '')) || 0;
        const cur = priceMatch[1].toUpperCase();
        const r = rates[cur];
        priceUSD = cur === 'USD' ? amount : (r && r > 0 ? amount / r : amount);
        const displayVal = displayCurrency === 'USD' ? priceUSD : priceUSD * (rates[displayCurrency] || 1);
        priceStr = `${displayCurrency} ${Math.round(displayVal).toLocaleString()}`;
      } else {
        const p = Number(villa.last_price) || 0;
        priceUSD = p >= 1e6 ? p / (rates['IDR'] || 16782) : p;
        const displayVal = displayCurrency === 'USD' ? priceUSD : priceUSD * (rates[displayCurrency] || 1);
        priceStr = `${displayCurrency} ${Math.round(displayVal).toLocaleString()}`;
      }
      // Compact label for the marker itself — "$340k · 9.2%"
      const priceShort = priceUSD >= 1e6 ? `$${(priceUSD / 1e6).toFixed(1)}M` : priceUSD >= 1000 ? `$${Math.round(priceUSD / 1000)}k` : `$${Math.round(priceUSD)}`;
      const labelHtml = `<span class="bvt-price-marker__pill">${priceShort}<span style="color:#6b7080;padding:0 2px;">·</span>${roi.toFixed(1)}%</span>`;

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: `bvt-price-marker bvt-price-marker--${roiTier}`,
          html: labelHtml,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      }).addTo(mapRef);

      const isFav = favorites.has(villa.id);
      const isCmp = compareSet.has(villa.id);
      const cmpFull = compareSet.size >= 5 && !isCmp;

      // ROI dot color (matches marker)
      const dotColor = roiTier === 'hi' ? '#7cc087' : roiTier === 'mid' ? '#d4943a' : '#6b7080';

      marker.bindPopup(`
        <div class="bvt-map-popup" data-villa-id="${villa.id}" style="font-family: var(--font-sans, ui-sans-serif, system-ui); color: #f5f0e6;">
          <div style="padding: 14px 14px 10px 14px; border-bottom: 1px solid #2d364a;">
            <div style="font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: #6b7080; margin-bottom: 6px;">
              Dossier · <span style="color:${dotColor};">${villa.location || 'Bali'}</span>
            </div>
            <div style="font-family: var(--font-display, 'Fraunces', serif); font-weight: 400; font-size: 16px; line-height: 1.18; letter-spacing: -0.005em; color: #f5f0e6; word-wrap: break-word;">
              ${(villa.villa_name || 'Villa').substring(0, 60)}
            </div>
          </div>
          <div style="padding: 12px 14px; border-bottom: 1px solid #232b3d; display: flex; justify-content: space-between; align-items: baseline;">
            <div>
              <div style="font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: #6b7080; margin-bottom: 3px;">Price</div>
              <div style="font-family: var(--font-mono, ui-monospace, monospace); font-variant-numeric: tabular-nums; font-size: 13px; color: #f5f0e6;">${priceStr}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: #6b7080; margin-bottom: 3px;">Net Yield</div>
              <div style="font-family: var(--font-mono, ui-monospace, monospace); font-variant-numeric: tabular-nums; font-size: 18px; line-height: 1; color: ${dotColor};">${roi.toFixed(1)}<span style="font-size: 12px; color: #4a5060;">%</span></div>
            </div>
          </div>
          <div style="padding: 10px 14px 12px; display: flex; gap: 14px; align-items: center; justify-content: space-between;">
            <button data-action="favorite" data-villa-id="${villa.id}" style="display: inline-flex; align-items: center; gap: 5px; background: none; border: none; padding: 4px 0; font-size: 11px; color: ${isFav ? '#d4943a' : '#a0a3ad'}; cursor: pointer;">
              <span style="font-size: 13px; line-height: 1;">${isFav ? '●' : '○'}</span> ${isFav ? 'Saved' : 'Save'}
            </button>
            <button data-action="compare" data-villa-id="${villa.id}" style="display: inline-flex; align-items: center; gap: 5px; background: none; border: none; padding: 4px 0; font-size: 11px; color: ${isCmp ? '#d4943a' : cmpFull ? '#4a5060' : '#a0a3ad'}; cursor: ${cmpFull ? 'default' : 'pointer'}; ${cmpFull ? 'opacity: 0.6;' : ''}">
              ${isCmp ? '✓' : '+'} ${isCmp ? 'Selected' : 'Compare'}
            </button>
            <button data-action="unlock" data-villa-id="${villa.id}" style="display: inline-flex; align-items: center; gap: 5px; background: none; border: none; border-bottom: 1px solid #8f6324; padding: 4px 0; font-size: 11px; color: #f5f0e6; cursor: pointer; font-weight: 500;">
              Unlock <span style="color: #d4943a;">→</span>
            </button>
          </div>
        </div>
      `, { closeButton: true, className: 'bvt-leaflet-popup', offset: [0, -4] });

      if (villa.url) newMarkers[villa.url] = marker;
      markerCluster.push(marker);
    });

    setMarkersRef(newMarkers);
  }, [mapRef, mapLoaded, listings, displayCurrency, rates, favorites, compareSet]);

  // Highlight marker on hover — DivIcon markers use a class toggle
  useEffect(() => {
    if (!mapRef || !mapLoaded) return;

    Object.entries(markersRef).forEach(([url, marker]) => {
      const el = (marker as any).getElement && (marker as any).getElement();
      if (!el) return;
      if (url === hoveredListingUrl) {
        el.classList.add('bvt-price-marker--active');
        marker.openPopup();
      } else {
        el.classList.remove('bvt-price-marker--active');
      }
    });
  }, [hoveredListingUrl, markersRef, mapRef, mapLoaded]);

  // Event delegation for popup action buttons
  useEffect(() => {
    const container = document.getElementById('bali-map');
    if (!container) return;

    const handlePopupClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-action]') as HTMLElement | null;
      if (!button) return;

      e.stopPropagation();
      const action = button.getAttribute('data-action');
      const villaId = parseInt(button.getAttribute('data-villa-id') || '0');
      if (!villaId) return;

      if (action === 'favorite') {
        onToggleFavorite(villaId);
      } else if (action === 'compare') {
        if (compareSet.size >= 5 && !compareSet.has(villaId)) return;
        onToggleCompare(villaId);
      } else if (action === 'unlock') {
        const villa = listings.find((v: any) => v.id === villaId);
        if (villa) {
          if (mapRef) mapRef.closePopup();
          onUnlockVilla(villa);
        }
      }
    };

    container.addEventListener('click', handlePopupClick);
    return () => container.removeEventListener('click', handlePopupClick);
  }, [onToggleFavorite, onToggleCompare, onUnlockVilla, listings, compareSet, mapRef]);

  // Refresh open popup button states when favorites/compareSet change
  useEffect(() => {
    if (!mapRef) return;
    const popupEl = document.querySelector('.bvt-map-popup');
    if (!popupEl) return;

    const villaId = parseInt(popupEl.getAttribute('data-villa-id') || '0');
    if (!villaId) return;

    const favBtn = popupEl.querySelector('[data-action="favorite"]') as HTMLElement | null;
    const cmpBtn = popupEl.querySelector('[data-action="compare"]') as HTMLElement | null;

    if (favBtn) {
      const isFav = favorites.has(villaId);
      favBtn.style.color = isFav ? '#d4943a' : '#a0a3ad';
      favBtn.innerHTML = `<span style="font-size: 13px; line-height: 1;">${isFav ? '●' : '○'}</span> ${isFav ? 'Saved' : 'Save'}`;
    }

    if (cmpBtn) {
      const isCmp = compareSet.has(villaId);
      const cmpFull = compareSet.size >= 5 && !isCmp;
      cmpBtn.style.color = isCmp ? '#d4943a' : cmpFull ? '#4a5060' : '#a0a3ad';
      cmpBtn.style.cursor = cmpFull ? 'default' : 'pointer';
      cmpBtn.style.opacity = cmpFull ? '0.6' : '1';
      cmpBtn.textContent = `${isCmp ? '✓' : '+'} ${isCmp ? 'Selected' : 'Compare'}`;
    }
  }, [favorites, compareSet, mapRef]);

  // Resize map when panel becomes visible
  useEffect(() => {
    if (mapRef) {
      setTimeout(() => { mapRef.invalidateSize(); }, 200);
    }
  }, [mapRef]);

  return (
    <div className="bg-[color:var(--bvt-bg)] border border-[color:var(--bvt-hairline)] overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-[color:var(--bvt-hairline)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="h-px w-6 bg-[color:var(--bvt-accent)]" aria-hidden />
          <span className="label-micro">The atlas · Bali coordinates</span>
        </div>
        <div className="flex gap-4 items-center text-[9px] tracking-[0.14em] uppercase text-[color:var(--bvt-ink-dim)]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#7cc087' }}></span>
            <span className="font-mono tabular-nums normal-case tracking-normal text-[10px]">≥10%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#d4943a' }}></span>
            <span className="font-mono tabular-nums normal-case tracking-normal text-[10px]">5–10%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#6b7080' }}></span>
            <span className="font-mono tabular-nums normal-case tracking-normal text-[10px]">&lt;5%</span>
          </span>
        </div>
      </div>
      <div id="bali-map" className="flex-1" style={{ minHeight: '500px', width: '100%' }}></div>
    </div>
  );
}