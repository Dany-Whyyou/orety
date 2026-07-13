import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export type Branding = {
  nom: string;
  devise: string;
  adresse: string;
  telephone: string | null;
  email: string | null;
  logo_url: string | null;
  couleur_primaire: string | null;
};

const BRANDING_DEFAUT: Branding = {
  nom: "Complexe Scolaire Orety",
  devise: "Travail · Persévérance · Succès",
  adresse: "BP 2110, Port-Gentil, Gabon",
  telephone: null,
  email: null,
  logo_url: null,
  couleur_primaire: null,
};

/** Identité de l'organisation courante (white-labeling) avec repli sûr. */
export async function getBranding(): Promise<Branding> {
  const user = await getCurrentUser();
  if (!user?.organisation_id) return BRANDING_DEFAUT;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("organisations")
    .select("nom, devise, adresse, telephone, email, logo_url, couleur_primaire")
    .eq("id", user.organisation_id)
    .single();
  if (!data) return BRANDING_DEFAUT;

  return {
    nom: data.nom || BRANDING_DEFAUT.nom,
    devise: data.devise || BRANDING_DEFAUT.devise,
    adresse: data.adresse || BRANDING_DEFAUT.adresse,
    telephone: data.telephone,
    email: data.email,
    logo_url: data.logo_url,
    couleur_primaire: data.couleur_primaire,
  };
}
