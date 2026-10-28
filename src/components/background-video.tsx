"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const BANNER_SRC = "/assets/aistudio/Localea_Rental_Management_Hero_Banner_6cc2ec1a.png";
const BANNER_PAUSE_DURATION_MS = 2000; // Sticks banner for 2 seconds after each video finishes

// Active Video Rotation: Strictly limited to videos 1, 2, and 4
const CURATED_VIDEOS = [
  "/videos/1-localea-touring.mp4",
  "/videos/2-localea-residence.mp4",
  "/videos/4-localea-features.mp4",
];

/**
 * BackgroundVideo Component
 *
 * Active Video Rotation: Strictly limited to videos 1, 2, and 4:
 * 1-localea-touring.mp4 (Manager and tenant walkthrough)
 * 2-localea-residence.mp4 (Resident approaching residential estate)
 * 4-localea-features.mp4 (Corporate features motion graphic)
 *
 * Zero Empty/Black Screen:
 * A persistent underlying base hero banner is always mounted.
 * When each video finishes, the Localea Hero Banner sticks for 2 seconds before
 * smoothly cross-fading into the next video in an infinite loop.
 */
export function BackgroundVideo({
  sources: _sources,
  className,
}: {
  sources?: string[];
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  const currentSource = CURATED_VIDEOS[currentIndex % CURATED_VIDEOS.length];

  // Play video on mount and whenever currentIndex changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    // Load and play
    const play = async () => {
      try {
        await video.play();
      } catch {
        // Retry muted in case user agent requires explicit interaction
        video.muted = true;
        try {
          await video.play();
        } catch {
          // If browser completely blocks autoplay, ensure banner is displayed
        }
      }
    };

    play();
  }, [currentIndex]);

  // When video completes, stick banner for 2 seconds then smoothly advance
  const handleVideoEnded = () => {
    setShowBanner(true);

    const timer = setTimeout(() => {
      setShowBanner(false);
      setCurrentIndex((prev) => (prev + 1) % CURATED_VIDEOS.length);
    }, BANNER_PAUSE_DURATION_MS);

    return () => clearTimeout(timer);
  };

  return (
    <div className={cn("relative size-full overflow-hidden select-none pointer-events-none", className)}>
      {/* 1. Persistent Base Hero Banner - ensures ZERO blank frames under any condition */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BANNER_SRC}
        alt="Localea Rental Management"
        className="absolute inset-0 size-full object-cover object-center"
      />

      {/* 2. HTML5 Video Layer */}
      <video
        ref={videoRef}
        key={currentSource}
        src={currentSource}
        className={cn(
          "absolute inset-0 size-full object-cover object-center transition-opacity duration-700 ease-in-out",
          showBanner ? "opacity-0" : "opacity-100"
        )}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoEnded}
      />

      {/* 3. Intermediate Banner Overlay Layer with smooth cross-fade */}
      <div
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-700 ease-in-out",
          showBanner ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BANNER_SRC}
          alt="Localea Rental Management Banner"
          className="size-full object-cover object-center"
        />
      </div>
    </div>
  );
}
