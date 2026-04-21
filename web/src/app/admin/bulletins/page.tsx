"use client";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Bulletins"
        description="Génération, édition et publication"
        icon={<FileText className="size-5" />}
        breadcrumbs={[{ label: "Bulletins" }]}
      />
      <ComingSoon
        icon={FileText}
        title="Moteur de bulletins"
        description="Génération automatique des bulletins par période et du bulletin annuel selon la formule configurée."
        features={[
          "Bulletin par période (trimestre/semestre/mois)",
          "Bulletin annuel via formule personnalisée",
          "Moyennes pondérées par coefficient",
          "Rang dans la classe",
          "Appréciations profs",
          "Export PDF avec logo et signature",
        ]}
      />
    </div>
  );
}
