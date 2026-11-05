"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Shield } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/utils";

type Props = { name: string; email: string; image?: string | null; isAdmin: boolean };

export function UserMenu({ name, email, image, isAdmin }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function signOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-xs font-semibold text-accent outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initials(name, email)
        )}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border bg-card p-1 shadow-lg">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <MenuLink href="/settings" onClick={() => setOpen(false)}>
            <Settings className="size-4" /> Settings
          </MenuLink>
          {isAdmin && (
            <MenuLink href="/admin" onClick={() => setOpen(false)}>
              <Shield className="size-4" /> Admin panel
            </MenuLink>
          )}
          <button
            role="menuitem"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link role="menuitem" href={href} onClick={onClick} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
      {children}
    </Link>
  );
}
