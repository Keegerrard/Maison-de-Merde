import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import GrainOverlay from "@/components/ui/GrainOverlay";
import ToastProvider from "@/components/ui/ToastProvider";
import { LanguageProvider } from "@/hooks/useLanguage";
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
        <meta name="color-scheme" content="light" />
        <meta name="google" content="notranslate" />
      </head>
      <body>
        <LanguageProvider>
          <ToastProvider>{children}</ToastProvider>
        </LanguageProvider>
        <GrainOverlay />
      </body>
    </html>
  );
}
