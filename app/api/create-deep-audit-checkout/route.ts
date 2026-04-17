/**
 * /api/create-deep-audit-checkout
 *
 * Creates a Stripe Checkout Session for the $49 Deep Audit upgrade and
 * returns the hosted-checkout URL. The listing-page CTA POSTs here with
 * { villa_id, email } — we attach both to session.metadata so the
 * /api/generate-deep-audit route (called after payment) can look them up
 * from session_id alone.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY          — sk_live_... or sk_test_...
 *   STRIPE_DEEP_AUDIT_PRICE_ID — price_... (for the $49 product)
 *   NEXT_PUBLIC_SITE_URL       — https://balivillatruth.com (used for redirects)
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { villa_id, email, villa_name, slug } = body as {
      villa_id?: number;
      email?: string;
      villa_name?: string;
      slug?: string;
    };

    if (!villa_id || !email) {
      return NextResponse.json(
        { error: "villa_id and email are required" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_DEEP_AUDIT_PRICE_ID;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://balivillatruth.com";

    if (!secret || !priceId) {
      return NextResponse.json(
        { error: "Payments not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: {
        villa_id: String(villa_id),
        email,
        villa_name: (villa_name || "").slice(0, 120),
        slug: (slug || "").slice(0, 120),
        product: "deep_audit_v1",
      },
      // payment_intent metadata mirrors session metadata — useful for
      // post-hoc reconciliation via Stripe dashboard.
      payment_intent_data: {
        metadata: {
          villa_id: String(villa_id),
          email,
        },
      },
      success_url: `${siteUrl}/deep-audit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: slug
        ? `${siteUrl}/listing/${slug}?deep_audit=canceled`
        : `${siteUrl}/?deep_audit=canceled`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("create-deep-audit-checkout error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
