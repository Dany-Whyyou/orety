"use client";

import { Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Rôles & accès"
        description="Gestionnaire de rôles sur mesure (RBAC)"
        icon={<Shield className="size-5" />}
        breadcrumbs={[{ label: "Paramètres", href: "/admin/parametres" }, { label: "Rôles & accès" }]}
      />
      <ComingSoon
        icon={Shield}
        title="Rôles & permissions"
        description="Créez des rôles sur mesure (comptable, surveillant, infirmier, censeur…) en combinant des permissions granulaires du catalogue système."
        features={[
          "Rôles système verrouillés (super admin, admin org, prof…)",
          "Création de rôles sur mesure",
          "Sélection des permissions par domaine",
          "Garde-fou anti-escalade de privilèges",
          "Attribution à un ou plusieurs utilisateurs",
          "Journal des changements de rôles",
        ]}
      />
    </div>
  );
}
