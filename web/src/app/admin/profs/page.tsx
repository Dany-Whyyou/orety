"use client";

import { UserCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Professeurs"
        description="62 professeurs actifs"
        icon={<UserCheck className="size-5" />}
        breadcrumbs={[{ label: "Professeurs" }]}
      />
      <ComingSoon
        icon={UserCheck}
        title="Gestion des professeurs"
        description="Créez les comptes professeurs (pseudo PR-*), gérez leurs matières enseignables et leurs interventions multi-sites."
        features={[
          "Pseudo auto-généré (ex: PR-DOVI-D)",
          "Matières enseignables par prof",
          "Intervention sur plusieurs établissements",
          "Historique des affectations",
          "Photo, contacts, matricule",
          "Envoi des accès (email ou imprimé)",
        ]}
      />
    </div>
  );
}
