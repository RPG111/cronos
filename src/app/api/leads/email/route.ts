// src/app/api/leads/email/route.ts
import { NextResponse } from "next/server";

type LeadPayload = {
  restaurantName?: string;
  contactName?: string;
  city?: string;
  phone?: string | null;
  email?: string | null;
  capacity?: number | null;
  screens?: number | null;
  sports?: string[] | null;
  message?: string | null;
  uid?: string | null;
};

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]!));
}

function asList(arr?: string[] | null) {
  if (!arr || arr.length === 0) return "-";
  return arr.join(", ");
}

function buildSubject(p: LeadPayload) {
  const name = (p.restaurantName || "").trim();
  const city = (p.city || "").trim();
  if (name && city) return `Nuevo lead restaurante — ${name} (${city})`;
  if (name) return `Nuevo lead restaurante — ${name}`;
  return "Nuevo lead restaurante";
}

function buildText(p: LeadPayload) {
  return [
    `Restaurante: ${p.restaurantName || "-"}`,
    `Contacto: ${p.contactName || "-"}`,
    `Ciudad: ${p.city || "-"}`,
    `Teléfono: ${p.phone || "-"}`,
    `Email: ${p.email || "-"}`,
    `Capacidad: ${p.capacity ?? "-"}`,
    `Pantallas: ${p.screens ?? "-"}`,
    `Deportes: ${asList(p.sports)}`,
    `Mensaje: ${p.message || "-"}`,
    `UID (si había sesión): ${p.uid || "-"}`,
  ].join("\n");
}

function buildHtml(p: LeadPayload) {
  return `<!doctype html>
<html>
  <body style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Arial; background:#0b0b0b; color:#fff; padding:24px;">
    <table role="presentation" width="100%" style="max-width:640px;margin:0 auto;background:#111;border:1px solid #222;border-radius:12px">
      <tr>
        <td style="padding:20px 22px;border-bottom:1px solid #222">
          <h1 style="margin:0;font-size:18px;color:#86efac;">Nuevo lead de restaurante</h1>
          <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;">Formulario “Soy restaurante” — Cronos</p>
        </td>
      </tr>
      <tr><td style="padding:18px 22px;">
        <table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0 8px;">
          ${row("Restaurante", esc(p.restaurantName))}
          ${row("Contacto", esc(p.contactName))}
          ${row("Ciudad", esc(p.city))}
          ${row("Teléfono", esc(p.phone))}
          ${row("Email", esc(p.email))}
          ${row("Capacidad", esc(p.capacity))}
          ${row("Pantallas", esc(p.screens))}
          ${row("Deportes", esc(asList(p.sports)))}
          ${row("Mensaje", esc(p.message))}
          ${row("UID sesión", esc(p.uid))}
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function row(label: string, value: string) {
  return `
  <tr>
    <td style="width:160px;vertical-align:top;padding:8px 0;color:#9ca3af;font-size:12px;">${label}</td>
    <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">${value || "-"}</td>
  </tr>`;
}

export async function POST(req: Request) {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const TO = process.env.LEADS_EMAIL_TO;
    const FROM = process.env.LEADS_EMAIL_FROM || "leads@cronosapp.com";

    if (!RESEND_API_KEY || !TO) {
      return NextResponse.json(
        { ok: false, error: "Config faltante: RESEND_API_KEY y/o LEADS_EMAIL_TO" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as LeadPayload;
    const subject = buildSubject(body);
    const text = buildText(body);
    const html = buildHtml(body);

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        subject,
        text,
        html,
      }),
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      console.error("Resend error:", errTxt);
      return NextResponse.json(
        { ok: false, error: "Email send failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
