import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type OrganisationItem = {
  id: string;
  slug: string;
  nom: string;
  plan: string | null;
  actif: boolean;
  logo_url: string | null;
  couleur_primaire: string | null;
  ville: string | null;
  cree_le: string;
  nb_etablissements: number;
  nb_utilisateurs: number;
  nb_eleves: number;
};

export async function getOrganisations(): Promise<OrganisationItem[]> {
  const supabase = createAdminClient();

  const { data: orgs, error } = await supabase
    .from("organisations")
    .select("id, slug, nom, plan, actif, logo_url, couleur_primaire, ville, cree_le")
    .order("cree_le");
  if (error || !orgs) return [];

  const [{ data: etabs }, { data: users }] = await Promise.all([
    supabase.from("etablissements").select("id, organisation_id"),
    supabase.from("utilisateurs").select("id, organisation_id"),
  ]);

  const etabIdsParOrg = new Map<string, string[]>();
  (etabs ?? []).forEach((e) => {
    const list = etabIdsParOrg.get(e.organisation_id) ?? [];
    list.push(e.id);
    etabIdsParOrg.set(e.organisation_id, list);
  });

  const usersParOrg = new Map<string, number>();
  (users ?? []).forEach((u) => {
    if (!u.organisation_id) return;
    usersParOrg.set(u.organisation_id, (usersParOrg.get(u.organisation_id) ?? 0) + 1);
  });

  const elevesParOrg = new Map<string, number>();
  await Promise.all(
    orgs.map(async (o) => {
      const etabIds = etabIdsParOrg.get(o.id) ?? [];
      if (etabIds.length === 0) return;
      const { count } = await supabase
        .from("eleves")
        .select("*", { count: "exact", head: true })
        .in("etablissement_id", etabIds)
        .eq("actif", true);
      elevesParOrg.set(o.id, count ?? 0);
    })
  );

  return orgs.map((o) => ({
    ...o,
    nb_etablissements: (etabIdsParOrg.get(o.id) ?? []).length,
    nb_utilisateurs: usersParOrg.get(o.id) ?? 0,
    nb_eleves: elevesParOrg.get(o.id) ?? 0,
  }));
}

export type UtilisateurSystemeItem = {
  id: string;
  pseudo: string;
  nom: string | null;
  prenom: string | null;
  actif: boolean;
  dernier_login: string | null;
  role_code: string;
  role_libelle: string;
  organisation_nom: string | null;
};

export async function getUtilisateursSysteme(): Promise<UtilisateurSystemeItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("utilisateurs")
    .select(
      "id, pseudo, nom, prenom, actif, dernier_login, roles:role_id!inner(code, libelle), organisations:organisation_id(nom)"
    )
    .in("roles.code", ["super_admin", "admin_org", "directeur_site", "secretariat"])
    .order("nom");
  if (error || !data) return [];

  return data.map((u) => {
    const role = Array.isArray(u.roles) ? u.roles[0] : u.roles;
    const org = Array.isArray(u.organisations) ? u.organisations[0] : u.organisations;
    return {
      id: u.id,
      pseudo: u.pseudo,
      nom: u.nom,
      prenom: u.prenom,
      actif: u.actif,
      dernier_login: u.dernier_login,
      role_code: role?.code ?? "",
      role_libelle: role?.libelle ?? "",
      organisation_nom: org?.nom ?? null,
    };
  });
}

export type StatsGlobales = {
  organisations: number;
  etablissements: number;
  eleves: number;
  profs: number;
  parents: number;
  bulletins: number;
  parOrganisation: { nom: string; eleves: number; utilisateurs: number }[];
};

export async function getStatsGlobales(): Promise<StatsGlobales> {
  const supabase = createAdminClient();
  const organisations = await getOrganisations();

  const [
    { count: etablissements },
    { count: eleves },
    { count: profs },
    { count: parents },
    { count: bulletins },
  ] = await Promise.all([
    supabase.from("etablissements").select("*", { count: "exact", head: true }),
    supabase.from("eleves").select("*", { count: "exact", head: true }).eq("actif", true),
    supabase
      .from("utilisateurs")
      .select("*, roles:role_id!inner(code)", { count: "exact", head: true })
      .eq("roles.code", "prof"),
    supabase
      .from("utilisateurs")
      .select("*, roles:role_id!inner(code)", { count: "exact", head: true })
      .eq("roles.code", "parent"),
    supabase.from("bulletins").select("*", { count: "exact", head: true }),
  ]);

  return {
    organisations: organisations.length,
    etablissements: etablissements ?? 0,
    eleves: eleves ?? 0,
    profs: profs ?? 0,
    parents: parents ?? 0,
    bulletins: bulletins ?? 0,
    parOrganisation: organisations.map((o) => ({
      nom: o.nom,
      eleves: o.nb_eleves,
      utilisateurs: o.nb_utilisateurs,
    })),
  };
}
