import { UserSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AffectationsView } from "@/components/affectations/affectations-view";
import { getAffectations, getAffectationFormData } from "@/lib/queries/affectations";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [affectations, formData] = await Promise.all([
    getAffectations(),
    getAffectationFormData(),
  ]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Affectations"
        description={
          affectations.length === 0
            ? "Aucune affectation"
            : `${affectations.length} affectation${affectations.length > 1 ? "s" : ""}`
        }
        icon={<UserSquare className="size-5" />}
        breadcrumbs={[{ label: "Affectations" }]}
      />
      <AffectationsView
        affectations={affectations}
        profs={formData.profs}
        classes={formData.classes}
        matieres={formData.matieres}
        annees={formData.annees}
      />
    </div>
  );
}
