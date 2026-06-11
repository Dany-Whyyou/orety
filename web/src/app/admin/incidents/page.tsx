import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { IncidentsList } from "@/components/incidents/incidents-list";
import { getIncidents, getIncidentFormData } from "@/lib/queries/incidents";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [incidents, formData] = await Promise.all([getIncidents(), getIncidentFormData()]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Incidents & signalements"
        description={
          incidents.length === 0
            ? "Aucun incident signalé"
            : `${incidents.length} signalement${incidents.length > 1 ? "s" : ""}`
        }
        icon={<AlertTriangle className="size-5" />}
        breadcrumbs={[{ label: "Incidents" }]}
      />
      <IncidentsList incidents={incidents} eleves={formData.eleves} />
    </div>
  );
}
