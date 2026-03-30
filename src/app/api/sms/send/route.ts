// src/app/api/sms/send/route.ts
import { NextResponse } from "next/server";

// Si prefieres no usar el SDK, puedes hacer fetch a la API de Twilio con Basic Auth.
// Aquí uso SDK por simplicidad.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { to, message } = await req.json();
    if (!to || !message) {
      return NextResponse.json({ ok: false, error: "Missing to/message" }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const from = process.env.TWILIO_FROM_NUMBER!; // ej. "+15005550006"

    if (!accountSid || !authToken || !from) {
      return NextResponse.json({ ok: false, error: "Twilio envs not set" }, { status: 500 });
    }

    const twilio = require("twilio")(accountSid, authToken);
    const resp = await twilio.messages.create({ to, from, body: message });

    return NextResponse.json({ ok: true, sid: resp.sid });
  } catch (e: any) {
    console.error("SMS error", e?.message || e);
    return NextResponse.json({ ok: false, error: "SMS failed" }, { status: 500 });
  }
}
