import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AnnoncesList } from "@/components/communications/annonces-list";
import { getAnnonces } from "@/lib/queries/annonces";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getFormData() {
  const supabase = createAdminClient();
  const [{ data: etabs }, { data: classes }] = await Promise.all([
    supabase.from("etablissements").select("id, nom").eq("actif", true).order("nom"),
    supabase
      .from("classes")
      .select("id, nom, niveaux(libelle)")
      .order("nom"),
  ]);
  return {
    etablissements: etabs ?? [],
    classes: (classes ?? []).map((c) => {
      const rec = c as { id: string; nom: string; niveaux: { libelle: string } | { libelle: string }[] | null };
      const n = Array.isArray(rec.niveaux) ? rec.niveaux[0] : rec.niveaux;
      return { id: rec.id, nom: rec.nom, niveau_libelle: n?.libelle ?? "?" };
    }),
  };
}

export default async function Page() {
  const [annonces, formData] = await Promise.all([getAnnonces(), getFormData()]);
  const publiees = annonces.filter((a) => a.publiee).length;

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Communications"
        description={
          annonces.length === 0
            ? "Aucune annonce"
            : `${publiees} publiée${publiees > 1 ? "s" : ""} · ${annonces.length - publiees} brouillon${annonces.length - publiees > 1 ? "s" : ""}`
        }
        icon={<Megaphone className="size-5" />}
        breadcrumbs={[{ label: "Communications" }]}
      />
      <AnnoncesList
        annonces={annonces}
        etablissements={formData.etablissements}
        classes={formData.classes}
      />
    </div>
  );
}
