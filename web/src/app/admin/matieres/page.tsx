import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MatieresList } from "@/components/matieres/matieres-list";
import { getMatieres } from "@/lib/queries/matieres";
import { getEtablissementsForForms } from "@/lib/queries/annees";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [groups, etablissements] = await Promise.all([
    getMatieres(),
    getEtablissementsForForms(),
  ]);
  const total = groups.reduce((s, g) => s + g.matieres.length, 0);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Matières"
        description={
          total === 0
            ? "Aucune matière"
            : `${total} matière${total > 1 ? "s" : ""} sur ${groups.length} site${groups.length > 1 ? "s" : ""}`
        }
        icon={<BookOpen className="size-5" />}
        breadcrumbs={[{ label: "Matières" }]}
      />
      <MatieresList groups={groups} etablissements={etablissements} />
    </div>
  );
}
