import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/icons";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What the ${site.name} demo stores about you, and how to delete it.`,
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy" },
};

// If you deploy Authforge for your own app, rewrite this page for it.

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "What we store",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Your name, email address, whether the email is verified, and your role.</li>
        <li>A hash of your password, if you set one. We never store the password itself.</li>
        <li>
          If you sign in with Google or GitHub: your account ID there and the tokens the provider gives us.
          We only ask for your name, email and profile picture.
        </li>
        <li>For passkeys, the public key only. The private key never leaves your device.</li>
        <li>For two-factor authentication, your authenticator secret and backup codes, encrypted.</li>
        <li>
          One session per signed-in device, with its IP address and browser, so you can review and sign out
          devices in Settings.
        </li>
        <li>Counts of recent sign-in attempts per IP address, to slow down password guessing.</li>
      </ul>
    ),
  },
  {
    title: "What we don't do",
    body: (
      <p>
        No analytics, no ads and no tracking. We don&apos;t sell or share your data. The only cookies are the ones
        that keep you signed in, remember a trusted device for two-factor sign-in, and show which sign-in method
        you used last.
      </p>
    ),
  },
  {
    title: "Services we use",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Vercel hosts the site and Neon hosts the database.</li>
        <li>Google and GitHub, only when you choose to sign in with them.</li>
        <li>
          Have I Been Pwned checks new passwords against known breaches. Only the first five characters of a
          hash of the password are sent, so the password itself never leaves our server.
        </li>
      </ul>
    ),
  },
  {
    title: "Deleting your data",
    body: (
      <p>
        Settings → Delete account removes your account, sessions, passkeys, two-factor settings and linked Google
        or GitHub accounts. This is a demo, so we may also clear its data at any time.
      </p>
    ),
  },
  {
    title: "Contact",
    body: (
      <p>
        Questions? Open an issue on{" "}
        <a href={site.repo} className="text-foreground underline underline-offset-4">
          GitHub
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-2xl items-center px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo className="size-7" />
          {site.name}
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          For the {site.name} demo at getauthforge.vercel.app. Last updated November 10, 2026.
        </p>
        <div className="mt-10 space-y-10 text-[15px] leading-7 text-muted-foreground">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="mb-3 text-lg font-semibold text-foreground">{s.title}</h2>
              {s.body}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
