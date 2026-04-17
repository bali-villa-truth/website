/**
 * /api/subscribe — Newsletter signup (#18).
 *
 * Saves the email as a row in the leads table with lead_type='Newsletter'.
 * Keeps schema simple: no new table required. Downstream weekly-digest
 * cron (future) can query leads where lead_type='Newsletter'.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 15;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const source = String(body.source || "homepage").slice(0, 64);

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save subscriber row; ignore duplicate email errors.
    const { error: insertErr } = await supabase.from("leads").insert({
      email,
      lead_type: "Newsletter",
      source_page: source,
    });
    if (insertErr && !String(insertErr.message || "").includes("duplicate")) {
      console.error("subscribe insert error:", insertErr);
    }

    // Best-effort welcome email via Resend. Never block the response on it.
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (resendKey && fromEmail) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: `${process.env.RESEND_FROM_NAME || "Bali Villa Truth"} <${fromEmail}>`,
          to: email,
          subject: "You're on the Bali Villa Truth weekly list",
          text:
            "Thanks for subscribing.\n\n" +
            "Every Monday we'll send you the week's most interesting audits — price drops, new red flags, and the occasional deep-dive on a listing that looked great until we ran the numbers.\n\n" +
            "Reply to this email any time with feedback, audit requests, or questions.\n\n" +
            "— Bali Villa Truth\nhttps://balivillatruth.com",
          html:
            `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b;line-height:1.6;">
               <h2 style="color:#d4943a;margin:0 0 12px;">You're on the weekly list</h2>
               <p>Thanks for subscribing.</p>
               <p>Every Monday we send the week's most interesting audits — price drops, new red flags, and the occasional deep-dive on a listing that looked great until we ran the numbers.</p>
               <p>Reply any time with feedback or audit requests.</p>
               <p style="color:#64748b;font-size:12px;margin-top:24px;">— Bali Villa Truth<br/><a href="https://balivillatruth.com" style="color:#d4943a;">balivillatruth.com</a></p>
             </div>`,
        });
      } catch (e) {
        console.error("subscribe welcome email failed (non-fatal):", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("subscribe route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
