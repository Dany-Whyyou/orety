import { Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { ParametresView } from "@/components/parametres/parametres-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user?.organisation_id) redirect("/admin");

  const supabase = createAdminClient();
  const { data: organisation } = await supabase
    .from("organisations")
    .select(
      "nom, slug, plan, devise, adresse, telephone, email, site_web, logo_url, couleur_primaire, couleur_secondaire, couleur_accent"
    )
    .eq("id", user.organisation_id)
    .single();

  if (!organisation) redirect("/admin");

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Paramètres"
        description="Identité, coordonnées et image de marque de l'organisation"
        icon={<Settings className="size-5" />}
        breadcrumbs={[{ label: "Paramètres" }]}
      />
      <ParametresView organisation={organisation} />
    </div>
  );
}
