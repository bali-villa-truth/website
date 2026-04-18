'use client';

/**
 * ThumbImg — tiny client wrapper around <img> that swaps to the BVT branded
 * placeholder when the source 404s or fails to decode. Used inside server
 * components (listing detail, area pages) where onError handlers can't be
 * passed directly. Keep this component dumb — no state, just an event hook.
 *
 * The placeholder itself lives at /public/villa-placeholder.svg.
 */
export default function ThumbImg({
  src,
  alt,
  className,
  eager,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      onError={(e) => {
        const t = e.currentTarget;
        if (!t.dataset.fellback) {
          t.dataset.fellback = '1';
          t.src = '/villa-placeholder.svg';
        }
      }}
    />
  );
}
