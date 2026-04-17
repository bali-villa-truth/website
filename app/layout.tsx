import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import StickyNav from "./_components/StickyNav";
import SiteFooter from "./_components/SiteFooter";

const GA_MEASUREMENT_ID = "G-M9FF8B9Y9E";

// Sans body type — precise, modern, warm (Stripe/Linear feel).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Mono for numbers — data-as-art (Bloomberg / Stripe dashboards).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Serif display — editorial authority (The Modern House, FT, Aesop).
// Optical sizing gives tight display at headline sizes, open shapes at body.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "opsz"],
});

const SITE_URL = "https://balivillatruth.com";
const SITE_NAME = "Bali Villa Truth";
const SITE_DESCRIPTION =
  "Independent ROI audits for Bali villa investors. Stress-test asking prices with real market data — net yield calculations, occupancy estimates, lease decay analysis, and red-flag detection across 2,000+ listings.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Bali Villa Truth — Independent ROI Audits for Villa Investors",
    template: "%s | Bali Villa Truth",
  },

  description: SITE_DESCRIPTION,

  keywords: [
    "bali villa ROI",
    "bali villa investment",
    "buy villa bali",
    "bali property yield",
    "bali villa net yield",
    "bali villa leasehold",
    "bali villa freehold",
    "bali villa occupancy",
    "canggu villa investment",
    "uluwatu villa investment",
    "seminyak villa investment",
    "bali villa management fees",
    "bali villa due diligence",
    "bali villa price per square meter",
    "bali real estate analysis",
  ],

  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Bali Villa Truth — Independent ROI Audits for Villa Investors",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Bali Villa Truth — Stress-tested net yields for 2,000+ Bali villas",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Bali Villa Truth — Independent ROI Audits for Villa Investors",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: SITE_URL,
  },

  verification: {
    google: "rwbzaf-z_avy0fphlJvrIks00G2rJTU8jbhrN-5yQ0I",
  },
};

// JSON-LD structured data — rendered in <head> for crawlers
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/?location={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
      description:
        "Independent real estate analysis platform providing stress-tested ROI audits for Bali villa investments.",
      sameAs: [],
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: "Bali Villa Truth — Independent ROI Audits for Villa Investors",
      description: SITE_DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: {
        "@type": "Service",
        name: "Bali Villa Net Yield Audit",
        description:
          "Standardized net yield calculations for Bali villa listings using conservative assumptions, market-rate benchmarks, and lease decay analysis.",
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: {
          "@type": "Place",
          name: "Bali, Indonesia",
        },
        serviceType: "Real Estate Investment Analysis",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-[#0a0e16] text-[#e8e4dc] selection:bg-[#d4943a]/30 selection:text-[#f5f0e6]`}
      >
        <StickyNav />
        {children}
        <SiteFooter />

        {/* Google Analytics (GA4) — loads after page interactive, non-blocking */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  );
}
