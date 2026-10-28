"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck, Globe, Sparkles } from "lucide-react";
import { VideoShowcaseBackdrop } from "@/components/video-showcase-backdrop";
import { LoginForm } from "@/components/login-form";
import { APP_VERSION_LABEL, APP_VERSION_FULL } from "@/lib/version";

interface LoginShowcaseViewProps {
  locale: string;
  tenantName: string;
  tenantSubdomain?: string | null;
  initialEmail: string;
  ssoEnabled: boolean;
  ssoName: string;
  authError?: string;
  isRegistered?: boolean;
  googleConfigured: boolean;
}

export function LoginShowcaseView({
  locale,
  tenantName,
  tenantSubdomain,
  initialEmail,
  ssoEnabled,
  ssoName,
  authError,
  isRegistered,
  googleConfigured,
}: LoginShowcaseViewProps) {
  const [isFormVisible, setIsFormVisible] = useState(true);

  const points = [
    "Residential & commercial property and lease management",
    "Automated invoicing, payment tracking, and accounting (KES/EUR/USD)",
    "Tenant maintenance self-service and contractor dispatch",
  ];

  return (
    <VideoShowcaseBackdrop
      cardTitle="Sign in to Localea"
      isFormVisible={isFormVisible}
      onToggleForm={() => setIsFormVisible((prev) => !prev)}
      expandLabel="Show Sign-in Form"
      collapseLabel="Hide Sign-in Form"
    >
      {/* Floating Crystal Clear Glass Container */}
      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/35 bg-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-md lg:grid-cols-2">
        {/* Brand Side with Standalone Logo (No redundant text for sleeker aesthetics & superior SEO) */}
        <div className="flex flex-col justify-between border-b border-white/20 p-8 text-white sm:p-12 lg:border-b-0 lg:border-r">
          <div className="space-y-6">
            {/* Standalone Brand Emblem */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/30 to-amber-400/30 blur-lg opacity-75 group-hover:opacity-100 transition duration-500" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/aistudio/Localea_Rental_Management_logo_d__df7299e3_2K_46e38a94.jpg"
                  alt="Localea Rental Management"
                  title="Localea Rental Management"
                  className="relative size-20 rounded-2xl border-2 border-amber-300/80 object-cover shadow-2xl ring-2 ring-emerald-400/40 transition-transform duration-300 hover:scale-105 shrink-0"
                />
              </div>
              {/* Semantic hidden heading for search engine optimization & indexing */}
              <h1 className="sr-only">Localea Rental Management</h1>
            </div>

            {tenantSubdomain ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/25 px-3.5 py-1 text-xs font-semibold text-emerald-100 shadow-sm backdrop-blur-sm">
                <Globe className="size-3.5 text-emerald-200" />
                <span>{tenantSubdomain}.rental.triotek.co.ke</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1 text-xs font-semibold text-white/90 shadow-sm backdrop-blur-sm">
                <Sparkles className="size-3.5 text-amber-300" />
                <span>Modern Real Estate Platform</span>
              </div>
            )}

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-md sm:text-4xl">
                Manage Rentals. Maximise Value.
              </h2>
              <p className="text-sm font-medium text-white/90 drop-shadow-sm">
                The all-in-one platform for property managers, landlords, and residents.
              </p>
            </div>

            <ul className="space-y-3 pt-2 text-sm text-white drop-shadow-sm">
              {points.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/40 text-emerald-200 shadow-sm">
                    <Check className="size-3.5 stroke-[2.5]" />
                  </span>
                  <span className="font-medium text-white/95">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-white/20 pt-4 text-xs font-medium text-white/80 drop-shadow-sm">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-300" /> Secure Multi-Tenant Architecture
            </span>
            <span>rental.triotek.co.ke</span>
          </div>
        </div>

        {/* Crystal Clear Form Side */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                Sign in to {tenantName}
              </h2>
              <p className="text-xs font-medium text-white/80 drop-shadow-sm">
                Enter your credentials or connect your Google account to access your dashboard
              </p>
            </div>

            {isRegistered && (
              <div className="rounded-xl border border-emerald-300/50 bg-emerald-600/30 p-3 text-center text-xs font-semibold text-emerald-100 shadow-md backdrop-blur-sm">
                ✔ Organization configured successfully! Please sign in below.
              </div>
            )}

            <LoginForm
              initialEmail={initialEmail}
              tenantName={tenantName}
              ssoEnabled={ssoEnabled}
              ssoName={ssoName}
              authError={authError}
              googleConfigured={googleConfigured}
            />

            <div className="border-t border-white/20 pt-4 text-center text-xs font-medium text-white/80">
              Setting up a new organization?{" "}
              <Link
                href={`/${locale}/setup`}
                className="font-bold text-emerald-300 drop-shadow-sm hover:text-emerald-200 hover:underline"
              >
                Start Account Setup or Guided Demo →
              </Link>
            </div>

            <div
              className="flex items-center justify-center gap-2 text-center text-[11px] text-white/70 drop-shadow-sm"
              title={APP_VERSION_FULL}
            >
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <span>Systems Operational</span>
              <span>·</span>
              <span className="font-mono">{APP_VERSION_LABEL}</span>
            </div>
          </div>
        </div>
      </div>
    </VideoShowcaseBackdrop>
  );
}
