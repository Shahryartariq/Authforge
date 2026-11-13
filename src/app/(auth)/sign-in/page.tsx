import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";
import { providers } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return <SignInForm providers={providers} />;
}
