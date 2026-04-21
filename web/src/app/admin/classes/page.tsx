"use client";

import { LibraryBig } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Classes"
        description="Groupes d'élèves de l'année en cours"
        icon={<LibraryBig className="size-5" />}
        breadcrumbs={[{ label: "Classes" }]}
      />
      <ComingSoon
        icon={LibraryBig}
        title="Classes de l'année"
        description="Gérez les classes, leur effectif et leur titulaire (pour le primaire)."
        features={[
          "Création par niveau × année",
          "Titulaire unique (primaire)",
          "Capacité maximum",
          "Répartition des élèves",
          "Vue d'emploi du temps",
          "Statistiques de classe",
        ]}
      />
    </div>
  );
}
