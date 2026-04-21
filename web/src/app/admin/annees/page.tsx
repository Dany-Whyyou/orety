"use client";

import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Années scolaires"
        description="Configurer les années et la fréquence des bulletins"
        icon={<Calendar className="size-5" />}
        breadcrumbs={[{ label: "Années scolaires" }]}
      />
      <ComingSoon
        icon={Calendar}
        title="Années scolaires & bulletins"
        description="Définissez chaque année scolaire, la fréquence de sortie des bulletins et la formule du bulletin annuel."
        features={[
          "Fréquence : mensuelle, trimestrielle, semestrielle",
          "Éditeur visuel de formule annuelle (ex: T1 + T2×2 + T3×2 ÷ 5)",
          "Périodes générées automatiquement",
          "Activation de l'année en cours",
          "Historique des années passées",
          "Configuration spécifique par établissement",
        ]}
      />
    </div>
  );
}
