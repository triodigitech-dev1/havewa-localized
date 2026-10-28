import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { OfflineIndicator } from "@/components/offline-indicator";
import "../globals.css";

const sans = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const heading = Space_Grotesk({ variable: "--font-heading", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#064e3b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.DOMAIN ? `https://${process.env.DOMAIN}` : "https://rental.triotek.co.ke"),
  title: "Localea Rental & Property Management",
  description: "Modern rental and property management system for residential and commercial units, leases, tenants, accounting, and maintenance with KES currency support.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Localea",
  },
  icons: {
    icon: [
      { url: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/aistudio/favicon_1f4afa86.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Localea Rental & Property Management",
    description: "Modern rental and property management system for residential and commercial units, leases, tenants, accounting, and maintenance with KES currency support.",
    images: ["/assets/aistudio/Localea_Rental_Management_Hero_Banner_6cc2ec1a.png"],
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${sans.variable} ${heading.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            {children}
            <OfflineIndicator />
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
