"use client";

import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  lastLoginMethodClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("callbackURL");
        window.location.href = next
          ? `/two-factor?callbackURL=${encodeURIComponent(next)}`
          : "/two-factor";
      },
    }),
    passkeyClient(),
    adminClient(),
    lastLoginMethodClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
