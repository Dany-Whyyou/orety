"use client";

import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Paramètres"
        description="Configuration de l'organisation"
        icon={<Settings className="size-5" />}
        breadcrumbs={[{ label: "Paramètres" }]}
      />
      <ComingSoon
        icon={Settings}
        title="Paramètres de l'organisation"
        description="Branding, préférences, intégrations et sécurité."
        features={[
          "Logo et couleurs (white-labeling)",
          "Coordonnées (adresse, téléphone, email)",
          "Fuseau horaire et localisation",
          "Politique de mot de passe",
          "Paramètres d'envoi email / SMS",
          "Journal d'audit",
        ]}
      />
    </div>
  );
}
