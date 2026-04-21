"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Matières"
        description="Matières enseignées et coefficients"
        icon={<BookOpen className="size-5" />}
        breadcrumbs={[{ label: "Matières" }]}
      />
      <ComingSoon
        icon={BookOpen}
        title="Matières & coefficients"
        description="Configurez les matières par établissement et leurs coefficients par niveau."
        features={[
          "Matières par cycle (primaire / secondaire)",
          "Coefficients variables par niveau",
          "Couleur personnalisée par matière",
          "Types d'évaluations associés",
          "Poids par défaut (interro, devoir, compo)",
        ]}
      />
    </div>
  );
}
