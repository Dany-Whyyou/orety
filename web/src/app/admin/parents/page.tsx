"use client";

import { KeyRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Comptes parents"
        description="Accès par pseudo mnémonique — clés parentales"
        icon={<KeyRound className="size-5" />}
        breadcrumbs={[{ label: "Parents" }]}
      />
      <ComingSoon
        icon={KeyRound}
        title="Comptes parents & clés parentales"
        description="Gérez les comptes de suivi parental. Le pseudo sert de clé parentale dans la table des élèves : tous les enfants avec la même clé sont vus par le même compte."
        features={[
          "Pseudo mnémonique auto (ex: DOVI-MP-26)",
          "Mot de passe généré à l'inscription",
          "PIN défini par le parent à la 1ère connexion",
          "Envoi des accès par email (si fourni)",
          "Régénération de mot de passe",
          "Vue des enfants liés à chaque compte",
        ]}
      />
    </div>
  );
}
