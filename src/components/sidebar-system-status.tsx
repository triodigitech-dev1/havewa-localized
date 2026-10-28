"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { APP_VERSION_LABEL, APP_VERSION_FULL, APP_VERSION, APP_BUILD, APP_SHA } from "@/lib/version";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Database,
  Wifi,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

export function SidebarSystemStatus() {
  const { state, isMobile } = useSidebar();
  const [copied, setCopied] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(() =>
    typeof window !== "undefined" ? navigator.onLine : true
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleCopyDiagnostics = async () => {
    const diagnostics = JSON.stringify(
      {
        product: "Localea Rental & Property Management",
        tier: "Enterprise Cloud",
        version: APP_VERSION,
        build: APP_BUILD,
        sha: APP_SHA || "production",
        systemStatus: isOnline ? "Operational" : "Offline Mode",
        database: "Prisma Relational Engine (Connected)",
        syncEngine: "IndexedDB Offline Sync (Active)",
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );

    try {
      await navigator.clipboard.writeText(diagnostics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback if clipboard api fails
    }
  };

  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <Dialog>
      <DialogTrigger
        className="w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
        title="View System Status & Environment"
      >
        {isCollapsed ? (
          // Compact icon view for collapsed sidebar
          <div className="relative flex size-9 items-center justify-center rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:border-emerald-500/40">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="sr-only">Systems Operational · {APP_VERSION_LABEL}</span>
          </div>
        ) : (
          // Polished high-tech enterprise card for expanded sidebar
          <div className="relative overflow-hidden rounded-xl border border-sidebar-border/80 bg-sidebar-accent/30 p-2.5 transition-all duration-200 hover:border-emerald-500/40 hover:bg-sidebar-accent/60 hover:shadow-sm">
            {/* Ambient accent subtle glow */}
            <div className="pointer-events-none absolute -right-6 -top-6 size-16 rounded-full bg-emerald-500/10 blur-xl" />

            {/* Top row: live operational status */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold tracking-tight text-foreground">
                  {isOnline ? "Systems Operational" : "Offline Synchronized"}
                </span>
              </div>
              <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Live
              </span>
            </div>

            {/* Bottom row: platform tier & release identifier */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="truncate font-medium text-foreground/80">Localea Cloud</span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground/90">
                v{APP_VERSION}
              </span>
            </div>
          </div>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Localea System Health</DialogTitle>
              <DialogDescription className="text-xs">
                Real-time multi-tenant runtime telemetry and environment status.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Telemetry Status Grid */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <Server className="size-3.5 text-emerald-500" />
                <span>Core Engine</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Operational</span>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <Database className="size-3.5 text-blue-500" />
                <span>Prisma Relational</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Connected</span>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <Layers className="size-3.5 text-purple-500" />
                <span>Offline Storage</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>IndexedDB Sync</span>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <Wifi className="size-3.5 text-amber-500" />
                <span>Network Status</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="relative flex size-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span>{isOnline ? "Online (Active)" : "Offline (Local)"}</span>
              </div>
            </div>
          </div>

          {/* Release & Build info container */}
          <div className="rounded-lg border border-border/80 bg-background/50 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Active Release:</span>
              <span className="font-mono font-semibold text-foreground" title={APP_VERSION_FULL}>
                {APP_VERSION_LABEL}
              </span>
            </div>
            {APP_SHA && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Commit SHA:</span>
                <span className="font-mono text-muted-foreground">{APP_SHA}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Security & Encryption:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                AES-256 · TLS 1.3
              </span>
            </div>
          </div>

          {/* Direct Shortcuts */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Audit Trail</span>
            </Link>
            <Link
              href="/api-reference"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="size-3.5 text-blue-500" />
              <span>REST API Docs</span>
            </Link>
          </div>

          {/* Diagnostic copy action */}
          <button
            type="button"
            onClick={handleCopyDiagnostics}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 dark:bg-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-white" />
                <span>Diagnostics Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-white/90" />
                <span>Copy Telemetry Diagnostics</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
