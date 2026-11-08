import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/password-reset-forms";
import { emailFeatures } from "@/lib/env";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm emailDelivery={emailFeatures.delivery} />;
}
