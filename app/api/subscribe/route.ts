/**
 * /api/subscribe — Newsletter signup (#18).
 *
 * Saves the email as a row in the leads table with lead_type='Newsletter'.
 * A success response confirms persistence, not inbox delivery.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 15;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAVE_ERROR = "We couldn't confirm your signup. Please try again later.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const source = body && typeof body.source === "string" ? body.source.trim().slice(0, 64) || "homepage" : "homepage";

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
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
        { ok: false, error: SAVE_ERROR },
        { status: 503 }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // A duplicate is not proof of a newsletter record or verified consent.
    const { error: insertErr } = await supabase.from("leads").insert({
      email,
      lead_type: "Newsletter",
      source_page: source,
    });
    if (insertErr) {
      console.error("Newsletter signup persistence was not confirmed.");
      return NextResponse.json({ ok: false, error: SAVE_ERROR }, { status: 503 });
    }

    let welcomeEmailStatus: "accepted" | "not_confirmed" = "not_confirmed";
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (resendKey && fromEmail) {
      try {
        const resend = new Resend(resendKey);
        const result = await resend.emails.send({
          from: `${process.env.RESEND_FROM_NAME || "Bali Villa Truth"} <${fromEmail}>`,
          to: email,
          subject: "Bali Villa Truth research update signup",
          text:
            "Your research update signup was recorded.\n\n" +
            "You asked for Bali Villa Truth research updates when available. There is no fixed delivery schedule. This signup is separate from requesting an audit PDF.\n\n" +
            "To request removal from the newsletter list, email audits@balivillatruth.com from this address with the subject Unsubscribe.\n\n" +
            "Bali Villa Truth\nhttps://balivillatruth.com/privacy",
          html:
            `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b;line-height:1.6;">
               <h2 style="color:#d4943a;margin:0 0 12px;">Research update signup recorded</h2>
               <p>You asked for Bali Villa Truth research updates when available. There is no fixed delivery schedule.</p>
               <p>This signup is separate from requesting an audit PDF.</p>
               <p>To request removal from the newsletter list, email <a href="mailto:audits@balivillatruth.com?subject=Unsubscribe">audits@balivillatruth.com</a> from this address with the subject Unsubscribe.</p>
               <p style="color:#64748b;font-size:12px;margin-top:24px;">Bali Villa Truth<br/><a href="https://balivillatruth.com/privacy" style="color:#d4943a;">Privacy policy</a></p>
             </div>`,
        });
        if (!result.error && result.data?.id) welcomeEmailStatus = "accepted";
        else console.error("Newsletter confirmation email acceptance was not confirmed.");
      } catch {
        console.error("Newsletter confirmation email acceptance was not confirmed.");
      }
    }

    return NextResponse.json({ ok: true, subscription_saved: true, welcome_email_status: welcomeEmailStatus });
  } catch {
    console.error("Newsletter signup persistence was not confirmed.");
    return NextResponse.json({ ok: false, error: SAVE_ERROR }, { status: 503 });
  }
}
