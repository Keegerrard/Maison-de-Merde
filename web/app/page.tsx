import type { Metadata } from "next";
import FloatingNav from "@/components/landing/FloatingNav";
import ScrollTrailRail from "@/components/landing/ScrollTrailRail";
import ScrollDescentHero from "@/components/landing/ScrollDescentHero";
import IntroSection from "@/components/landing/IntroSection";
import ManifestoStatement from "@/components/landing/ManifestoStatement";
import ServicesList from "@/components/landing/ServicesList";
import SubsystemGrid from "@/components/landing/SubsystemGrid";
import FoundationsWall from "@/components/landing/FoundationsWall";
import JournalTeaserGrid from "@/components/landing/JournalTeaserGrid";
import EnterPanel from "@/components/landing/EnterPanel";
import FooterWordmark from "@/components/ui/FooterWordmark";

export const metadata: Metadata = {
  title: "Maison de Merde. Purveyors of Fine Digestive Distinction",
  description:
    "A complete record of the one thing you have never written down. Bristol Stool Scale logging, a streak engine, private circles, and a doctor export.",
};

export default function LandingPage() {
  return (
    <>
      <FloatingNav />
      <ScrollTrailRail />
      <main>
        <ScrollDescentHero />
        <IntroSection />
        <ManifestoStatement />
        <ServicesList />
        <SubsystemGrid />
        <FoundationsWall />
        <JournalTeaserGrid />
        <EnterPanel />
      </main>
      <FooterWordmark />
    </>
  );
}
