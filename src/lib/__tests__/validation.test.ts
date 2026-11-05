import { describe, expect, it } from "vitest";
import { authErrorMessage } from "../auth-errors";
import { describeUserAgent } from "../user-agent";
import { initials, safeRedirect } from "../utils";
import {
  changePasswordSchema,
  fieldErrors,
  otpSchema,
  passwordStrength,
  signInSchema,
  signUpSchema,
} from "../validation";

describe("safeRedirect", () => {
  it("allows same-site paths", () => {
    expect(safeRedirect("/settings?tab=security")).toBe("/settings?tab=security");
  });
  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "", null, undefined])(
    "blocks %s",
    (value) => {
      expect(safeRedirect(value)).toBe("/dashboard");
    },
  );
});

describe("signUpSchema", () => {
  const valid = { name: "Ada", email: "ADA@Example.com ", password: "long-enough-1", confirmPassword: "long-enough-1" };

  it("normalises email", () => {
    const parsed = signUpSchema.parse(valid);
    expect(parsed.email).toBe("ada@example.com");
  });
  it("rejects short passwords", () => {
    const r = signUpSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).password).toMatch(/at least 8/);
  });
  it("rejects mismatched confirmation", () => {
    const r = signUpSchema.safeParse({ ...valid, confirmPassword: "different-1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).confirmPassword).toBe("Passwords don't match");
  });
});

describe("signInSchema", () => {
  it("requires a password", () => {
    const r = signInSchema.safeParse({ email: "a@b.co", password: "" });
    expect(r.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("rejects reusing the current password", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "same-password-1",
      newPassword: "same-password-1",
      confirmPassword: "same-password-1",
    });
    expect(r.success).toBe(false);
  });
});

describe("otpSchema", () => {
  it.each([["123456", true], [" 123456 ", true], ["12345", false], ["abcdef", false], ["1234567", false]])(
    "%s -> %s",
    (code, ok) => {
      expect(otpSchema.safeParse(code).success).toBe(ok);
    },
  );
});

describe("passwordStrength", () => {
  it("scores longer, mixed passwords higher", () => {
    expect(passwordStrength("")).toBe(0);
    expect(passwordStrength("abcdefgh")).toBe(1);
    expect(passwordStrength("Abcdefgh1234!")).toBe(4);
  });
});

describe("authErrorMessage", () => {
  it("maps known codes", () => {
    expect(authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe("That email and password don't match.");
  });
  it("handles rate limiting", () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/Too many attempts/);
  });
  it("falls back to the server message, then a default", () => {
    expect(authErrorMessage({ code: "SOMETHING_NEW", message: "Server says no" })).toBe("Server says no");
    expect(authErrorMessage(null)).toMatch(/Something went wrong/);
  });
});

describe("describeUserAgent", () => {
  it("recognises common browsers", () => {
    const chromeWin =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
    expect(describeUserAgent(chromeWin)).toEqual({ browser: "Chrome", os: "Windows", mobile: false });
    const iphone =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    expect(describeUserAgent(iphone)).toEqual({ browser: "Safari", os: "iOS", mobile: true });
    expect(describeUserAgent(null).browser).toBe("Unknown browser");
  });
});

describe("initials", () => {
  it("uses first and last names", () => {
    expect(initials("Grace Brewster Hopper")).toBe("GH");
    expect(initials("", "zed@example.com")).toBe("ZE");
  });
});
