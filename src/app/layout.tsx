import type { Metadata } from "next";
import "./globals.css";
import LayoutWithLead from "@/components/LayoutWithLead";
import AuthInit from "@/components/AuthInit";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Cronos",
  description: "Eventos deportivos en vivo cerca de ti",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body>
        <AuthInit />
        <LayoutWithLead>{children}</LayoutWithLead>
        <Analytics />
      </body>
    </html>
  );
}
