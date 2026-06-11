import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BulletinsView } from "@/components/bulletins/bulletins-view";
import { getBulletins, getBulletinFormData } from "@/lib/queries/bulletins";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [bulletins, formData] = await Promise.all([getBulletins(), getBulletinFormData()]);
  const publies = bulletins.filter((b) => b.publie).length;

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Bulletins"
        description={
          bulletins.length === 0
            ? "Aucun bulletin généré"
            : `${bulletins.length} bulletin${bulletins.length > 1 ? "s" : ""} · ${publies} publié${publies > 1 ? "s" : ""}`
        }
        icon={<FileText className="size-5" />}
        breadcrumbs={[{ label: "Bulletins" }]}
      />
      <BulletinsView
        bulletins={bulletins}
        classes={formData.classes}
        periodes={formData.periodes}
        annees={formData.annees}
      />
    </div>
  );
}
