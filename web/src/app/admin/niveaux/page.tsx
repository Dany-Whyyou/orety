"use client";

import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Niveaux"
        description="CP, CE1, 6ème, Terminale, etc. — par cycle"
        icon={<GraduationCap className="size-5" />}
        breadcrumbs={[{ label: "Niveaux" }]}
      />
      <ComingSoon
        icon={GraduationCap}
        title="Niveaux scolaires"
        description="Définissez les niveaux par cycle et leur ordre de progression."
        features={[
          "Niveaux primaire : CP, CE1, CE2, CM1, CM2",
          "Niveaux collège : 6ème, 5ème, 4ème, 3ème",
          "Niveaux lycée : 2nde, 1ère, Terminale",
          "Tri et hiérarchie automatiques",
          "Coefficients par matière × niveau",
        ]}
      />
    </div>
  );
}
