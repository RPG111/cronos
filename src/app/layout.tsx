import type { Metadata } from "next";
import "./globals.css";
import LayoutWithLead from "@/components/LayoutWithLead";
import AuthInit from "@/components/AuthInit";

export const metadata: Metadata = {
  title: "Cronos",
  description: "Eventos deportivos en vivo cerca de ti",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthInit />
        <LayoutWithLead>{children}</LayoutWithLead>
      </body>
    </html>
  );
}
