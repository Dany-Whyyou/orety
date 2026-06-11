import { notFound } from "next/navigation";
import { BulletinDetailView } from "@/components/bulletins/bulletin-detail";
import { getBulletinDetail } from "@/lib/queries/bulletins";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bulletin = await getBulletinDetail(id);
  if (!bulletin) notFound();

  return <BulletinDetailView bulletin={bulletin} />;
}
