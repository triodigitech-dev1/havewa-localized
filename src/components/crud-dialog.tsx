"use client";

import * as React from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ActionState } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { enqueueOfflineItem } from "@/lib/offline-sync";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export function CrudDialog({
  trigger,
  title,
  action,
  submitLabel,
  children,
}: {
  trigger: React.ReactElement;
  title: string;
  action: Action;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // If a server action throws or fails due to network/offline conditions,
  // gracefully intercept it, save to offline sync queue if appropriate,
  // and maintain NEXT_REDIRECTs intact.
  const safeAction: Action = async (prev, fd) => {
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    if (isOffline) {
      const payload: Record<string, unknown> = {};
      fd.forEach((value, key) => {
        if (!(value instanceof File)) {
          payload[key] = value;
        }
      });

      let actionType = "GENERIC_SUBMIT";
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("ticket") || lowerTitle.includes("maintenance") || lowerTitle.includes("schaden") || lowerTitle.includes("störung")) {
        actionType = "CREATE_TICKET";
      } else if (lowerTitle.includes("meter") || lowerTitle.includes("zähler") || fd.has("meterId")) {
        actionType = "RECORD_READING";
      } else if (lowerTitle.includes("task") || lowerTitle.includes("aufgabe")) {
        actionType = "CREATE_TASK";
      } else if (lowerTitle.includes("issue") || lowerTitle.includes("report") || lowerTitle.includes("melden")) {
        actionType = "REPORT_ISSUE";
      }

      await enqueueOfflineItem({
        actionType,
        endpoint: "/api/offline-sync",
        payload,
        description: `${title}: ${payload.title || payload.label || payload.name || "Form submission"}`,
      });

      return {
        ok: true,
        error: undefined,
      };
    }

    try {
      return await action(prev, fd);
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "digest" in e &&
        String((e as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
      ) {
        throw e;
      }

      // Check if failure was caused by lost connectivity
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
        const payload: Record<string, unknown> = {};
        fd.forEach((value, key) => {
          if (!(value instanceof File)) payload[key] = value;
        });
        await enqueueOfflineItem({
          actionType: "GENERIC_SUBMIT",
          endpoint: "/api/offline-sync",
          payload,
          description: `${title}: ${payload.title || payload.label || payload.name || "Form submission"}`,
        });
        return { ok: true };
      }

      return { error: e instanceof Error ? e.message : t("actionFailed") };
    }
  };

  const [state, formAction, pending] = useActionState<ActionState, FormData>(safeAction, {});

  // Handle success exactly once per submission to prevent infinite toast re-render loops
  const handledState = useRef<ActionState | null>(null);
  useEffect(() => {
    if (state.ok && handledState.current !== state) {
      handledState.current = state;
      setOpen(false);
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      if (isOffline) {
        toast.info("Saved offline. We'll automatically sync this when connection is restored.");
      } else {
        toast.success(t("saved"));
      }
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {/* Key remounts fresh inputs each time dialog opens */}
        <form action={formAction} key={open ? "open" : "closed"} className="space-y-4">
          {children}
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {submitLabel ?? t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
