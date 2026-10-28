"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type DeviceVariation = "desktop" | "tablet" | "mobile";

export const BANNER_VARIATIONS: Record<DeviceVariation, string> = {
  desktop: "/assets/aistudio/Localea_Rental_Management_Hero_Banner_6cc2ec1a.png",
  tablet: "/assets/aistudio/Localea_Rental_Management_Hero_Banner_tablet.png",
  mobile: "/assets/aistudio/Localea_Rental_Management_Hero_Banner_mobile.png",
};

export const BANNER_SRC = BANNER_VARIATIONS.desktop;
export const BANNER_PAUSE_DURATION_MS = 2000; // 2 seconds pause on hero banner

export interface ShowcaseVideo {
  id: number;
  label: string;
  title: string;
  subtitle: string;
  src: string;
  variations: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
}

export const SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  {
    id: 1,
    label: "1. Tour",
    title: "Apartment Walkthrough",
    subtitle: "Manager & tenant interior walkthrough & inspection",
    src: "/videos/variations/1-localea-touring-desktop.mp4",
    variations: {
      desktop: "/videos/variations/1-localea-touring-desktop.mp4",
      tablet: "/videos/variations/1-localea-touring-tablet.mp4",
      mobile: "/videos/variations/1-localea-touring-mobile.mp4",
    },
  },
  {
    id: 2,
    label: "2. Residence",
    title: "Residential Estate",
    subtitle: "Resident approaching modern residential community",
    src: "/videos/variations/2-localea-residence-desktop.mp4",
    variations: {
      desktop: "/videos/variations/2-localea-residence-desktop.mp4",
      tablet: "/videos/variations/2-localea-residence-tablet.mp4",
      mobile: "/videos/variations/2-localea-residence-mobile.mp4",
    },
  },
  {
    id: 4,
    label: "4. Features",
    title: "Platform Features",
    subtitle: "Corporate motion graphics & property management automation",
    src: "/videos/variations/4-localea-features-desktop.mp4",
    variations: {
      desktop: "/videos/variations/4-localea-features-desktop.mp4",
      tablet: "/videos/variations/4-localea-features-tablet.mp4",
      mobile: "/videos/variations/4-localea-features-mobile.mp4",
    },
  },
];

interface VideoShowcaseBackdropProps {
  children?: React.ReactNode;
  cardTitle?: string;
  isFormVisible?: boolean;
  onToggleForm?: () => void;
  // Legacy aliases for backward compatibility
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  expandLabel?: string;
  collapseLabel?: string;
}

