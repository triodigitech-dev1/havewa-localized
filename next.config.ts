import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import createNextIntlPlugin from "next-intl/plugin";
import pkg from "./package.json";

const withNextIntl = createNextIntlPlugin();

// UI Version metadata. Semver from package.json; build number + SHA are injected in CI
// via build args. Falls back gracefully when .git is not available in production environments.
function git(cmd: string): string {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}
const build = process.env.APP_BUILD || git("git rev-list --count HEAD") || "dev";
const sha = (process.env.APP_SHA || git("git rev-parse --short HEAD") || "").slice(0, 7);

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "ais-dev-v345mpcr23igjuimvlqxcg-509263414167.europe-west3.run.app",
    "ais-pre-v345mpcr23igjuimvlqxcg-509263414167.europe-west3.run.app",
    "*.europe-west3.run.app",
    "ais-dev-xw2hukcazbrtpavxvxbovm-707597194129.europe-west2.run.app",
    "ais-pre-xw2hukcazbrtpavxvxbovm-707597194129.europe-west2.run.app",
    "*.europe-west2.run.app",
    "ais-dev-afceg3yzarru75gtat2f53-126716489888.europe-west2.run.app",
    "*.run.app",
    "localhost:3000",
  ],
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_APP_BUILD: build,
    NEXT_PUBLIC_APP_SHA: sha,
  },
};

export default withNextIntl(nextConfig);
