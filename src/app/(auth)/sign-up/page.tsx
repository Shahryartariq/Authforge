import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthFormSkeleton } from "@/components/auth/form-skeleton";
import { emailFeatures, providers } from "@/lib/env";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <SignUpForm providers={providers} email={emailFeatures} />
    </Suspense>
  );
}
