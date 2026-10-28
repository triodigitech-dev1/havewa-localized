"use client";

import { useTransition } from "react";
import { Sparkles, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { toggleDemoMode } from "@/server/actions/setup";
import { Button } from "@/components/ui/button";

export function DemoModeBanner({ isDemo }: { isDemo: boolean }) {
  const [isPending, startTransition] = useTransition();

  function onToggle() {
    startTransition(async () => {
      await toggleDemoMode();
    });
  }

  if (!isDemo) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between dark:border-amber-400/20 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300">
          <Sparkles className="size-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
            <span>Interactive Guided Demo Mode</span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
              Demo Active
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            You are exploring Localea with representative sample rental units, leases, and financial records. You can switch to clean live mode at any time.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onToggle}
          disabled={isPending}
          className="border-amber-500/30 bg-card hover:bg-muted"
        >
          {isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : isDemo ? (
            <ToggleRight className="mr-1.5 size-4 text-emerald-600" />
          ) : (
            <ToggleLeft className="mr-1.5 size-4" />
          )}
          {isDemo ? "Switch to Clean Live Data" : "Enable Demo Guide Data"}
        </Button>
      </div>
    </div>
  );
}
