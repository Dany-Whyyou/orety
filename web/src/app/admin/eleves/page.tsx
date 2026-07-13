import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ElevesTable } from "@/components/eleves/eleves-table";
import { getEleves, getEleveFormData } from "@/lib/queries/eleves";
import { getParentsForPicker } from "@/lib/queries/parents";

export const dynamic = "force-dynamic";

export default async function ElevesPage({
  searchParams,
}: {
  searchParams: Promise<{ recherche?: string }>;
}) {
  const { recherche } = await searchParams;
  const [eleves, formData, parents] = await Promise.all([
    getEleves(),
    getEleveFormData(),
    getParentsForPicker(),
  ]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Élèves"
        description={
          eleves.length === 0
            ? "Aucun élève inscrit pour l'instant"
            : `${eleves.length} élève${eleves.length > 1 ? "s" : ""}`
        }
        icon={<Users className="size-5" />}
        breadcrumbs={[{ label: "Élèves" }]}
      />
      <ElevesTable
        initialSearch={recherche ?? ""}
        eleves={eleves}
        etablissements={formData.etablissements}
        classes={formData.classes}
        annees={formData.annees}
        parents={parents}
      />
    </div>
  );
}
