import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EtablissementsList } from "@/components/etablissements/etablissements-list";
import { getEtablissements } from "@/lib/queries/etablissements";

export const dynamic = "force-dynamic";

export default async function Page() {
  const etablissements = await getEtablissements();

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Établissements"
        description={
          etablissements.length === 0
            ? "Aucun site créé"
            : `${etablissements.length} site${etablissements.length > 1 ? "s" : ""}`
        }
        icon={<Building2 className="size-5" />}
        breadcrumbs={[{ label: "Établissements" }]}
      />
      <EtablissementsList etablissements={etablissements} />
    </div>
  );
}
