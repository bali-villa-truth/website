'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Ruler, Calendar, Lock, X, ShieldCheck, Info, TrendingUp, Search, AlertTriangle, Filter, DollarSign, Percent, Home, Layers, ArrowUpDown, Bed, Bath, Map, LayoutList, ShieldAlert, Eye, SlidersHorizontal, BarChart3, Check, Heart, Sun, Moon } from 'lucide-react';

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
  const [sortOption, setSortOption] = useState('roi-desc');
  const [showMap, setShowMap] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [hoveredListingUrl, setHoveredListingUrl] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, Array<{price_usd: number, recorded_at: string}>>>({});
  const [hoveredPriceBadge, setHoveredPriceBadge] = useState<number | null>(null);

  // --- DARK MODE ---
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bvt-dark-mode');
      if (saved === 'true') setDarkMode(true);
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
  const [sliderOccupancy, setSliderOccupancy] = useState(58); // percent: 20–95
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
    (villa.est_occupancy ?? 0.58) * 100;

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
    // Use dynamic calculation so flag text matches tooltip & calculator
    const dynROI = calculateDynamicROI(villa, sliderNightly, sliderOccupancy, sliderExpense);
    const grossRoi = dynROI.grossYield;
    const cashFlowYield = priceUSD > 0 ? (dynROI.netRevenue / priceUSD) * 100 : 0;

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
      const depreciationExceedsRent = annualDepreciation > dynROI.netRevenue;
      const depreciationDetail = annualDepreciation > 0
        ? depreciationExceedsRent
          ? ` Rental income (~$${dynROI.netRevenue.toLocaleString()}/yr) cannot cover lease depreciation ($${annualDepreciation.toLocaleString()}/yr).`
          : ` Lease depreciation costs $${annualDepreciation.toLocaleString()}/yr against ~$${dynROI.netRevenue.toLocaleString()}/yr net rent.`
        : '';
      flags.push({ level: 'danger', label: 'Short Lease', detail: `Only ${years} years remaining. Your asset depreciates ${years > 0 ? (100/years).toFixed(1) : '∞'}% per year toward $0.${depreciationDetail}` });
    }

    if (pipelineFlags.includes('INFLATED_ROI')) {
      const agentRate = Number(villa.agent_claimed_rate) || 0;
      const bvtRate = nightly;
      const rateContext = agentRate > 0 && agentRate > bvtRate
        ? ` The agent's claimed rate of $${agentRate}/nt was capped to $${bvtRate}/nt.`
        : '';
      flags.push({ level: 'warning', label: 'Inflated Claim', detail: `The agent marketing this property projected an unrealistic ROI (>${grossRoi.toFixed(0)}% gross). BVT audited and capped the nightly rate and occupancy to reflect realistic market maximums — the corrected cash flow yield is ~${cashFlowYield.toFixed(1)}%.${rateContext} Use this as negotiation leverage: the seller's math assumes near-zero costs and fantasy occupancy.` });
    }

    if (pipelineFlags.includes('OPTIMISTIC_ROI')) {
      flags.push({ level: 'warning', label: 'Optimistic Claim', detail: `The agent's projected ROI (~${grossRoi.toFixed(0)}% gross) is well above Bali's historical net averages. This usually means the agent is quoting Gross Yield and ignoring realistic operating expenses (${sliderExpense}%) or lease depreciation. BVT's audited cash flow yield is ~${cashFlowYield.toFixed(1)}%.` });
    }

    if (pipelineFlags.includes('RATE_PRICE_GAP')) {
      const agentRate = Number(villa.agent_claimed_rate) || 0;
      const rateShown = agentRate > 0 && agentRate > nightly
        ? ` The agent claimed $${agentRate}/nt — BVT modeled a realistic $${nightly}/nt.`
        : '';
      flags.push({ level: 'warning', label: 'Inflated Nightly Rate', detail: `The agent is claiming a nightly rate disproportionately high for a sub-$200k property. Budget builds rarely command premium luxury rates — the demographic paying $200+/nt expects finishes that cannot be built at this price point.${rateShown} BVT has modeled a rate that reflects the actual asset class.` });
    }

    // --- RATE_ADJUSTED: Pipeline significantly adjusted the nightly rate (>25% deviation from base model) ---
    // Informational — not a red flag. Tells user the rate was modeled, not just pulled from area averages.
    if (pipelineFlags.includes('RATE_ADJUSTED')) {
      const agentRate = Number(villa.agent_claimed_rate) || 0;
      const modelRate = nightly;
      const rateSource = villa.rate_source || 'model';
      const wasAuditorCapped = rateSource === 'auditor' && agentRate > 0 && modelRate < agentRate;
      const detailText = wasAuditorCapped
        ? `BVT adjusted the nightly rate from $${agentRate}/nt (agent-claimed) to $${modelRate}/nt. The original rate implied a gross yield above safe market limits, so BVT capped it to protect the ROI projection.`
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
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 md:p-8 ${darkMode ? 'dark' : ''}`}>

      {/* HEADER */}
      <header className="relative max-w-7xl mx-auto mb-6">
        <button onClick={() => setDarkMode(!darkMode)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title={darkMode ? 'Light mode' : 'Dark mode'}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="text-center mb-4 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-1 md:mb-2">
            Bali Villa <span className="text-blue-600 dark:text-blue-400">Truth</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-xs md:text-sm leading-relaxed">
            Independent ROI auditing for serious investors. We verify the data agents hide.
            </p>
        </div>
        
        {/* FILTER DASHBOARD */}
        <div className="bg-white dark:bg-slate-900 p-3 md:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">

            {/* Mobile filter toggle */}
            <div className="flex md:hidden items-center justify-between mb-2">
              <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Filter size={14} /> Filters & Sort
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">{processedListings.length} results</span>
              </button>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="text-xs bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium rounded-lg px-2 py-1.5 outline-none">
                <option value="roi-desc">ROI: High → Low</option>
                <option value="roi-asc">ROI: Low → High</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>

            {/* ROW 1: Core Filters (hidden on mobile unless toggled) */}
            <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
                <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hidden md:block" />
                    <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors">
                        <option value="All">All Locations</option>
                        <option value="Canggu">Canggu</option>
                        <option value="Pererenan">Pererenan</option>
                        <option value="Berawa">Berawa</option>
                        <option value="Uluwatu">Uluwatu</option>
                        <option value="Bingin">Bingin</option>
                        <option value="Sanur">Sanur</option>
                        <option value="Seseh">Seseh</option>
                    </select>
                </div>
                <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hidden md:block" />
                    <select value={filterPrice} onChange={(e) => setFilterPrice(Number(e.target.value))} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors">
                        <option value={10000000}>Max Price</option>
                        <option value={200000}>&lt; $200k USD</option>
                        <option value={350000}>&lt; $350k USD</option>
                        <option value={500000}>&lt; $500k USD</option>
                        <option value={1000000}>&lt; $1M USD</option>
                    </select>
                </div>
                <div className="relative">
                    <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hidden md:block" />
                    <select value={filterRoi} onChange={(e) => setFilterRoi(Number(e.target.value))} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors">
                        <option value={-99}>All ROI</option>
                        <option value={0}>0%+</option>
                        <option value={5}>5%+</option>
                        <option value={10}>10%+</option>
                        <option value={15}>15%+</option>
                        <option value={20}>20%+</option>
                    </select>
                </div>
                <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hidden md:block" />
                    <select value={filterLeaseType} onChange={(e) => setFilterLeaseType(e.target.value)} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors">
                        <option value="All">All Status</option>
                        <option value="Freehold">Freehold (Hak Milik)</option>
                        <option value="Leasehold">Leasehold (Hak Sewa)</option>
                    </select>
                </div>
                <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hidden md:block" />
                    <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors" title="Show all prices in this currency">
                        <option value="IDR">Show prices in IDR</option>
                        <option value="USD">Show prices in USD</option>
                        <option value="AUD">Show prices in AUD</option>
                        <option value="EUR">Show prices in EUR</option>
                        <option value="SGD">Show prices in SGD</option>
                    </select>
                </div>
                {/* SORTING - Prominent */}
                <div className="relative col-span-2 md:col-span-3 lg:col-span-1">
                    <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 hidden md:block" />
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium rounded-lg text-sm outline-none cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                        <option value="roi-desc">ROI: High → Low</option>
                        <option value="roi-asc">ROI: Low → High</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                        <option value="psm-asc">Price/m²: Low → High</option>
                        <option value="psm-desc">Price/m²: High → Low</option>
                    </select>
                </div>
            </div>

            {/* ROW 2: Detail Filters */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 w-full sm:w-auto">
                    <Bed size={14} className="text-slate-400 dark:text-slate-500" />
                    <select value={filterBeds} onChange={(e) => setFilterBeds(Number(e.target.value))} className="bg-transparent text-sm outline-none w-full sm:w-auto dark:text-slate-200">
                        <option value={0}>Any Beds</option>
                        <option value={1}>1+ Beds</option>
                        <option value={2}>2+ Beds</option>
                        <option value={3}>3+ Beds</option>
                        <option value={4}>4+ Beds</option>
                        <option value={5}>5+ Beds</option>
                    </select>
                </div>
                
                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 w-full sm:w-auto">
                    <Bath size={14} className="text-slate-400 dark:text-slate-500" />
                    <select value={filterBaths} onChange={(e) => setFilterBaths(Number(e.target.value))} className="bg-transparent text-sm outline-none w-full sm:w-auto dark:text-slate-200">
                        <option value={0}>Any Baths</option>
                        <option value={1}>1+ Baths</option>
                        <option value={2}>2+ Baths</option>
                        <option value={3}>3+ Baths</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 w-full sm:w-auto">
                    <Ruler size={14} className="text-slate-400 dark:text-slate-500" />
                    <input type="number" placeholder="Min Land m²" value={filterLandSize === 0 ? '' : filterLandSize} onChange={(e) => setFilterLandSize(Number(e.target.value))} className="bg-transparent text-sm outline-none w-24 placeholder-slate-500 dark:text-slate-200 dark:placeholder-slate-400" />
                </div>

                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 w-full sm:w-auto">
                    <Layers size={14} className="text-slate-400 dark:text-slate-500" />
                    <input type="number" placeholder="Min Build m²" value={filterBuildSize === 0 ? '' : filterBuildSize} onChange={(e) => setFilterBuildSize(Number(e.target.value))} className="bg-transparent text-sm outline-none w-24 placeholder-slate-500 dark:text-slate-200 dark:placeholder-slate-400" />
                </div>

                <button
                    onClick={() => {setFilterLocation('All'); setFilterPrice(10000000); setFilterRoi(-99); setFilterLandSize(0); setFilterBuildSize(0); setFilterBeds(0); setFilterBaths(0); setFilterLeaseType('All'); setSortOption('roi-desc'); setShowFavoritesOnly(false);}}
                    className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium px-2 py-2"
                >
                    Reset All
                </button>
            </div>
            </div>{/* end mobile collapsible wrapper */}
        </div>
      </header>

      {/* RESULTS BAR */}
      <div className={`${showMap ? 'max-w-[100rem]' : 'max-w-7xl'} mx-auto mb-4 flex flex-wrap justify-between items-center gap-2 px-2 transition-all`}>
         <div className="flex items-center gap-2">
           <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:block">Showing {processedListings.length} Properties</p>
           <button
             onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
             className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
               showFavoritesOnly
                 ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'
                 : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 hover:text-red-500 dark:hover:text-red-400'
             }`}
           >
             <Heart size={10} className={showFavoritesOnly ? 'fill-red-500' : ''} /> Saved ({favorites.size})
           </button>
           {showFavoritesOnly && favorites.size > 0 && compareSet.size === 0 && !showCompare && (
             <button
               onClick={() => {
                 const batch = Array.from(favorites).slice(0, 5);
                 setCompareSet(new Set(batch));
                 setShowCompare(true);
                 setSliderNightly(1.0); setSliderOccupancy(58); setSliderExpense(40);
               }}
               className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
             >
               <SlidersHorizontal size={10} /> Compare Saved
             </button>
           )}
         </div>
         <div className="flex gap-2 md:gap-4 items-center">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded border border-amber-200 dark:border-amber-900">
                <ShieldAlert size={10}/> {flaggedCount} Flagged
            </div>
            <button onClick={() => setShowMap(!showMap)} className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showMap ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-600 dark:hover:text-slate-400'}`}>
              <Map size={12} /> {showMap ? 'Hide Map' : 'Show Map'}
            </button>
         </div>
      </div>

      {/* MOBILE VIEW TOGGLE: List / Map */}
      <div className="md:hidden max-w-7xl mx-auto mb-3 px-1">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button onClick={() => setMobileView('list')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${mobileView === 'list' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
            <LayoutList size={13} /> List
          </button>
          <button onClick={() => setMobileView('map')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${mobileView === 'map' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
            <Map size={13} /> Map
          </button>
        </div>
      </div>

      {/* MOBILE MAP VIEW */}
      {mobileView === 'map' && (
        <div className="md:hidden max-w-7xl mx-auto mb-4 px-1" style={{ height: 'calc(100vh - 12rem)' }}>
          <BaliMapView listings={processedListings} displayCurrency={displayCurrency} rates={rates} hoveredListingUrl={hoveredListingUrl} favorites={favorites} compareSet={compareSet} onToggleFavorite={toggleFavorite} onToggleCompare={toggleCompare} onUnlockVilla={setSelectedVilla} darkMode={darkMode} />
        </div>
      )}

      {/* SPLIT LAYOUT: TABLE + MAP */}
      <div className={`${showMap ? 'max-w-[100rem]' : 'max-w-7xl'} mx-auto flex gap-4 transition-all`}>
      {/* MOBILE CARD VIEW */}
      <main className={`${mobileView === 'list' ? 'block' : 'hidden'} md:hidden transition-all w-full`}>
        <div className="space-y-3 px-1">
          {processedListings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 dark:text-slate-500">
              {showFavoritesOnly ? <Heart size={36} className="mx-auto mb-3 opacity-20" /> : <Filter size={36} className="mx-auto mb-3 opacity-20" />}
              <p>{showFavoritesOnly ? 'No saved properties yet. Tap the heart icon to save listings.' : 'No properties match your filters.'}</p>
            </div>
          ) : (
            processedListings.map((villa) => {
              const dynROI = calculateDynamicROI(villa, sliderNightly, sliderOccupancy, sliderExpense);
              const grossRoi = dynROI.grossYield;
              const netRoi = dynROI.netYield;
              const isFreehold = dynROI.isFreehold;
              const leaseYears = dynROI.leaseYears;
              const leaseDepreciation = dynROI.depreciationYield;
              const preDepreciationNet = dynROI.netRevenue > 0 && getPriceUSD(villa) > 0 ? (dynROI.netRevenue / getPriceUSD(villa)) * 100 : 0;
              const redFlags = getRedFlags(villa);
              const hasDanger = redFlags.some(f => f.level === 'danger');
              const hasWarning = redFlags.length > 0;
              const priceUSD = getPriceUSD(villa);

              return (
                <div key={villa.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  {/* Card Header: Image + Name + Location */}
                  <div className="flex items-start gap-3 p-3 pb-2">
                    {villa.thumbnail_url ? (
                      <img src={villa.thumbnail_url} alt="" className="w-20 h-16 object-cover rounded-lg flex-shrink-0 bg-slate-100 dark:bg-slate-800" loading="lazy" />
                    ) : (
                      <div className="w-20 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Home size={18} className="text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
                        {villa.villa_name || 'Luxury Villa'}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <MapPin size={10} className="text-blue-500 flex-shrink-0" /> {villa.location || "Bali"}
                      </div>
                      {(hasDanger || hasWarning) && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {hasDanger && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[8px] font-bold border border-red-200 flex items-center gap-0.5"><ShieldAlert size={8}/> VERIFY</span>}
                          {!hasDanger && hasWarning && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-bold border border-amber-200 flex items-center gap-0.5"><AlertTriangle size={8}/> CAUTION</span>}
                        </div>
                      )}
                    </div>
                    <button onClick={() => toggleFavorite(villa.id)} className="flex-shrink-0 p-1">
                      <Heart size={18} strokeWidth={2} className={`transition-all ${favorites.has(villa.id) ? 'text-red-500 fill-red-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                  </div>

                  {/* Card Body: Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
                    {/* Price */}
                    <div className="bg-white dark:bg-slate-900 p-2.5 text-center">
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-0.5">Price</div>
                      <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{formatPriceInCurrency(villa)}</div>
                    </div>
                    {/* ROI */}
                    <div className="bg-white dark:bg-slate-900 p-2.5 text-center">
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-0.5">Net ROI</div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        netRoi >= 12 ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400' :
                        netRoi >= 7 ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400' :
                        netRoi >= 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' :
                        'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
                      }`}>{netRoi.toFixed(1)}%</span>
                      <div className="text-[8px] text-slate-400 dark:text-slate-500 line-through mt-0.5">Gross: {grossRoi.toFixed(1)}%</div>
                    </div>
                    {/* Specs */}
                    <div className="bg-white dark:bg-slate-900 p-2.5 text-center">
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-0.5">Specs</div>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{villa.bedrooms || '?'} Bed</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 inline-flex items-center justify-center">{isFreehold ? <>Freehold<GlossaryTip term="hak_milik" /></> : leaseYears > 0 ? <>{leaseYears}yr lease<GlossaryTip term="hak_sewa" /></> : <>Leasehold<GlossaryTip term="hak_sewa" /></>}</div>
                    </div>
                  </div>

                  {/* Card Footer: Compare + nightly rate + flags + action */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                      onClick={() => toggleCompare(villa.id)}
                      disabled={!compareSet.has(villa.id) && compareSet.size >= 5}
                      className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1.5 rounded-lg border transition-all flex-shrink-0 ${
                        compareSet.has(villa.id)
                          ? 'bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white'
                          : compareSet.size >= 5
                            ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      <BarChart3 size={10} /> {compareSet.has(villa.id) ? 'Selected' : 'Compare'}
                    </button>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono text-center flex-1 min-w-0">
                      ~${getDisplayNightly(villa)}/nt • {Math.round(getDisplayOccupancy(villa))}% occ
                      {redFlags.length > 0 && (
                        <div className="flex gap-1 mt-0.5 flex-wrap justify-center">
                          {redFlags.map((flag, idx) => (
                            <span key={idx} className={`px-1 py-0.5 rounded text-[7px] font-bold ${flagBadgeClass(flag.level)}`}>
                              {flag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setSelectedVilla(villa)} className="flex items-center gap-1 bg-slate-900 hover:bg-blue-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all flex-shrink-0">
                      <Lock size={10}/> UNLOCK
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* DESKTOP TABLE */}
      <main className={`hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all ${showMap ? 'w-[60%] flex-shrink-0' : 'w-full'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                <th className="p-3 w-10 text-center"><BarChart3 size={14} className="mx-auto text-slate-400 dark:text-slate-500" /></th>
                <th className="p-3 w-10 text-center"><Heart size={14} className="mx-auto text-slate-300 dark:text-slate-600" /></th>
                <th className="p-5">Asset & Location</th>
                <th className="p-5">Price ({displayCurrency})</th>
                <th className="p-5">Price/m²</th>
                <th className="p-5 text-center">ROI Analysis</th>
                <th className="p-5">Specs</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {processedListings.length === 0 ? (
                  <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400 dark:text-slate-500">
                          {showFavoritesOnly ? <Heart size={48} className="mx-auto mb-4 opacity-20" /> : <Filter size={48} className="mx-auto mb-4 opacity-20" />}
                          {showFavoritesOnly ? 'No saved properties yet. Click the heart icon to save listings.' : 'No properties match your filters.'}
                      </td>
                  </tr>
              ) : (
                processedListings.map((villa) => {
                    const rateFactors = parseRateFactors(villa.rate_factors);
                    const redFlags = getRedFlags(villa);
                    const dynROI = calculateDynamicROI(villa, sliderNightly, sliderOccupancy, sliderExpense);
                    const grossRoi = dynROI.grossYield;
                    const netRoi = dynROI.netYield;
                    const isFreehold = dynROI.isFreehold;
                    const leaseYears = dynROI.leaseYears;
                    const leaseDepreciation = dynROI.depreciationYield; // % of purchase price
                    const preDepreciationNet = dynROI.netRevenue > 0 && getPriceUSD(villa) > 0 ? (dynROI.netRevenue / getPriceUSD(villa)) * 100 : 0; // cash flow yield %
                    const hasDanger = redFlags.some(f => f.level === 'danger');
                    const hasWarning = redFlags.length > 0;

                    return (
                    <tr key={villa.id} className={`hover:bg-blue-50/50 dark:hover:bg-blue-950/40 transition-colors group ${hoveredListingUrl === villa.url ? 'bg-blue-50/70 dark:bg-blue-950/50' : ''}`} onMouseEnter={() => setHoveredListingUrl(villa.url)} onMouseLeave={() => setHoveredListingUrl(null)}>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleCompare(villa.id)}
                            disabled={!compareSet.has(villa.id) && compareSet.size >= 5}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              compareSet.has(villa.id)
                                ? 'bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white'
                                : compareSet.size >= 5
                                  ? 'border-slate-200 dark:border-slate-700 text-slate-200 dark:text-slate-600 cursor-not-allowed'
                                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-600 text-transparent hover:text-blue-400 dark:hover:text-blue-400'
                            }`}
                            title={compareSet.has(villa.id) ? 'Remove from compare' : compareSet.size >= 5 ? 'Max 5 villas' : 'Add to compare'}
                          >
                            <Check size={12} strokeWidth={3} />
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleFavorite(villa.id)}
                            className="transition-all hover:scale-110"
                            title={favorites.has(villa.id) ? 'Remove from saved' : 'Save listing'}
                          >
                            <Heart size={16} strokeWidth={2} className={favorites.has(villa.id) ? 'text-red-500 fill-red-500' : 'text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400'} />
                          </button>
                        </td>
                        <td className="p-5">
                        <div className="flex items-center gap-3">
                          {villa.thumbnail_url ? (
                            <img src={villa.thumbnail_url} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0 bg-slate-100 dark:bg-slate-800" loading="lazy" />
                          ) : (
                            <div className="w-16 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center">
                              <Home size={16} className="text-slate-300 dark:text-slate-600" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {villa.villa_name || 'Luxury Villa'}
                                {hasDanger && <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 rounded text-[9px] font-bold border border-red-200 dark:border-red-900 flex items-center gap-0.5"><ShieldAlert size={9}/> VERIFY</span>}
                                {!hasDanger && hasWarning && <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded text-[9px] font-bold border border-amber-200 dark:border-amber-900 flex items-center gap-0.5"><AlertTriangle size={9}/> CAUTION</span>}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <MapPin size={12} className="text-blue-500" /> {villa.location || "Bali"}
                            </div>
                          </div>
                        </div>
                        </td>
                        <td className="p-5 font-mono text-slate-600 font-semibold text-sm">
                         <div className="flex items-center gap-2">
                           {formatPriceInCurrency(villa)}
                           {(() => {
                             const badge = getPriceChangeBadge(villa);
                             if (!badge.direction) return null;
                             const hasHistory = priceHistory[villa.url] && priceHistory[villa.url].length >= 1;
                             return (
                               <span className={`relative px-1.5 py-0.5 rounded text-[9px] font-bold cursor-help ${
                                 badge.direction === 'down'
                                   ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900'
                                   : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900'
                               }`}
                               onMouseEnter={() => setHoveredPriceBadge(villa.id)}
                               onMouseLeave={() => setHoveredPriceBadge(null)}>
                                 {badge.text}
                                 {hasHistory && hoveredPriceBadge === villa.id && (
                                   <PriceSparkline url={villa.url} currentPriceUsd={getPriceUSD(villa)} />
                                 )}
                               </span>
                             );
                           })()}
                         </div>
                        </td>
                        <td className="p-5 font-mono text-slate-500 dark:text-slate-400 text-xs">
                         {getPricePerSqm(villa)}
                        </td>
                        <td className="p-5">
                        <div className="flex flex-col items-center relative">
                            <div className="relative cursor-help text-center" onMouseEnter={() => setHoveredRoi(villa.id)} onMouseLeave={() => setHoveredRoi(null)}>
                            {/* BVT Adjusted ROI - the real number */}
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border flex items-center gap-1 justify-center w-fit mx-auto ${
                              netRoi >= 12 ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900' :
                              netRoi >= 7 ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900' :
                              netRoi >= 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' :
                              'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'
                            }`}>
                                Est. {netRoi.toFixed(1)}% <Eye size={10} className="opacity-50" />
                            </span>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-through opacity-60 font-mono">Gross: {grossRoi.toFixed(1)}%</p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">~${getDisplayNightly(villa)}/nt • {Math.round(getDisplayOccupancy(villa))}% occ</p>

                            {/* Pre-depreciation yield for leaseholds */}
                            {!isFreehold && leaseDepreciation > 0 && (
                              <p className="text-[9px] text-amber-500 dark:text-amber-400 font-mono mt-0.5">Before lease exp: {preDepreciationNet.toFixed(1)}%</p>
                            )}

                            {/* Red flag badges under ROI */}
                            {redFlags.length > 0 && (
                              <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                                {redFlags.map((flag, idx) => (
                                  <span key={idx} className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${flagBadgeClass(flag.level, 'bordered')}`}>
                                    {flag.label}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Enhanced tooltip with full cost breakdown */}
                            {hoveredRoi === villa.id && (
                                <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-slate-900 text-white text-[10px] rounded-lg p-3 shadow-xl pointer-events-none">
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900"></div>
                                <div className="font-bold mb-1 text-blue-400 flex items-center gap-1"><Eye size={11}/> BVT Yield Breakdown</div>
                                <div className="text-[8px] text-slate-500 mb-2 font-mono">{sliderOccupancy}% occ · {sliderExpense}% expenses · {sliderNightly !== 1.0 ? `${sliderNightly.toFixed(1)}x rate` : 'base rate'}{sliderOccupancy !== 58 || sliderExpense !== 40 || sliderNightly !== 1.0 ? ' (custom)' : ' (BVT defaults)'}</div>

                                {/* Gross vs Net comparison — the core value prop */}
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

                                {/* Cost breakdown — what BVT deducts */}
                                <div className="mb-2 pb-2 border-b border-slate-700">
                                    <div className="text-slate-500 font-bold mb-1">Operating Costs <span className="font-normal text-[8px]">(% of revenue)</span></div>
                                    {Object.entries(COST_BREAKDOWN).map(([key, cost]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-slate-400">{cost.label}</span>
                                        <span className="text-red-400 font-mono">-{(cost.rate * 100).toFixed(0)}%</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between mt-1 pt-1 border-t border-slate-700 font-bold">
                                      <span>Total Expense Load</span>
                                      <span className="text-red-400 font-mono">-{((TOTAL_COST_RATIO) * 100).toFixed(0)}% of revenue</span>
                                    </div>
                                    <div className="text-slate-500 text-[8px] mt-0.5">→ Cash Flow Yield: <span className="text-emerald-400 font-bold">{preDepreciationNet.toFixed(1)}%</span></div>
                                </div>

                                {/* Capital depreciation — separate section, different denominator */}
                                {!isFreehold && leaseDepreciation > 0 && (
                                <div className="mb-2 pb-2 border-b border-slate-700">
                                    <div className="text-orange-400 font-bold mb-1">Capital Depreciation <span className="font-normal text-[8px]">(% of purchase price)</span></div>
                                    {(() => {
                                      const depCostAnnual = leaseYears > 0 ? Math.round(getPriceUSD(villa) / leaseYears) : 0;
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
                                <p className="text-slate-500 italic text-[9px] mb-1.5">Benchmarks: leasehold 8–12% net, freehold 4–7% net.</p>
                                <p className="text-blue-400 text-[9px] font-medium flex items-center gap-1"><SlidersHorizontal size={9}/> Select villas to compare with your own assumptions →</p>
                                </div>
                            )}
                            </div>
                        </div>
                        </td>
                        <td className="p-5 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                            {/* Beds */}
                            <div className="flex items-center gap-2">
                                <Home size={12} className="text-slate-400 dark:text-slate-500"/>
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {villa.bedrooms ? `${villa.bedrooms} Bed` : '? Bed'}
                                    {villa.beds_baths && ` / ${villa.beds_baths.split('/')[1]?.trim().split(' ')[0] || '?'} Bath`}
                                </span>
                            </div>
                            
                            {/* Lease Type / Years - SMART DISPLAY: use features first, then lease_years, show years remaining for leasehold */}
                            <div className="flex items-center gap-2">
                                <Calendar size={12} className="text-slate-400 dark:text-slate-500"/>
                                {(() => {
                                    const f = (villa.features || "").trim();
                                    const years = Number(villa.lease_years) || 0;
                                    const isFreehold = f.includes("Freehold") || f.includes("Hak Milik") || years === 999;
                                    const isLeasehold = f.includes("Leasehold") || f.includes("Hak Sewa") || (years > 0 && years < 999);
                                    if (isFreehold) return <span className="font-bold text-green-600 dark:text-green-400 inline-flex items-center">Freehold (Hak Milik)<GlossaryTip term="hak_milik" /></span>;
                                    if (isLeasehold) {
                                        const label = f ? "Leasehold (Hak Sewa)" : "Leasehold";
                                        const yearsLabel = years > 0 && years < 999 ? ` – ${years} years remaining` : " – years not stated";
                                        return <span className="text-slate-700 dark:text-slate-300 inline-flex items-center">{label}<GlossaryTip term="hak_sewa" />{yearsLabel}</span>;
                                    }
                                    if (years > 0 && years < 999) return <span className="text-slate-700 dark:text-slate-300">{years} years remaining</span>;
                                    if (years === 999) return <span className="font-bold text-green-600 dark:text-green-400">Freehold</span>;
                                    return <span className="text-slate-400 dark:text-slate-500">Unverified Status</span>;
                                })()}
                            </div>

                            {/* Land Size */}
                            <div className="flex items-center gap-2">
                                <Ruler size={12} className="text-slate-400 dark:text-slate-500"/>
                                <span>Land: <span className="font-medium">{villa.land_size || '?'}</span> m²</span>
                            </div>

                            {/* Building Size - always show row; use — when missing */}
                            <div className="flex items-center gap-2">
                                <Layers size={12} className="text-slate-400 dark:text-slate-500"/>
                                <span>Build: <span className="font-medium">{villa.building_size > 0 ? `${villa.building_size} m²` : '—'}</span></span>
                            </div>
                        </td>
                        <td className="p-5 text-right">
                        <button onClick={() => setSelectedVilla(villa)} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg transition-all">
                            <Lock size={12}/> UNLOCK SOURCE
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
            onClick={() => { setShowCompare(true); setSliderNightly(1.0); setSliderOccupancy(58); setSliderExpense(40); }}
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
        const BVT_DEFAULTS = { nightly: 1.0, occupancy: 58, expense: 40 };

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
                    onClick={() => { setSliderNightly(1.0); setSliderOccupancy(58); setSliderExpense(40); }}
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

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div><span className="font-bold text-slate-700">Bali Villa Truth</span><span className="mx-2">•</span><span>Independent villa investment analysis</span></div>
          <div className="flex items-center gap-4"><a href="#" className="hover:text-blue-600 transition-colors">Contact</a><span className="text-slate-300">|</span><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-4">© 2026 Bali Villa Truth. This site provides informational analysis only.</p>
      </footer>
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
      style.textContent = `.bvt-leaflet-popup .leaflet-popup-content-wrapper { padding: 0 !important; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); background: ${darkMode ? '#0f172a' : '#f8fafc'} !important; } .bvt-leaflet-popup .leaflet-popup-content { margin: 0 !important; width: 250px !important; } .bvt-leaflet-popup .leaflet-popup-tip { background: ${darkMode ? '#0f172a' : '#f8fafc'} !important; } .bvt-leaflet-popup .leaflet-popup-close-button { z-index: 10; right: 6px !important; top: 6px !important; color: ${darkMode ? '#64748b' : '#94a3b8'} !important; font-size: 18px !important; }`;
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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OSM',
      maxZoom: 18,
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
      const roiColor = roi >= 8 ? '#16a34a' : roi >= 5 ? '#2563eb' : '#64748b';

      const marker = L.circleMarker([lat, lng], {
        radius: 5,
        fillColor: roiColor,
        color: '#fff',
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.7,
      }).addTo(mapRef);

      // Price formatting for popup
      const desc = (villa.price_description || '').trim();
      const priceMatch = desc.match(/^(IDR|USD|AUD|EUR|SGD)\s*([\d,.\s]+)/i);
      let priceStr = '';
      if (priceMatch) {
        const amount = parseFloat(priceMatch[2].replace(/\s|,/g, '')) || 0;
        const cur = priceMatch[1].toUpperCase();
        const r = rates[cur];
        const priceUSD = cur === 'USD' ? amount : (r && r > 0 ? amount / r : amount);
        const displayVal = displayCurrency === 'USD' ? priceUSD : priceUSD * (rates[displayCurrency] || 1);
        priceStr = `${displayCurrency} ${Math.round(displayVal).toLocaleString()}`;
      } else {
        const p = Number(villa.last_price) || 0;
        const priceUSD = p >= 1e6 ? p / (rates['IDR'] || 16782) : p;
        const displayVal = displayCurrency === 'USD' ? priceUSD : priceUSD * (rates[displayCurrency] || 1);
        priceStr = `${displayCurrency} ${Math.round(displayVal).toLocaleString()}`;
      }

      const isFav = favorites.has(villa.id);
      const isCmp = compareSet.has(villa.id);
      const cmpFull = compareSet.size >= 5 && !isCmp;

      const bgColor = darkMode ? '#1e293b' : '#f8fafc';
      const borderColor = darkMode ? '#475569' : '#e2e8f0';
      const textColor = darkMode ? '#e2e8f0' : '#1e293b';
      const mutedColor = darkMode ? '#94a3b8' : '#475569';
      const roiBg = darkMode
        ? (roi >= 8 ? '#064e3b' : roi >= 5 ? '#082f49' : '#1e293b')
        : (roi >= 8 ? '#f0fdf4' : roi >= 5 ? '#eff6ff' : '#f8fafc');

      marker.bindPopup(`
        <div class="bvt-map-popup" data-villa-id="${villa.id}" style="font-family: system-ui, -apple-system, sans-serif;">
          <div style="padding: 10px 12px 8px; border-bottom: 1px solid ${borderColor};">
            <div style="font-weight: 700; font-size: 13px; color: ${textColor}; line-height: 1.3; word-wrap: break-word;">${(villa.villa_name || 'Villa').substring(0, 50)}</div>
            <div style="font-size: 11px; color: ${mutedColor}; margin-top: 2px; font-weight: 500;">${villa.location || 'Bali'} · ${villa.bedrooms || '?'} bed${villa.bathrooms ? ' · ' + villa.bathrooms + ' bath' : ''}</div>
          </div>
          <div style="padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${borderColor};">
            <div style="font-weight: 600; font-size: 13px; color: ${textColor};">${priceStr}</div>
            <div style="font-size: 12px; font-weight: 700; color: ${roiColor}; background: ${roiBg}; padding: 2px 8px; border-radius: 99px;">${roi.toFixed(1)}%</div>
          </div>
          <div style="display: flex; gap: 6px; padding: 10px 12px; background: ${bgColor};">
            <button data-action="favorite" data-villa-id="${villa.id}" style="flex: 1; padding: 8px 4px; border: 1px solid ${isFav ? '#f43f5e' : darkMode ? '#475569' : '#cbd5e1'}; border-radius: 6px; background: ${isFav ? (darkMode ? '#7f1d1d' : '#ffe4e6') : darkMode ? '#334155' : 'white'}; font-size: 10px; font-weight: 600; color: ${isFav ? (darkMode ? '#fca5ce' : '#e11d48') : darkMode ? '#cbd5e1' : '#64748b'}; cursor: pointer; text-align: center; line-height: 1.3;">${isFav ? '♥ Saved' : '♡ Save'}</button>
            <button data-action="compare" data-villa-id="${villa.id}" style="flex: 1; padding: 8px 4px; border: 1px solid ${isCmp ? (darkMode ? '#1e40af' : '#2563eb') : cmpFull ? (darkMode ? '#475569' : '#e2e8f0') : darkMode ? '#475569' : '#cbd5e1'}; border-radius: 6px; background: ${isCmp ? (darkMode ? '#1e3a8a' : '#dbeafe') : darkMode ? '#334155' : 'white'}; font-size: 10px; font-weight: 600; color: ${isCmp ? (darkMode ? '#93c5fd' : '#2563eb') : cmpFull ? (darkMode ? '#64748b' : '#94a3b8') : darkMode ? '#cbd5e1' : '#64748b'}; cursor: ${cmpFull ? 'default' : 'pointer'}; text-align: center; line-height: 1.3; ${cmpFull ? 'opacity: 0.5;' : ''}">${isCmp ? '✓ Selected' : 'Compare'}</button>
            <button data-action="unlock" data-villa-id="${villa.id}" style="flex: 1; padding: 8px 4px; border: 1px solid ${darkMode ? '#475569' : '#334155'}; border-radius: 6px; background: ${darkMode ? '#334155' : '#1e293b'}; font-size: 10px; font-weight: 600; color: white; cursor: pointer; text-align: center; line-height: 1.3;">🔒 Unlock</button>
          </div>
        </div>
      `, { closeButton: true, className: 'bvt-leaflet-popup' });

      if (villa.url) newMarkers[villa.url] = marker;
      markerCluster.push(marker);
    });

    setMarkersRef(newMarkers);
  }, [mapRef, mapLoaded, listings, displayCurrency, rates, favorites, compareSet]);

  // Highlight marker on hover
  useEffect(() => {
    if (!mapRef || !mapLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    Object.entries(markersRef).forEach(([url, marker]) => {
      if (url === hoveredListingUrl) {
        marker.setStyle({ radius: 10, weight: 3, fillOpacity: 1 });
        marker.openPopup();
      } else {
        marker.setStyle({ radius: 5, weight: 1, fillOpacity: 0.7 });
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
      favBtn.style.borderColor = isFav ? '#f43f5e' : darkMode ? '#475569' : '#cbd5e1';
      favBtn.style.background = isFav ? (darkMode ? '#7f1d1d' : '#ffe4e6') : darkMode ? '#334155' : 'white';
      favBtn.style.color = isFav ? (darkMode ? '#fca5ce' : '#e11d48') : darkMode ? '#cbd5e1' : '#64748b';
      favBtn.textContent = isFav ? '♥ Saved' : '♡ Save';
    }

    if (cmpBtn) {
      const isCmp = compareSet.has(villaId);
      const cmpFull = compareSet.size >= 5 && !isCmp;
      cmpBtn.style.borderColor = isCmp ? (darkMode ? '#1e40af' : '#2563eb') : cmpFull ? (darkMode ? '#475569' : '#e2e8f0') : darkMode ? '#475569' : '#cbd5e1';
      cmpBtn.style.background = isCmp ? (darkMode ? '#1e3a8a' : '#dbeafe') : darkMode ? '#334155' : 'white';
      cmpBtn.style.color = isCmp ? (darkMode ? '#93c5fd' : '#2563eb') : cmpFull ? (darkMode ? '#64748b' : '#94a3b8') : darkMode ? '#cbd5e1' : '#64748b';
      cmpBtn.style.opacity = cmpFull ? '0.5' : '1';
      cmpBtn.textContent = isCmp ? '✓ Selected' : 'Compare';
    }
  }, [favorites, compareSet, mapRef]);

  // Resize map when panel becomes visible
  useEffect(() => {
    if (mapRef) {
      setTimeout(() => { mapRef.invalidateSize(); }, 200);
    }
  }, [mapRef]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Map size={14} className="text-blue-500" /> Property Map
        </div>
        <div className="flex gap-2 text-[9px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span> ≥15%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span> 10-15%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span> &lt;10%</span>
        </div>
      </div>
      <div id="bali-map" className="flex-1" style={{ minHeight: '500px', width: '100%' }}></div>
    </div>
  );
}
