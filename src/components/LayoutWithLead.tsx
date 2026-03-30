"use client";

import { usePathname } from "next/navigation";
import RestaurantLead from "./RestaurantLead";

export default function LayoutWithLead({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const show =
    pathname === "/home" ||
    pathname === "/auth/login" ||
    pathname === "/auth/register" ||
    // si usas / en vez de /home para el listado, ponlo también:
    pathname === "/";

  return (
    <>
      {show && <RestaurantLead />}
      {children}
    </>
  );
}
