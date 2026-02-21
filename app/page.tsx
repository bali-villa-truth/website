'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Ruler, Calendar, Lock, X, ShieldCheck, Info, TrendingUp, Search, AlertTriangle, Filter, DollarSign, Percent, Home, Layers, ArrowUpDown, Bed, Bath, Map, LayoutList, ShieldAlert, Eye, SlidersHorizontal, BarChart3, Check } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FALLBACK_RATES: Record<string, number> = { USD: 1, IDR: 16782, AUD: 1.53, EUR: 0.92, SGD: 1.34 };

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
  const [filterRoi, setFilterRoi] = useState(0);
  const [filterLandSize, setFilterLandSize] = useState(0);
  const [filterBuildSize, setFilterBuildSize] = useState(0);
  const [filterBeds, setFilterBeds] = useState(0);
  const [filterBaths, setFilterBaths] = useState(0);
  const [filterLeaseType, setFilterLeaseType] = useState('All');
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD'); // Show all prices in this currency
  const [sortOption, setSortOption] = useState('roi-desc');
  const [showMap, setShowMap] = useState(false);
  const [hoveredListingUrl, setHoveredListingUrl] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, Array<{price_usd: number, recorded_at: string}>>>({});
  const [hoveredPriceBadge, setHoveredPriceBadge] = useState<number | null>(null);

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
| 0) >= filterLandSize;
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
      return matchLocation && matchPrice && matchRoi && matchLand && matchBuild && matchBeds && matchBaths && matchLease;
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
  }, [listings, filterLocation, filterPrice, filterRoi, filterLandSize, filterBuildSize, filterBeds, filterBaths, filterLeaseType, sortOption, rates]);

  const handleLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('leads').insert([
      { email, villa_id: selectedVilla.id, villa_name: selectedVilla.villa_name, lead_type: 'Unlock Audit' }
    ]);
    if (!error) {
      window.open(selectedVilla.url, '_blank');
      setSelectedVilla(null);
      setEmail('');
      setLeadCount(prev => prev + 1);
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

  const calculateNetROI = (villa: any): { netRoi: number; leaseDepreciation: number; grossRoi: number } => {
    // projected_roi from pipeline = ALREADY net after 40% expenses + lease penalty
    // This is the BVT stress-tested number — display it directly
    const netRoi = villa.projected_roi || 0;

    // Back-calculate gross ROI for "Agent Claims" display
    // gross = nightly_rate × 365 × occupancy / price × 100
    const priceUSD = getPriceUSD(villa);
    const nightly = villa.est_nightly_rate || getDisplayNightly(villa);
    const occupancy = villa.est_occupancy || getDisplayOccupancy(villa) / 100;
    const grossRoi = priceUSD > 0 ? ((nightly * 365 * occupancy) / priceUSD) * 100 : 0;

    // Leasehold depreciation — ONLY show when pipeline actually deducts it (short leases < 15 years)
    // For leases >= 15 years, depreciation is NOT deducted from projected_roi, so showing it would mislead users
    const features = (villa.features || '').toLowerCase();
    const years = Number(villa.lease_years) || 0;
    const isFreehold = features.includes('freehold') || features.includes('hak milik') || years === 999;
    let leaseDepreciation = 0;
    if (!isFreehold && years > 0 && years < 15) {
      leaseDepreciation = (1 / years) * 100;
    }

    return {
      netRoi: Math.max(netRoi, -10),
      leaseDepreciation,
      grossRoi: Math.min(grossRoi, 50), // cap display at 50% to avoid absurd numbers
    };
  };

  // --- DYNAMIC ROI: User-adjustable calculation for compare panel ---
  const calculateDynamicROI = (villa: any, nightlyMultiplier: number, occupancyPct: number, expensePct: number) => {
    const priceUSD = getPriceUSD(villa);
    if (priceUSD <= 0) return { grossYield: 0, netYield: 0, annualRevenue: 0, annualExpenses: 0, netRevenue: 0 };

    const baseNightly = villa.est_nightly_rate || getDisplayNightly(villa);
    const adjustedNightly = baseNightly * nightlyMultiplier;
    const occupancy = occupancyPct / 100;
    const annualRevenue = adjustedNightly * 365 * occupancy;
    const annualExpenses = annualRevenue * (expensePct / 100);
    const netRevenue = annualRevenue - anualExpenses;
    const grossYield = (anualRevenue / priceUSD) * 100;
    let netYield = (netRevenue / priceUSD) * 100;

    // Lease depreciation for short leases
    const features = (villa.features || '').toLowerCase();
    const years = Number(villa.lease_years) || 0;
    const isFreehold = features.includes('freehold') || features.includes('hak milik') || years === 999;
    if (!isFreehold && years > 0 && years < 15) {
      netYield -= (1 / years) * 100;
    }

    return {
      grossYield: Math.min(grossYield, 80),
      netYield: Math.max(netYield, -20),
      anvualRevenue: Math.round(anualRevenue),
      anualExpenses: Math.round(anuualExpenses),
      netRevenue: Math.round(netRevenue),
    };
  };