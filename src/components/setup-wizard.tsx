"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, Palette, Home, Rocket, ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Globe } from "lucide-react";
import { setupSystem, launchDemoSystem } from "@/server/actions/setup";
import type { ActionState } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const BASE_DOMAIN = "rental.triotek.co.ke";

const PRESETS = [
  { name: "Localea Green", color: "#0F5132" },
  { name: "Emerald", color: "#059669" },
  { name: "Teal", color: "#0d9488" },
  { name: "Slate", color: "#334155" },
  { name: "Amber", color: "#d97706" },
  { name: "Indigo", color: "#4f46e5" },
  { name: "Blue", color: "#2563eb" },
  { name: "Rose", color: "#e11d48" },
];

const inputCls = cn(
  "flex h-9 w-full rounded-lg border border-white/35 bg-white/15 px-3 text-sm text-white placeholder:text-white/60 shadow-xs backdrop-blur-xs",
  "focus-visible:border-emerald-300 focus-visible:bg-white/25 focus-visible:ring-2 focus-visible:ring-emerald-300/40 outline-none",
);

export function SetupWizard() {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(setupSystem, {});
  const [demoPending, setDemoPending] = useState(false);
  const [step, setStep] = useState(0);

  const [f, setF] = useState({
    tenantName: "Localea Rental Management",
    subdomain: "kilimani",
    customDomain: "",
    name: "Admin",
    email: "admin@localea.app",
    password: "admin",
    locale: "en",
    brandColor: "#0F5132",
    propertyName: "Kilimani Heights",
    propertyStreet: "Argwings Kodhek Rd",
    propertyZip: "00100",
    propertyCity: "Nairobi",
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const steps = [
    { key: "welcome", icon: Rocket },
    { key: "account", icon: Building2 },
    { key: "domain", icon: Globe },
    { key: "branding", icon: Palette },
    { key: "property", icon: Home },
    { key: "done", icon: Check },
  ];
  const last = steps.length - 1;

  const accountValid =
    f.tenantName.trim() !== "" && f.name.trim() !== "" && /.+@.+\..+/.test(f.email) && f.password.length >= 4;
  const subdomainValid = /^[a-z0-9-]+$/i.test(f.subdomain.trim());
  const canNext = step === 1 ? accountValid : step === 2 ? subdomainValid : true;

  async function handleLaunchDemo() {
    setDemoPending(true);
    try {
      await launchDemoSystem();
    } catch {
      // In case Next.js redirect is caught as error in client handler, force navigation
      window.location.href = "/login?email=admin@localea.app&registered=1";
      return;
    }
    window.location.href = "/login?email=admin@localea.app&registered=1";
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Progress Tracker */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={cn(
                "grid size-8 place-items-center rounded-full border text-xs transition-colors shadow-sm",
                i < step && "border-emerald-300 bg-emerald-500 text-white font-bold",
                i === step &&
                  "border-emerald-300 bg-emerald-700/60 text-emerald-100 font-bold ring-2 ring-emerald-300/50 backdrop-blur-sm",
                i > step && "border-white/30 text-white/60 bg-white/10 backdrop-blur-xs",
              )}
            >
              {i < step ? <Check className="size-4" /> : <s.icon className="size-4" />}
            </div>
            {i < last && (
              <div className={cn("h-px w-4 sm:w-6", i < step ? "bg-emerald-300" : "bg-white/20")} />
            )}
          </div>
        ))}
      </div>

      <div className="min-h-[290px]">
        {/* Step 0: Welcome & Mode Selection */}
        <div className={cn("space-y-5 text-center py-2", step !== 0 && "hidden")}>
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-300/40 backdrop-blur-sm shadow-md">
            <Sparkles className="size-6 text-emerald-200" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Choose Setup Experience</h2>
            <p className="mx-auto max-w-md text-sm text-white/90 leading-relaxed drop-shadow-sm font-medium">
              Launch an interactive guided tour with sample Kenyan rental properties, or configure a clean production workspace.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3 max-w-sm mx-auto">
            {/* Guided Demo Button */}
            <Button
              type="button"
              onClick={handleLaunchDemo}
              disabled={demoPending}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-5 shadow-lg shadow-emerald-700/40 transition-all"
            >
              {demoPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2 text-amber-300" />}
              Launch Guided Demo Tour (Interactive Guide)
            </Button>

            {/* Production Setup Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/30 bg-white/15 text-white hover:bg-white/25 font-semibold backdrop-blur-sm shadow-sm"
              onClick={() => setStep(1)}
            >
              Configure Live Production Organization
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Step 1: Organization & Admin Account */}
        <div className={cn("space-y-4", step !== 1 && "hidden")}>
          <div className="space-y-1.5">
            <Label htmlFor="tenantName" className="font-medium text-white drop-shadow-sm">
              {t("setup.tenantName") || "Organization Name"}
            </Label>
            <input
              id="tenantName"
              name="tenantName"
              value={f.tenantName}
              onChange={set("tenantName")}
              className={inputCls}
              placeholder="e.g. Localea Property Management"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="font-medium text-white drop-shadow-sm">
                {t("setup.adminName") || "Administrator Name"}
              </Label>
              <input id="name" name="name" value={f.name} onChange={set("name")} className={inputCls} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="locale" className="font-medium text-white drop-shadow-sm">
                {t("common.language") || "Language"}
              </Label>
              <select id="locale" name="locale" value={f.locale} onChange={set("locale")} className={inputCls}>
                <option value="en" className="bg-neutral-900 text-white">English (Default)</option>
                <option value="de" className="bg-neutral-900 text-white">Deutsch</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-medium text-white drop-shadow-sm">
              {t("login.email") || "Administrator Email"}
            </Label>
            <input id="email" name="email" type="email" value={f.email} onChange={set("email")} className={inputCls} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-medium text-white drop-shadow-sm">
              {t("login.password") || "Password"}
            </Label>
            <input id="password" name="password" type="password" value={f.password} onChange={set("password")} className={inputCls} required />
            <p className="text-xs text-white/70 drop-shadow-sm">Minimum 4 characters</p>
          </div>
        </div>

        {/* Step 2: Multi-Tenancy Subdomain & Domain */}
        <div className={cn("space-y-4", step !== 2 && "hidden")}>
          <div className="space-y-1.5">
            <Label htmlFor="subdomain" className="font-medium text-white drop-shadow-sm">
              Portal Subdomain <span className="text-emerald-300">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="subdomain"
                name="subdomain"
                value={f.subdomain}
                onChange={set("subdomain")}
                className={inputCls}
                placeholder="e.g. kilimani"
                required
              />
              <span className="shrink-0 text-xs font-mono font-semibold text-white/90 drop-shadow-sm">.{BASE_DOMAIN}</span>
            </div>
            <div className="mt-1 rounded-xl border border-emerald-300/40 bg-emerald-600/25 p-2.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm shadow-sm">
              <strong>Live Subdomain URL:</strong>{" "}
              <code className="text-emerald-200">
                https://{f.subdomain || "your-subdomain"}.{BASE_DOMAIN}
              </code>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customDomain" className="font-medium text-white drop-shadow-sm">
              Optional Custom Domain
            </Label>
            <input
              id="customDomain"
              name="customDomain"
              value={f.customDomain}
              onChange={set("customDomain")}
              className={inputCls}
              placeholder="e.g. rentals.triotek.co.ke"
            />
            <p className="text-xs text-white/70 drop-shadow-sm">
              If provided, requests to this domain will automatically resolve to your organization.
            </p>
          </div>
        </div>

        {/* Step 3: Branding */}
        <div className={cn("space-y-4", step !== 3 && "hidden")}>
          <p className="text-sm font-medium text-white/90 drop-shadow-sm">{t("setup.brandingText") || "Select your primary corporate brand theme color:"}</p>
          <input type="hidden" name="brandColor" value={f.brandColor} />
          <div className="grid grid-cols-4 gap-2.5">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p.color}
                onClick={() => setF((s) => ({ ...s, brandColor: p.color }))}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all backdrop-blur-xs",
                  f.brandColor === p.color
                    ? "border-emerald-300 bg-white/25 ring-2 ring-emerald-300/60 shadow-md"
                    : "border-white/20 bg-white/10 hover:bg-white/20",
                )}
              >
                <span className="size-7 rounded-full shadow-md" style={{ backgroundColor: p.color }} />
                <span className="truncate text-white drop-shadow-sm">{p.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="color"
              value={f.brandColor}
              onChange={(e) => setF((s) => ({ ...s, brandColor: e.target.value }))}
              className="h-9 w-14 cursor-pointer rounded-lg border border-white/35 bg-transparent"
            />
            <span
              className="inline-flex h-8 items-center rounded-md px-4 text-xs font-semibold text-white shadow-md"
              style={{ backgroundColor: f.brandColor }}
            >
              {t("setup.preview") || "Color Preview"}
            </span>
            <code className="text-xs text-white/80 drop-shadow-sm font-mono">{f.brandColor}</code>
          </div>
        </div>

        {/* Step 4: First Property (Optional) */}
        <div className={cn("space-y-4", step !== 4 && "hidden")}>
          <p className="text-sm font-medium text-white/90 drop-shadow-sm">
            {t("setup.propertyText") || "Add your first rental property or estate (optional):"}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="propertyName" className="font-medium text-white drop-shadow-sm">
              {t("fields.name") || "Property / Estate Name"}
            </Label>
            <input
              id="propertyName"
              name="propertyName"
              value={f.propertyName}
              onChange={set("propertyName")}
              className={inputCls}
              placeholder="e.g. Kilimani Heights"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="propertyStreet" className="font-medium text-white drop-shadow-sm">
              {t("fields.street") || "Street Address"}
            </Label>
            <input
              id="propertyStreet"
              name="propertyStreet"
              value={f.propertyStreet}
              onChange={set("propertyStreet")}
              className={inputCls}
              placeholder="e.g. Argwings Kodhek Rd"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="propertyZip" className="font-medium text-white drop-shadow-sm">
                {t("fields.zip") || "Postal Code"}
              </Label>
              <input id="propertyZip" name="propertyZip" value={f.propertyZip} onChange={set("propertyZip")} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="propertyCity" className="font-medium text-white drop-shadow-sm">
                {t("fields.city") || "City"}
              </Label>
              <input id="propertyCity" name="propertyCity" value={f.propertyCity} onChange={set("propertyCity")} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Step 5: Summary */}
        <div className={cn("space-y-4 text-center py-2", step !== last && "hidden")}>
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/40">
            <Check className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-white drop-shadow-md">Review &amp; Create Organization</h2>
          <div className="mx-auto max-w-sm rounded-2xl border border-white/30 bg-white/15 p-4 text-left text-sm space-y-1.5 text-white backdrop-blur-md shadow-lg">
            <div><strong className="text-white">Organization:</strong> {f.tenantName}</div>
            <div><strong className="text-white">Subdomain:</strong> {f.subdomain}.{BASE_DOMAIN}</div>
            {f.customDomain && <div><strong className="text-white">Custom Domain:</strong> {f.customDomain}</div>}
            <div><strong className="text-white">Admin Email:</strong> {f.email}</div>
            {f.propertyName && <div><strong className="text-white">Initial Property:</strong> {f.propertyName}</div>}
          </div>
        </div>
      </div>

      {state.error && (
        <div className="rounded-lg border border-red-300/50 bg-red-600/30 p-2.5 text-center text-xs font-semibold text-red-100 backdrop-blur-sm">
          {state.error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-white/20 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-white hover:bg-white/20 hover:text-white font-medium"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          {t("setup.back") || "Back"}
        </Button>

        {step < last ? (
          <div className="flex gap-2">
            {(step === 3 || step === 4) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                className="border-white/30 bg-white/15 text-white hover:bg-white/25 font-semibold backdrop-blur-xs"
              >
                {t("setup.skip") || "Skip"}
              </Button>
            )}
            {step > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="bg-emerald-600 text-white hover:bg-emerald-500 font-semibold shadow-md"
              >
                {t("setup.next") || "Next"}
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            )}
          </div>
        ) : (
          <Button type="submit" size="sm" disabled={pending} className="bg-emerald-600 text-white hover:bg-emerald-500 font-semibold px-6 shadow-md shadow-emerald-700/40">
            {pending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            {t("setup.submit") || "Complete Setup"}
          </Button>
        )}
      </div>
    </form>
  );
}
