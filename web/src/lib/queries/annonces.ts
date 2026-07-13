import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AnnonceItem = {
  id: string;
  titre: string;
  contenu: string;
  cible: "organisation" | "etablissement" | "classe";
  etablissement_id: string | null;
  etablissement_nom: string | null;
  classe_id: string | null;
  classe_nom: string | null;
  publiee: boolean;
  publiee_le: string | null;
  expire_le: string | null;
  cree_le: string;
  auteur_pseudo: string | null;
  auteur_nom: string | null;
};

export async function getAnnonces(): Promise<AnnonceItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("annonces")
    .select(
      `id, titre, contenu, cible, etablissement_id, classe_id, publiee, publiee_le, expire_le, cree_le,
       etablissements(nom),
       classes(nom),
       utilisateurs:auteur_id(pseudo, nom, prenom)`
    )
    .is("archive_le", null)
    .order("cree_le", { ascending: false });

  if (error) return [];

  return (data ?? []).map((a) => {
    const rec = a as {
      id: string;
      titre: string;
      contenu: string;
      cible: "organisation" | "etablissement" | "classe";
      etablissement_id: string | null;
      classe_id: string | null;
      publiee: boolean;
      publiee_le: string | null;
      expire_le: string | null;
      cree_le: string;
      etablissements: { nom: string } | { nom: string }[] | null;
      classes: { nom: string } | { nom: string }[] | null;
      utilisateurs: { pseudo: string; nom: string | null; prenom: string | null } | { pseudo: string; nom: string | null; prenom: string | null }[] | null;
    };
    const etab = Array.isArray(rec.etablissements) ? rec.etablissements[0] : rec.etablissements;
    const classe = Array.isArray(rec.classes) ? rec.classes[0] : rec.classes;
    const auteur = Array.isArray(rec.utilisateurs) ? rec.utilisateurs[0] : rec.utilisateurs;
    return {
      id: rec.id,
      titre: rec.titre,
      contenu: rec.contenu,
      cible: rec.cible,
      etablissement_id: rec.etablissement_id,
      etablissement_nom: etab?.nom ?? null,
      classe_id: rec.classe_id,
      classe_nom: classe?.nom ?? null,
      publiee: rec.publiee,
      publiee_le: rec.publiee_le,
      expire_le: rec.expire_le,
      cree_le: rec.cree_le,
      auteur_pseudo: auteur?.pseudo ?? null,
      auteur_nom: auteur ? `${auteur.prenom ?? ""} ${auteur.nom ?? ""}`.trim() : null,
    };
  });
}
