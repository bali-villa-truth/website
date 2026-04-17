import Link from "next/link";

/**
 * BvtSeal — the Bali Villa Truth audit-bureau seal.
 *
 * Evokes a notarial stamp / SEC insignia but drawn with editorial restraint:
 * deep-navy negative space, single gold accent, Fraunces serif monogram
 * centered in the mark, monospace micro-text around the ring.
 *
 * Pure SVG — safe to use in both server and client components.
 * Rendered standalone (favicon, nav, small chrome) or paired with the wordmark
 * via BvtLockup for mastheads.
 */
export function BvtSeal({
  size = 56,
  className = "",
  showRingText = true,
}: {
  size?: number;
  className?: string;
  /** Hide the "BALI · VILLA · TRUTH" arc text. Use for very small renders where it becomes noise. */
  showRingText?: boolean;
}) {
  const gold = "var(--bvt-accent, #d4943a)";
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Bali Villa Truth — Independent Audit Bureau seal"
    >
      <defs>
        {/* Arc for top micro-text (reads L→R across top) */}
        <path id="bvt-seal-top" d="M 8 50 A 42 42 0 0 1 92 50" fill="none" />
        {/* Arc for bottom micro-text (reads L→R across bottom) */}
        <path id="bvt-seal-bot" d="M 8 50 A 42 42 0 0 0 92 50" fill="none" />
      </defs>

      {/* Outer hairline ring */}
      <circle cx="50" cy="50" r="48" fill="none" stroke={gold} strokeWidth="0.6" />
      {/* Inner hairline ring — creates a ~6-unit channel for the micro-text */}
      <circle cx="50" cy="50" r="38" fill="none" stroke={gold} strokeWidth="0.4" opacity="0.5" />

      {showRingText && (
        <>
          {/* Top arc: organization name */}
          <text
            fontSize="5"
            letterSpacing="2.3"
            fill={gold}
            fontFamily="var(--font-mono, ui-monospace, 'SF Mono', Menlo, monospace)"
            fontWeight="500"
          >
            <textPath href="#bvt-seal-top" startOffset="50%" textAnchor="middle">
              BALI · VILLA · TRUTH
            </textPath>
          </text>

          {/* Bottom arc: establishment year in Roman numerals */}
          <text
            fontSize="4.4"
            letterSpacing="3"
            fill={gold}
            fontFamily="var(--font-mono, ui-monospace, 'SF Mono', Menlo, monospace)"
            fontWeight="500"
            opacity="0.85"
          >
            <textPath href="#bvt-seal-bot" startOffset="50%" textAnchor="middle">
              EST · MMXXVI
            </textPath>
          </text>

          {/* Dot ornaments at 9- and 3-o'clock — separate top/bottom arc text */}
          <circle cx="5.2" cy="50" r="0.9" fill={gold} />
          <circle cx="94.8" cy="50" r="0.9" fill={gold} />
        </>
      )}

      {/* Subtle hairlines flanking the monogram — frames "BVT" as a plaque */}
      <line x1="30" y1="35" x2="70" y2="35" stroke={gold} strokeWidth="0.4" opacity="0.45" />
      <line x1="30" y1="65" x2="70" y2="65" stroke={gold} strokeWidth="0.4" opacity="0.45" />

      {/* Central monogram — Fraunces serif, the voice of the brand */}
      <text
        x="50"
        y="57.5"
        textAnchor="middle"
        fontSize="22"
        fill={gold}
        fontFamily="var(--font-display, 'Fraunces', Georgia, 'Times New Roman', serif)"
        fontWeight="400"
        letterSpacing="-0.5"
      >
        BVT
      </text>
    </svg>
  );
}

/**
 * BvtLockup — mark + wordmark. Default horizontal layout.
 * Wordmark is "Bali Villa Truth" in Fraunces; optional deck reads as the
 * registry status line. Pass `href` to make it a link back to home.
 */
export function BvtLockup({
  size = 52,
  showDeck = true,
  className = "",
  href,
  wordmarkClassName = "",
}: {
  size?: number;
  showDeck?: boolean;
  className?: string;
  href?: string;
  wordmarkClassName?: string;
}) {
  const inner = (
    <span className={`inline-flex items-center gap-3.5 md:gap-4 ${className}`}>
      <BvtSeal size={size} showRingText={size >= 36} />
      <span className="flex flex-col gap-0.5">
        <span
          className={`font-display text-[color:var(--bvt-ink)] leading-[1] tracking-[-0.01em] ${wordmarkClassName}`}
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          Bali Villa Truth
        </span>
        {showDeck && (
          <span className="label-micro text-[color:var(--bvt-ink-dim)]">
            Independent audit bureau · Est. 2026
          </span>
        )}
      </span>
    </span>
  );
  if (href) {
    return (
      <Link
        href={href}
        aria-label="Bali Villa Truth — home"
        className="inline-flex items-center no-underline group/bvtlockup"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
