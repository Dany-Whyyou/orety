import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EvaluationsView } from "@/components/evaluations/evaluations-view";
import {
  getEvaluations,
  getTypesEvaluation,
  getEvaluationFormData,
} from "@/lib/queries/evaluations";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [evaluations, types, formData] = await Promise.all([
    getEvaluations(),
    getTypesEvaluation(),
    getEvaluationFormData(),
  ]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Évaluations"
        description={
          evaluations.length === 0
            ? "Aucune évaluation"
            : `${evaluations.length} évaluation${evaluations.length > 1 ? "s" : ""} · ${types.length} type${types.length > 1 ? "s" : ""} définis`
        }
        icon={<ClipboardList className="size-5" />}
        breadcrumbs={[{ label: "Évaluations" }]}
      />
      <EvaluationsView
        evaluations={evaluations}
        types={types}
        affectations={formData.affectations}
        periodes={formData.periodes}
        etablissements={formData.etablissements}
      />
    </div>
  );
}
