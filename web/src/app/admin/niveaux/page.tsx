import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NiveauxList } from "@/components/niveaux/niveaux-list";
import { getNiveaux } from "@/lib/queries/niveaux";
import { getEtablissementsForForms } from "@/lib/queries/annees";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [groups, etablissements] = await Promise.all([
    getNiveaux(),
    getEtablissementsForForms(),
  ]);
  const total = groups.reduce((s, g) => s + g.niveaux.length, 0);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Niveaux"
        description={
          total === 0
            ? "Aucun niveau défini"
            : `${total} niveau${total > 1 ? "x" : ""} répartis sur ${groups.length} site${groups.length > 1 ? "s" : ""}`
        }
        icon={<GraduationCap className="size-5" />}
        breadcrumbs={[{ label: "Niveaux" }]}
      />
      <NiveauxList groups={groups} etablissements={etablissements} />
    </div>
  );
}
