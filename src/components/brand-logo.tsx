"use client";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** If true, text title is displayed. Defaults to false for clean standalone logo presentation */
  showText?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  invertOnDark?: boolean;
  logoUrl?: string;
}

/**
 * BrandLogo: Standalone high-fidelity brand emblem.
 * Per brand design requirements, displays the pristine emblem alone for sleek aesthetic appeal
 * while embedding semantic metadata (sr-only, title, alt) for optimal SEO and accessibility.
 */
export function BrandLogo({
  className,
  size = "md",
  showText = false,
  showSubtitle = false,
  subtitle = "Rental & Property Management",
  logoUrl,
}: BrandLogoProps) {
  const emblemSizes = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
    xl: "size-16",
    "2xl": "size-20",
  };

  const titleSizes = {
    sm: "text-base font-bold",
    md: "text-lg font-extrabold",
    lg: "text-2xl font-black",
    xl: "text-3xl font-black",
    "2xl": "text-4xl font-black",
  };

  const subSizes = {
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-xs",
    xl: "text-xs",
    "2xl": "text-sm",
  };

  const imgSrc =
    logoUrl ??
    "/assets/aistudio/Localea_Rental_Management_logo_d__df7299e3_2K_46e38a94.jpg";

  return (
    <div
      className={cn("inline-flex items-center gap-3 select-none", className)}
      role="img"
      aria-label="Localea Rental Management"
    >
      {/* High-res standalone emblem with refined border styling and hover micro-interaction */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt="Localea Rental Management"
        title="Localea Rental Management"
        className={cn(
          emblemSizes[size],
          "rounded-2xl object-cover shadow-sm ring-1 ring-emerald-500/30 border border-amber-300/40 shrink-0 transition-transform duration-200 hover:scale-105"
        )}
      />

      {/* Semantic hidden heading for search engine optimization & assistive screen readers */}
      <span className="sr-only">Localea Rental Management</span>

      {/* Optional visible text only when explicitly requested (defaults to false) */}
      {showText && (
        <div className="flex flex-col leading-none justify-center">
          <span className={cn(titleSizes[size], "tracking-tight text-foreground")}>
            Localea
          </span>
          {showSubtitle && (
            <span
              className={cn(
                subSizes[size],
                "font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mt-0.5"
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
