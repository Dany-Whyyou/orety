import type { Metadata } from "next";
import { VitrineNavbar } from "@/components/vitrine/navbar";
import { VitrineHero } from "@/components/vitrine/hero";
import { VitrineBande } from "@/components/vitrine/bande";
import { VitrineCycles } from "@/components/vitrine/cycles";
import { VitrineAtouts } from "@/components/vitrine/atouts";
import { VitrineCulture } from "@/components/vitrine/culture";
import { VitrineParallax } from "@/components/vitrine/parallax-banner";
import { VitrineGalerie } from "@/components/vitrine/galerie";
import { VitrineAdmissions } from "@/components/vitrine/admissions";
import { VitrineContact } from "@/components/vitrine/contact";
import { VitrineFooter } from "@/components/vitrine/footer";

export const metadata: Metadata = {
  title: "Complexe Scolaire Orety — Pré-primaire, Primaire, Collège & Lycée à Port-Gentil",
  description:
    "Le Complexe Scolaire Orety (C.S.O) accueille vos enfants dès 3 ans, du pré-primaire au lycée, à Port-Gentil. 100 % de réussite au CEP et à l'entrée en 6e. Inscriptions ouvertes tous les jours ouvrables de 8h à 13h.",
  keywords: [
    "école Port-Gentil",
    "Complexe Scolaire Orety",
    "C.S.O",
    "pré-primaire",
    "primaire",
    "collège",
    "lycée",
    "inscriptions",
    "Gabon",
  ],
  openGraph: {
    title: "Complexe Scolaire Orety — La référence à Port-Gentil",
    description:
      "Du pré-primaire au lycée : persévérance, excellence, la référence. Inscriptions 2026-2027 ouvertes.",
    locale: "fr_GA",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <VitrineNavbar />
      <main className="flex-1">
        <VitrineHero />
        <VitrineBande />
        <VitrineCycles />
        <VitrineAtouts />
        <VitrineCulture />
        <VitrineParallax />
        <VitrineGalerie />
        <VitrineAdmissions />
        <VitrineContact />
      </main>
      <VitrineFooter />
    </div>
  );
}
