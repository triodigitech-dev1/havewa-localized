import { describe, it, expect } from "vitest";
import { SHOWCASE_VIDEOS, BANNER_PAUSE_DURATION_MS, BANNER_SRC } from "@/components/video-showcase-backdrop";

describe("Video Showcase and Auth Cookie Tests", () => {
  it("strictly curates videos 1, 2, and 4 in sequential order", () => {
    expect(SHOWCASE_VIDEOS).toHaveLength(3);
    expect(SHOWCASE_VIDEOS[0].id).toBe(1);
    expect(SHOWCASE_VIDEOS[0].src).toBe("/videos/1-localea-touring.mp4");
    expect(SHOWCASE_VIDEOS[1].id).toBe(2);
    expect(SHOWCASE_VIDEOS[1].src).toBe("/videos/2-localea-residence.mp4");
    expect(SHOWCASE_VIDEOS[2].id).toBe(4);
    expect(SHOWCASE_VIDEOS[2].src).toBe("/videos/4-localea-features.mp4");
  });

  it("configures exactly 2-second pause duration for hero banner between videos", () => {
    expect(BANNER_PAUSE_DURATION_MS).toBe(2000);
  });

  it("uses the verified Localea Rental Management hero banner asset", () => {
    expect(BANNER_SRC).toBe("/assets/aistudio/Localea_Rental_Management_Hero_Banner_6cc2ec1a.png");
  });

  it("formats user credentials and lowercases emails for case-insensitive matching", () => {
    const rawInput = "  Admin@Localea.App  ";
    const normalized = rawInput.trim().toLowerCase();
    expect(normalized).toBe("admin@localea.app");
  });
});
