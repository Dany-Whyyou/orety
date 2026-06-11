import { UserCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ProfsList } from "@/components/profs/profs-list";
import { getProfs, getProfFormData } from "@/lib/queries/profs";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [profs, formData] = await Promise.all([getProfs(), getProfFormData()]);
  const actifs = profs.filter((p) => p.actif).length;

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Professeurs"
        description={
          profs.length === 0
            ? "Aucun prof enregistré"
            : `${actifs} prof${actifs > 1 ? "s" : ""} actif${actifs > 1 ? "s" : ""}${profs.length - actifs > 0 ? ` · ${profs.length - actifs} suspendu${profs.length - actifs > 1 ? "s" : ""}` : ""}`
        }
        icon={<UserCheck className="size-5" />}
        breadcrumbs={[{ label: "Professeurs" }]}
      />
      <ProfsList
        profs={profs}
        etablissements={formData.etablissements}
        matieres={formData.matieres}
      />
    </div>
  );
}
