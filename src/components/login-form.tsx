"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Loader2, Check, Eye, EyeOff, AlertTriangle, ShieldCheck, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  initialEmail = "",
  tenantName,
  ssoEnabled = false,
  ssoName = "SSO",
  authError,
  googleConfigured = false,
}: {
  initialEmail?: string;
  tenantName?: string;
  ssoEnabled?: boolean;
  ssoName?: string;
  authError?: string;
  googleConfigured?: boolean;
}) {
  const t = useTranslations("login");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [testEmail, setTestEmail] = useState(initialEmail || "admin@localea.app");
  const [linkTestResult, setLinkTestResult] = useState<{
    tested: boolean;
    registered: boolean;
    message: string;
  } | null>(null);
  const [testingLink, setTestingLink] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (res?.error) {
        console.warn("[login] Credentials sign in error:", res.error);
        setError(true);
        setLoading(false);
      } else {
        setOk(true);
        // Direct navigation to dashboard ensures Next.js loads the authenticated view immediately
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      }
    } catch (err) {
      console.error("[login] Unhandled sign in error:", err);
      setError(true);
      setLoading(false);
    }
  }

  function fillDemoAdmin() {
    setEmail("admin@localea.app");
    setPassword("admin");
    setError(false);
  }

  async function onGoogleClick() {
    if (googleConfigured) {
      setGoogleLoading(true);
      await signIn("google", { callbackUrl: "/" });
    } else {
      setShowGoogleModal(true);
    }
  }

  async function checkLinkEligibility() {
    setTestingLink(true);
    try {
      const res = await fetch("/api/auth/link-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });
      const data = await res.json();
      setLinkTestResult({
        tested: true,
        registered: Boolean(data.registered),
        message: data.message || (data.registered ? "Account eligible for Google linking." : "Account not registered."),
      });
    } catch {
      setLinkTestResult({
        tested: true,
        registered: false,
        message: "Failed to verify account link status.",
      });
    } finally {
      setTestingLink(false);
    }
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        className={`space-y-4 transition-all duration-500 ${ok ? "-translate-x-6 opacity-0" : ""}`}
      >
        {/* NextAuth Error Alerts */}
        {authError === "AccessDenied" && (
          <div className="rounded-xl border border-amber-300/60 bg-amber-500/25 p-3 text-xs text-amber-100 backdrop-blur-md shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="size-4 shrink-0 text-amber-300 mt-0.5" />
              <div>
                <p className="font-bold text-white">Google Social Link Denied</p>
                <p className="mt-1 leading-relaxed text-white/90">
                  No registered Localea user account exists with that Google email. Google sign-in is strictly an account connection function for pre-registered accounts. Please sign in with your email/password or create an account first.
                </p>
              </div>
            </div>
          </div>
        )}

        {authError === "Configuration" && (
          <div className="rounded-xl border border-blue-300/60 bg-blue-500/25 p-3 text-xs text-blue-100 backdrop-blur-md shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="size-4 shrink-0 text-blue-300 mt-0.5" />
              <div>
                <p className="font-bold text-white">Google OAuth Not Configured</p>
                <p className="mt-1 leading-relaxed text-white/90">
                  Set <code className="rounded bg-black/30 px-1 py-0.5">GOOGLE_CLIENT_ID</code> and{" "}
                  <code className="rounded bg-black/30 px-1 py-0.5">GOOGLE_CLIENT_SECRET</code> in your server environment to enable live Google authentication.
                </p>
              </div>
            </div>
          </div>
        )}

        {authError && authError !== "AccessDenied" && authError !== "Configuration" && (
          <div className="rounded-xl border border-red-300/50 bg-red-600/30 p-2.5 text-center text-xs font-semibold text-red-100 backdrop-blur-sm">
            Sign-in could not be completed ({authError}). Please try again.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="font-medium text-white drop-shadow-sm">
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="border-white/35 bg-white/15 text-white placeholder:text-white/60 backdrop-blur-xs focus:border-emerald-300 focus:bg-white/25 focus:ring-2 focus:ring-emerald-300/40"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="font-medium text-white drop-shadow-sm">
            {t("password")}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-white/35 bg-white/15 pr-10 text-white placeholder:text-white/60 backdrop-blur-xs focus:border-emerald-300 focus:bg-white/25 focus:ring-2 focus:ring-emerald-300/40"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-white/70 hover:text-white"
              aria-label={showPw ? t("hidePassword") : t("showPassword")}
              title={showPw ? t("hidePassword") : t("showPassword")}
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300/50 bg-red-600/30 p-3 text-center text-xs font-semibold text-red-100 backdrop-blur-sm space-y-2">
            <p>{t("error") || "Invalid email or password."}</p>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300/60 bg-amber-500/25 px-2.5 py-1 text-[11px] font-bold text-amber-100 hover:bg-amber-500/40 transition-colors cursor-pointer"
            >
              Fill Demo Admin (admin@localea.app / admin)
            </button>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-emerald-600 font-semibold text-white shadow-lg hover:bg-emerald-500 hover:shadow-emerald-600/30 transition-all cursor-pointer"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {t("submit")}
        </Button>

        <div className="relative my-3 flex items-center justify-center text-xs uppercase">
          <span className="w-full border-t border-white/20" />
          <span className="px-2 font-medium text-white/70 drop-shadow-sm">or</span>
          <span className="w-full border-t border-white/20" />
        </div>

        {/* Google OAuth Link Button */}
        <div>
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/30 bg-white/15 font-semibold text-white backdrop-blur-sm hover:bg-white/25 hover:text-white shadow-sm cursor-pointer"
            onClick={onGoogleClick}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <svg className="mr-2 size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            Sign in with Google
          </Button>
          <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-medium text-white/70">
            <Link2 className="size-3 text-emerald-300" />
            <span>Social link: Google email must already be registered</span>
          </div>
        </div>

        {ssoEnabled && (
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/30 bg-white/15 font-semibold text-white backdrop-blur-sm hover:bg-white/25 hover:text-white"
            onClick={() => signIn("oidc", { callbackUrl: "/" })}
          >
            {t("ssoSubmit", { provider: ssoName })}
          </Button>
        )}
      </form>

      {/* Google Account Linking Verification Modal (when live Google credentials are not in environment) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/30 bg-slate-900/90 p-6 text-white shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Google Social Link Policy</h3>
                <p className="text-xs text-white/70">Account Linking Verification</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-white/80">
              <p>
                In Localea, Google sign-in operates strictly as an <strong>account connection function</strong> for pre-existing users. New accounts cannot be created by simply logging in with Google.
              </p>
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-3">
                <p className="font-semibold text-emerald-200">How It Works:</p>
                <ul className="mt-1.5 list-disc pl-4 space-y-1 text-white/80">
                  <li>Your Google email must match an already registered Localea account.</li>
                  <li>If the email is found in the database, your session is authorized immediately.</li>
                  <li>If the email is not registered, sign-in is strictly rejected (<code className="text-amber-300">AccessDenied</code>).</li>
                </ul>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="test-email" className="text-xs font-medium text-white/90">
                  Test Email Linking Check:
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email to verify"
                    className="border-white/30 bg-white/10 text-white placeholder:text-white/40 text-xs"
                  />
                  <Button
                    type="button"
                    onClick={checkLinkEligibility}
                    disabled={testingLink}
                    className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold px-3"
                  >
                    {testingLink ? <Loader2 className="size-3 animate-spin" /> : "Verify"}
                  </Button>
                </div>
              </div>

              {linkTestResult && (
                <div
                  className={`mt-2 rounded-lg border p-2.5 text-xs font-medium ${
                    linkTestResult.registered
                      ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
                      : "border-amber-400/50 bg-amber-500/20 text-amber-100"
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    {linkTestResult.registered ? (
                      <Check className="size-4 shrink-0 text-emerald-300 mt-0.5" />
                    ) : (
                      <AlertTriangle className="size-4 shrink-0 text-amber-300 mt-0.5" />
                    )}
                    <span>{linkTestResult.message}</span>
                  </div>
                </div>
              )}

              <p className="pt-2 text-[11px] text-white/60">
                To connect with live Google servers, add <code className="text-amber-300">GOOGLE_CLIENT_ID</code> and{" "}
                <code className="text-amber-300">GOOGLE_CLIENT_SECRET</code> to your server environment.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowGoogleModal(false);
                  setLinkTestResult(null);
                }}
                className="border-white/30 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Animation */}
      {ok && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4 text-white duration-700 animate-in zoom-in-90 slide-in-from-bottom-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/40">
              <Check className="size-8 animate-in zoom-in duration-500" />
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">
                {t("welcome")}
                {tenantName ? `, ${tenantName}` : ""}
              </div>
              <p className="mt-1 text-sm text-white/80">{t("loadingApp")}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
