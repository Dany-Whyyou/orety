"use client";

import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Rapports"
        description="Analytique et exports"
        icon={<BarChart3 className="size-5" />}
        breadcrumbs={[{ label: "Rapports" }]}
      />
      <ComingSoon
        icon={BarChart3}
        title="Rapports & analytique"
        description="Tableaux de bord avancés pour piloter l'établissement."
        features={[
          "Évolution des effectifs",
          "Performance par classe / matière",
          "Taux de réussite par cycle",
          "Absences chroniques",
          "Statistiques d'activité des profs",
          "Export Excel / PDF / CSV",
        ]}
      />
    </div>
  );
}
