import { notFound } from "next/navigation";
import { BulletinDetailView } from "@/components/bulletins/bulletin-detail";
import { getBulletinDetail } from "@/lib/queries/bulletins";
import { getBranding } from "@/lib/queries/organisation";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bulletin, branding] = await Promise.all([getBulletinDetail(id), getBranding()]);
  if (!bulletin) notFound();

  return (
    <BulletinDetailView
      bulletin={bulletin}
      branding={{
        nom: branding.nom,
        devise: branding.devise,
        adresse: branding.adresse,
        couleur_primaire: branding.couleur_primaire,
      }}
    />
  );
}
