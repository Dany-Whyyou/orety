"use client";

import { CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function Page() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Présences"
        description="Suivi des présences et absences"
        icon={<CalendarCheck className="size-5" />}
        breadcrumbs={[{ label: "Présences" }]}
      />
      <ComingSoon
        icon={CalendarCheck}
        title="Présences & absences"
        description="Visualisez et modifiez les présences saisies par les professeurs."
        features={[
          "Vue par classe × jour / semaine",
          "Statuts : présent, absent, retard, excusé",
          "Commentaires par prof",
          "Notifications automatiques aux parents",
          "Statistiques mensuelles",
          "Justificatifs rattachés",
        ]}
      />
    </div>
  );
}
