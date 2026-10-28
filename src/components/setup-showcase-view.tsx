"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { VideoShowcaseBackdrop } from "@/components/video-showcase-backdrop";
import { SetupWizard } from "@/components/setup-wizard";

interface SetupShowcaseViewProps {
  locale: string;
  isAlreadyConfigured?: boolean;
}

export function SetupShowcaseView({
  locale,
  isAlreadyConfigured = false,
}: SetupShowcaseViewProps) {
  const [isFormVisible, setIsFormVisible] = useState(true);

  return (
    <VideoShowcaseBackdrop
      cardTitle="Setup Localea"
      isFormVisible={isFormVisible}
      onToggleForm={() => setIsFormVisible((prev) => !prev)}
      expandLabel="Show Setup Wizard"
      collapseLabel="Hide Setup Wizard"
    >
      {/* Centered Crystal Clear Glass Setup Card */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/35 bg-white/10 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-md sm:p-10 text-white">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* Standalone Brand Emblem (Clean, prestigious, logo-only for superior appeal & SEO) */}
          <div className="relative group mb-3">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-emerald-400/30 to-amber-400/30 blur-lg opacity-75 group-hover:opacity-100 transition duration-500" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/aistudio/Localea_Rental_Management_logo_d__df7299e3_2K_46e38a94.jpg"
              alt="Localea Rental Management"
              title="Localea Rental Management"
              className="relative size-20 rounded-2xl border-2 border-amber-300/80 object-cover shadow-2xl ring-4 ring-emerald-400/30 transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Semantic hidden heading for SEO indexing */}
          <h1 className="sr-only">Localea Rental Management - Initial System Setup</h1>

          <h2 className="text-2xl font-extrabold tracking-tight drop-shadow-md sm:text-3xl">
            Initial System Setup
          </h2>
          <p className="mt-1 max-w-md text-sm font-medium text-white/90 drop-shadow-sm">
            Configure your multi-tenant organization, custom subdomain, and administrator credentials.
          </p>
        </div>

        {isAlreadyConfigured && (
          <div className="mb-6 rounded-2xl border border-emerald-300/50 bg-emerald-600/30 p-4 text-emerald-100 backdrop-blur-sm shadow-md">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-300 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-white text-sm">System Already Configured</p>
                <p className="text-xs text-white/90 leading-relaxed">
                  Administrator and demo accounts are already set up in the system. You can sign in directly or continue here to add a new organization.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/${locale}/login`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-emerald-950 shadow-md hover:bg-white/90 transition-all"
                  >
                    Go to Sign-in <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <SetupWizard />

        <div className="mt-6 border-t border-white/20 pt-4 text-center text-xs font-medium text-white/80">
          Already configured?{" "}
          <Link
            href={`/${locale}/login`}
            className="font-bold text-emerald-300 drop-shadow-sm hover:text-emerald-200 hover:underline"
          >
            Sign in to your Localea account →
          </Link>
        </div>
      </div>
    </VideoShowcaseBackdrop>
  );
}
