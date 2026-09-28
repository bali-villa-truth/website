type ComparisonProperty = {
  priceUSD: number;
  nightlyRate: number;
  leaseYears: number;
  isFreehold: boolean;
  unsupported: boolean;
};

export function calculateComparisonScenario(
  property: ComparisonProperty,
  nightlyMultiplier: number,
  occupancyPct: number,
  expensePct: number,
) {
  const { priceUSD, nightlyRate, leaseYears, isFreehold, unsupported } = property;
  const invalidInputs = ![priceUSD, nightlyRate, nightlyMultiplier, occupancyPct, expensePct].every(Number.isFinite)
    || priceUSD <= 0 || nightlyRate <= 0 || nightlyMultiplier <= 0
    || occupancyPct < 0 || occupancyPct > 100 || expensePct < 0 || expensePct > 100;
  const unmodeled = unsupported || invalidInputs;
  const hasLeaseTerm = Number.isFinite(leaseYears) && leaseYears > 0 && leaseYears !== 999;
  const leaseTermMissing = !isFreehold && !hasLeaseTerm;
  const annualRevenue = unmodeled ? 0 : nightlyRate * nightlyMultiplier * 365 * occupancyPct / 100;
  const annualExpenses = unmodeled ? 0 : annualRevenue * expensePct / 100;
  const netRevenue = annualRevenue - annualExpenses;
  // This allowance is noncash; retain precision until presentation, not during the yield calculation.
  const leaseDepreciation = !unmodeled && !isFreehold && hasLeaseTerm ? priceUSD / leaseYears : 0;

  return {
    grossYield: unmodeled ? 0 : annualRevenue / priceUSD * 100,
    netYield: unmodeled || leaseTermMissing ? null : (netRevenue - leaseDepreciation) / priceUSD * 100,
    annualRevenue: Math.round(annualRevenue),
    annualExpenses: Math.round(annualExpenses),
    netRevenue: Math.round(netRevenue),
    leaseDepreciation: Math.round(leaseDepreciation),
    depreciationYield: unmodeled || isFreehold || leaseTermMissing ? 0 : Math.round(1000 / leaseYears) / 10,
    isFreehold,
    leaseYears: hasLeaseTerm ? leaseYears : 0,
    leaseTermMissing,
    unmodeled,
  };
}
