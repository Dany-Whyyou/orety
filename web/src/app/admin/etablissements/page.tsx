"use client";

import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Établissements"
        description="Gérer les sites de l'organisation Orety"
        icon={<Building2 className="size-5" />}
        breadcrumbs={[{ label: "Établissements" }]}
      />
      <ComingSoon
        icon={Building2}
        title="Gestion des établissements"
        description="Configurez vos sites (pré-primaire, primaire, collège, lycée), leur identité visuelle et leurs responsables."
        features={[
          "Logo et couleurs par établissement",
          "Adresse, téléphone, email",
          "Désignation du directeur de site",
          "Cycle principal (pré-primaire, primaire…)",
          "Activation / désactivation",
          "Vue d'ensemble des effectifs",
        ]}
      />
    </div>
  );
}