export function VideoShowcaseBackdrop({
  children,
  cardTitle: _cardTitle = "Form",
  isFormVisible: controlledVisible,
  onToggleForm: controlledToggleForm,
  isMinimized: controlledMinimized,
  onToggleMinimize: controlledToggleMinimize,
  expandLabel = "Show Sign-in Form",
  collapseLabel = "Hide Sign-in Form",
}: VideoShowcaseBackdropProps) {
  const [internalVisible, setInternalVisible] = useState(true);
  const isFormVisible =
    controlledVisible !== undefined
      ? controlledVisible
      : controlledMinimized !== undefined
      ? !controlledMinimized
      : internalVisible;

  const handleToggle = useCallback(() => {
    if (controlledToggleForm) {
      controlledToggleForm();
    } else if (controlledToggleMinimize) {
      controlledToggleMinimize();
    } else {
      setInternalVisible((prev) => !prev);
    }
  }, [controlledToggleForm, controlledToggleMinimize]);

  // CSS auto-responsive screen format tracking (no manual buttons needed)
  const [activeDevice, setActiveDevice] = useState<DeviceVariation>("desktop");

  useEffect(() => {
    function detect() {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      if (w < 640) {
        setActiveDevice("mobile");
      } else if (w < 1024) {
        setActiveDevice("tablet");
      } else {
        setActiveDevice("desktop");
      }
    }
    detect();
    window.addEventListener("resize", detect);
    return () => window.removeEventListener("resize", detect);
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const currentVideo = SHOWCASE_VIDEOS[currentIndex % SHOWCASE_VIDEOS.length];

  // Update video element when current index or source changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = isMuted;

    const playVideo = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            if (!video.muted) {
              video.muted = true;
              setIsMuted(true);
              video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            } else {
              setIsPlaying(false);
            }
          });
      }
    };

    if (video.readyState >= 2) {
      playVideo();
    } else {
      video.addEventListener("canplay", playVideo, { once: true });
      video.addEventListener("loadeddata", playVideo, { once: true });
    }

    return () => {
      video.removeEventListener("canplay", playVideo);
      video.removeEventListener("loadeddata", playVideo);
    };
  }, [currentIndex, isMuted, activeDevice]);

  // Video ended -> show banner for exactly 2 seconds, then advance
  const handleVideoEnded = useCallback(() => {
    setShowBanner(true);
    const timer = setTimeout(() => {
      setShowBanner(false);
      setCurrentIndex((prev) => (prev + 1) % SHOWCASE_VIDEOS.length);
    }, BANNER_PAUSE_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-svh w-full overflow-hidden select-none bg-slate-950">
      {/* 1. Underlying Persistent Base Hero Banner (CSS Auto-Responsive) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BANNER_VARIATIONS.mobile}
        alt="Localea Rental Management Mobile"
        className="absolute inset-0 size-full object-cover object-center z-0 pointer-events-none block sm:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BANNER_VARIATIONS.tablet}
        alt="Localea Rental Management Tablet"
        className="absolute inset-0 size-full object-cover object-center z-0 pointer-events-none hidden sm:block lg:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BANNER_VARIATIONS.desktop}
        alt="Localea Rental Management Desktop"
        className="absolute inset-0 size-full object-cover object-center z-0 pointer-events-none hidden lg:block"
      />

      {/* 2. HTML5 Video Player (Auto-Responsive Stream Matching Screen Viewport) */}
      <video
        ref={videoRef}
        key={`${activeDevice}-${currentVideo.id}`}
        src={currentVideo.variations[activeDevice]}
        className={cn(
          "absolute inset-0 size-full object-cover object-center z-[1] transition-opacity duration-700 ease-in-out pointer-events-none",
          showBanner ? "opacity-0" : "opacity-100"
        )}
        autoPlay
        muted={isMuted}
        playsInline
        preload="auto"
        onEnded={handleVideoEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={currentVideo.variations.mobile} media="(max-width: 639px)" type="video/mp4" />
        <source src={currentVideo.variations.tablet} media="(max-width: 1023px)" type="video/mp4" />
        <source src={currentVideo.variations.desktop} type="video/mp4" />
      </video>

      {/* 3. 2-Second Intermediate Banner Cross-Fade Overlay (CSS Auto-Responsive) */}
      <div
        className={cn(
          "absolute inset-0 size-full z-[2] transition-opacity duration-700 ease-in-out pointer-events-none",
          showBanner ? "opacity-100" : "opacity-0"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BANNER_VARIATIONS.mobile}
          alt="Localea Rental Management Mobile Transition"
          className="size-full object-cover object-center block sm:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BANNER_VARIATIONS.tablet}
          alt="Localea Rental Management Tablet Transition"
          className="size-full object-cover object-center hidden sm:block lg:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BANNER_VARIATIONS.desktop}
          alt="Localea Rental Management Desktop Transition"
          className="size-full object-cover object-center hidden lg:block"
        />
      </div>

      {/* 4. Adaptive Ambient Overlay */}
      <div
        className={cn(
          "absolute inset-0 z-[3] transition-all duration-500 pointer-events-none",
          !isFormVisible ? "bg-black/15 backdrop-blur-none" : "bg-black/35 backdrop-blur-[1.5px]"
        )}
      />

      {/* 5. Top Right Quick Toggle: Only single control on page */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isFormVisible ? collapseLabel : expandLabel}
          aria-expanded={isFormVisible}
          data-testid="toggle-auth-form"
          className="inline-flex items-center justify-center gap-2 border border-white/40 bg-slate-900/90 hover:bg-slate-850 text-white hover:text-emerald-300 hover:border-emerald-400/60 backdrop-blur-md shadow-2xl cursor-pointer text-xs font-semibold px-4 py-2.5 transition-all rounded-full active:scale-95 select-none focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
        >
          {isFormVisible ? (
            <>
              <EyeOff className="size-4 text-amber-300 shrink-0" />
              <span>{collapseLabel}</span>
            </>
          ) : (
            <>
              <Eye className="size-4 text-emerald-400 shrink-0" />
              <span>{expandLabel}</span>
            </>
          )}
        </button>
      </div>

      {/* 6. Main Interactive Card Container: cleanly hidden when toggled off */}
      {isFormVisible && (
        <div className="relative z-10 flex min-h-svh items-center justify-center p-4 sm:p-6 lg:p-10 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full flex justify-center">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
