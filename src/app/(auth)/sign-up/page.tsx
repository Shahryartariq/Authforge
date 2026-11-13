import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { emailFeatures, providers } from "@/lib/env";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return <SignUpForm providers={providers} email={emailFeatures} />;
}
