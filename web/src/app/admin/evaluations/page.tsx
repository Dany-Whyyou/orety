"use client";

import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Évaluations"
        description="Suivi des évaluations et des notes saisies"
        icon={<ClipboardList className="size-5" />}
        breadcrumbs={[{ label: "Évaluations" }]}
      />
      <ComingSoon
        icon={ClipboardList}
        title="Évaluations & notes"
        description="Supervisez les évaluations saisies par les professeurs. Barème libre, bonus autorisé, normalisation automatique sur 20."
        features={[
          "Types d'évaluation (interro, devoir, compo)",
          "Barème libre (sur 10, 20, 40…)",
          "Bonus activable par évaluation",
          "Pondération par poids × coefficient",
          "Suivi par matière × classe × période",
          "Alertes sur notes manquantes",
        ]}
      />
    </div>
  );
}
