"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/settings", label: "Settings" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  return (
    <nav className="flex flex-1 items-center gap-1 text-sm">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-colors",
              active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
