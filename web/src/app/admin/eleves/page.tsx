import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ElevesTable } from "@/components/eleves/eleves-table";
import { getEleves, getEleveFormData } from "@/lib/queries/eleves";
import { getParentsForPicker } from "@/lib/queries/parents";

export const dynamic = "force-dynamic";

export default async function ElevesPage({
  searchParams,
}: {
  searchParams: Promise<{
    recherche?: string;
    page?: string;
    etablissement?: string;
    cycle?: string;
    statut?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "0", 10) || 0;
  const statut =
    params.statut === "actif" || params.statut === "inactif" ? params.statut : undefined;

  const [resultat, formData, parents] = await Promise.all([
    getEleves({
      page,
      recherche: params.recherche,
      etablissement_id: params.etablissement,
      cycle: params.cycle,
      statut,
    }),
    getEleveFormData(),
    getParentsForPicker(),
  ]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Élèves"
        description={
          resultat.total === 0
            ? "Aucun élève inscrit pour l'instant"
            : `${resultat.total} élève${resultat.total > 1 ? "s" : ""}`
        }
        icon={<Users className="size-5" />}
        breadcrumbs={[{ label: "Élèves" }]}
      />
      <ElevesTable
        eleves={resultat.eleves}
        total={resultat.total}
        page={resultat.page}
        pageCount={resultat.pageCount}
        filtres={{
          recherche: params.recherche ?? "",
          etablissement: params.etablissement ?? "tous",
          cycle: params.cycle ?? "tous",
          statut: params.statut ?? "tous",
        }}
        etablissements={formData.etablissements}
        classes={formData.classes}
        annees={formData.annees}
        parents={parents}
      />
    </div>
  );
}
