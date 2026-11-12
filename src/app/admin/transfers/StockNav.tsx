"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Boxes, Truck } from "lucide-react";
import { cn } from "@/src/lib/utils";

const LINKS = [
  { href: "/admin/transfers", label: "Transferts", icon: ArrowLeftRight },
  { href: "/admin/stock", label: "Inventaire", icon: Boxes },
  { href: "/admin/suppliers", label: "Fournisseurs", icon: Truck },
];

/** Barre de navigation des écrans de stock : c'est tout ce que voit un magasinier de l'entrepôt, et un raccourci pour les autres. */
export function StockNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-full px-5 h-10 text-[11px] font-black uppercase tracking-widest transition-all",
              active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
            )}
          >
            <Icon size={14} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
