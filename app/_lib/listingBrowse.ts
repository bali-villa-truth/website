type ListingYield = {
  projected_roi?: number | string | null;
  est_nightly_rate?: number | string | null;
  rate_source?: string | null;
  flags?: string | null;
};

export function getPipelineFlags(listing: { flags?: string | null }): string[] {
  return (listing.flags || "").split(",").map((flag) => flag.trim()).filter(Boolean);
}

export function isRoiUnmodeled(listing: ListingYield): boolean {
  const source = String(listing.rate_source || "").toLowerCase();
  const flags = getPipelineFlags(listing);
  return !source.startsWith("bvt_market_model")
    || listing.projected_roi == null
    || String(listing.projected_roi).trim() === ""
    || !Number.isFinite(Number(listing.projected_roi))
    || !Number.isFinite(Number(listing.est_nightly_rate))
    || Number(listing.est_nightly_rate) <= 0
    || flags.includes("BEDROOM_COUNT_NOT_STATED")
    || flags.includes("NON_BALI_LOCATION")
    || flags.includes("MULTI_UNIT_MODEL_UNSUPPORTED");
}

export function modeledNetYield(listing: ListingYield): number | null {
  return isRoiUnmodeled(listing) ? null : Number(listing.projected_roi);
}

export function pricePerLandSqm(priceUsd: number, landSize: number | string | null | undefined): number | null {
  const area = Number(landSize);
  return Number.isFinite(priceUsd) && priceUsd > 0 && Number.isFinite(area) && area > 0
    ? priceUsd / area
    : null;
}

export function compareKnownNumbers(a: number | null, b: number | null, descending = false): number {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return descending ? b - a : a - b;
}
