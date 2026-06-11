import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RapportsView } from "@/components/rapports/rapports-view";
import { getRapportData } from "@/lib/queries/rapports";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getRapportData();

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Rapports"
        description="Vue analytique de l'établissement"
        icon={<BarChart3 className="size-5" />}
        breadcrumbs={[{ label: "Rapports" }]}
      />
      <RapportsView data={data} />
    </div>
  );
}
