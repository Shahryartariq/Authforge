"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInPanel } from "@/components/auth/sign-in-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { EnabledProviders } from "@/lib/env";

/**
 * A "Sign in" control. `mode="modal"` opens the sign-in form in a dialog so
 * people can sign in without leaving the page; `mode="redirect"` links to
 * /sign-in. Pass any button or link as the child.
 */
export function SignInButton({
  children,
  providers,
  mode = "modal",
  callbackURL = "/dashboard",
}: {
  children: React.ReactElement;
  providers: EnabledProviders;
  mode?: "modal" | "redirect";
  callbackURL?: string;
}) {
  const [open, setOpen] = useState(false);

  if (mode === "redirect") {
    const href = callbackURL === "/dashboard" ? "/sign-in" : `/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`;
    return <Link href={href}>{children}</Link>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="gap-6 sm:max-w-[420px]"
        // Close before any navigation. Next.js keeps the previous page alive for
        // the Back button, so a dialog left open would still be open there.
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest("a[href]")) setOpen(false);
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-tight">Welcome back</DialogTitle>
          <DialogDescription>Sign in to your account to continue.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so a fresh form appears every time. */}
        {open && (
          <SignInPanel
            providers={providers}
            callbackURL={callbackURL}
            showHeader={false}
            onNavigate={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
