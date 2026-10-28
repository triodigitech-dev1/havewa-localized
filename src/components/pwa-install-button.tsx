"use client";

import React, { useState } from "react";
import { Download, Share2, PlusSquare, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <Button
        onClick={install}
        size="sm"
        variant="outline"
        className={`flex items-center gap-1.5 border-emerald-600/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 font-medium ${className}`}
        title="Install Localea to your device"
      >
        <Download className="size-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </Button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <Button
          onClick={() => setShowIOSGuide(true)}
          size="sm"
          variant="outline"
          className={`flex items-center gap-1.5 border-emerald-600/30 text-xs text-emerald-700 dark:text-emerald-300 ${className}`}
          title="Install Localea on iPhone / iPad"
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Install</span>
        </Button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Download className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Install Localea</h3>
                  <p className="text-xs text-muted-foreground">Add to iPhone / iPad home screen</p>
                </div>
              </div>
              <ol className="mt-4 space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">1.</span>
                  <span>
                    Tap the <Share2 className="inline size-3.5 text-blue-500 mx-1 align-sub" /> <strong>Share</strong> button in the Safari toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">2.</span>
                  <span>
                    Scroll down and tap <PlusSquare className="inline size-3.5 text-foreground mx-1 align-sub" /> <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">3.</span>
                  <span>Tap <strong>Add</strong> in the top-right corner.</span>
                </li>
              </ol>
              <Button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
              >
                Got it
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
