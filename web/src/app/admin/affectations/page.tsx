"use client";

import { UserSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Affectations"
        description="Attribution prof × classe × matière"
        icon={<UserSquare className="size-5" />}
        breadcrumbs={[{ label: "Affectations" }]}
      />
      <ComingSoon
        icon={UserSquare}
        title="Affectations pédagogiques"
        description="Deux logiques selon le cycle : titulaire unique au primaire, prof par matière au collège/lycée."
        features={[
          "Primaire : un titulaire par classe (toutes matières)",
          "Collège / Lycée : une affectation par matière",
          "Un prof peut enseigner plusieurs matières",
          "Matrice visuelle classe × matière",
          "Vue par prof / par classe / par matière",
          "Détection automatique des lacunes",
        ]}
      />
    </div>
  );
}
