import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AnneesList } from "@/components/annees/annees-list";
import { getAnnees, getEtablissementsForForms } from "@/lib/queries/annees";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [annees, etablissements] = await Promise.all([
    getAnnees(),
    getEtablissementsForForms(),
  ]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Années scolaires"
        description={
          annees.length === 0
            ? "Aucune année créée"
            : `${annees.length} année${annees.length > 1 ? "s" : ""}`
        }
        icon={<Calendar className="size-5" />}
        breadcrumbs={[{ label: "Années scolaires" }]}
      />
      <AnneesList annees={annees} etablissements={etablissements} />
    </div>
  );
}
