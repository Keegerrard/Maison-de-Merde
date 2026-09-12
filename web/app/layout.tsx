import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import GrainOverlay from "@/components/ui/GrainOverlay";
import ToastProvider from "@/components/ui/ToastProvider";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ThemeProvider, NO_FLASH_THEME_SCRIPT } from "@/hooks/useTheme";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maison de Merde. Purveyors of Fine Digestive Distinction",
  description:
    "A complete record of the one thing you have never written down. Bristol Stool Scale logging, a streak engine, private circles, and a doctor export. Established 2026.",
  openGraph: {
    title: "Maison de Merde",
    description:
      "A complete record of the one thing you have never written down.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        {/* Sets data-theme on <html> synchronously, before first paint,
            reading the persisted choice from localStorage. Must run before
            any CSS relying on [data-theme="light"] is applied, and before
            React hydrates — a useEffect in ThemeProvider would be a frame
            too late and cause a visible flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
        <meta name="google" content="notranslate" />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>{children}</ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
        <GrainOverlay />
      </body>
    </html>
  );
}
