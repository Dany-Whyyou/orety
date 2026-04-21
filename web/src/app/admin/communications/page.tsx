"use client";

import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Communications"
        description="Annonces et notifications"
        icon={<Megaphone className="size-5" />}
        breadcrumbs={[{ label: "Communications" }]}
      />
      <ComingSoon
        icon={Megaphone}
        title="Annonces & notifications"
        description="Diffusez des annonces aux parents et aux professeurs."
        features={[
          "Annonce par établissement ou par classe",
          "Publication planifiée",
          "Notifications push (app mobile)",
          "Email (si fourni)",
          "Historique et statistiques de lecture",
          "Modèles réutilisables",
        ]}
      />
    </div>
  );
}
