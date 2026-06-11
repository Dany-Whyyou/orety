import { KeyRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ParentsList } from "@/components/parents/parents-list";
import { getParents } from "@/lib/queries/parents";

export const dynamic = "force-dynamic";

export default async function Page() {
  const parents = await getParents();
  const actifs = parents.filter((p) => p.actif).length;

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Comptes parents"
        description={
          parents.length === 0
            ? "Aucun compte"
            : `${actifs} compte${actifs > 1 ? "s" : ""} actif${actifs > 1 ? "s" : ""} · ${parents.reduce((s, p) => s + p.nb_enfants, 0)} enfant${parents.reduce((s, p) => s + p.nb_enfants, 0) > 1 ? "s" : ""} suivi${parents.reduce((s, p) => s + p.nb_enfants, 0) > 1 ? "s" : ""}`
        }
        icon={<KeyRound className="size-5" />}
        breadcrumbs={[{ label: "Parents" }]}
      />
      <ParentsList parents={parents} />
    </div>
  );
}
