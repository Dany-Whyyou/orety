import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CurrentUser } from "@/lib/auth";

/**
 * Anti-IDOR : le dashboard écrit via le service role (RLS contournée), donc
 * chaque mutation par id doit vérifier que la ressource appartient bien à
 * l'organisation de l'appelant. Un super_admin n'est pas limité.
 *
 * Le chemin décrit comment remonter jusqu'à l'organisation depuis la table.
 */
type Chemin =
  | "organisation_id" // colonne directe
  | "etablissement" // → etablissements.organisation_id
  | "niveau" // → niveaux → etablissements
  | "classe" // → classes → niveaux → etablissements
  | "inscription" // → inscriptions → classes → niveaux → etablissements
  | "affectation" // → affectations → classes → …
  | "utilisateur"; // → utilisateurs.organisation_id

const CHEMINS: Record<string, { table: string; select: string; extract: (row: Row) => string | null }> = {
  etablissements: {
    table: "etablissements",
    select: "organisation_id",
    extract: (r) => (r.organisation_id as string) ?? null,
  },
  annees_scolaires: {
    table: "annees_scolaires",
    select: "organisation_id",
    extract: (r) => (r.organisation_id as string) ?? null,
  },
  annonces: {
    table: "annonces",
    select: "organisation_id",
    extract: (r) => (r.organisation_id as string) ?? null,
  },
  incidents: {
    table: "incidents",
    select: "organisation_id",
    extract: (r) => (r.organisation_id as string) ?? null,
  },
  roles: {
    table: "roles",
    select: "organisation_id",
    extract: (r) => (r.organisation_id as string) ?? null,
  },
  utilisateurs: {
    table: "utilisateurs",
    select: "organisation_id",
    extract: (r) => (r.organisation_id as string) ?? null,
  },
  eleves: {
    table: "eleves",
    select: "etablissements(organisation_id)",
    extract: (r) => orgDe(r.etablissements),
  },
  niveaux: {
    table: "niveaux",
    select: "etablissements(organisation_id)",
    extract: (r) => orgDe(r.etablissements),
  },
  matieres: {
    table: "matieres",
    select: "etablissements(organisation_id)",
    extract: (r) => orgDe(r.etablissements),
  },
  types_evaluation: {
    table: "types_evaluation",
    select: "etablissements(organisation_id)",
    extract: (r) => orgDe(r.etablissements),
  },
  config_bulletins: {
    table: "config_bulletins",
    select: "etablissements(organisation_id)",
    extract: (r) => orgDe(r.etablissements),
  },
  classes: {
    table: "classes",
    select: "niveaux(etablissements(organisation_id))",
    extract: (r) => orgDe(un(r.niveaux)?.etablissements),
  },
  affectations: {
    table: "affectations",
    select: "classes(niveaux(etablissements(organisation_id)))",
    extract: (r) => orgDe(un(un(r.classes)?.niveaux)?.etablissements),
  },
  inscriptions: {
    table: "inscriptions",
    select: "classes(niveaux(etablissements(organisation_id)))",
    extract: (r) => orgDe(un(un(r.classes)?.niveaux)?.etablissements),
  },
  evaluations: {
    table: "evaluations",
    select: "affectations(classes(niveaux(etablissements(organisation_id))))",
    extract: (r) => orgDe(un(un(un(r.affectations)?.classes)?.niveaux)?.etablissements),
  },
  bulletins: {
    table: "bulletins",
    select: "inscriptions(classes(niveaux(etablissements(organisation_id))))",
    extract: (r) => orgDe(un(un(un(r.inscriptions)?.classes)?.niveaux)?.etablissements),
  },
  bulletin_matiere: {
    table: "bulletin_matiere",
    select: "bulletins(inscriptions(classes(niveaux(etablissements(organisation_id)))))",
    extract: (r) =>
      orgDe(un(un(un(un(r.bulletins)?.inscriptions)?.classes)?.niveaux)?.etablissements),
  },
  notes: {
    table: "notes",
    select: "evaluations(affectations(classes(niveaux(etablissements(organisation_id)))))",
    extract: (r) =>
      orgDe(un(un(un(un(r.evaluations)?.affectations)?.classes)?.niveaux)?.etablissements),
  },
};

type Row = Record<string, unknown>;

function un(v: unknown): Row | undefined {
  if (Array.isArray(v)) return v[0] as Row | undefined;
  return (v ?? undefined) as Row | undefined;
}

function orgDe(v: unknown): string | null {
  const row = un(v);
  return (row?.organisation_id as string) ?? null;
}

export type Table = keyof typeof CHEMINS;

/**
 * Lève si la ressource n'appartient pas à l'organisation de l'utilisateur.
 * À appeler dans toute action qui mute une ressource désignée par son id.
 */
export async function assertOwned(
  user: CurrentUser,
  table: Table,
  id: string
): Promise<void> {
  if (user.role?.code === "super_admin") return;
  if (!user.organisation_id) throw new Error("Permission refusée");

  const chemin = CHEMINS[table];
  if (!chemin) throw new Error("Permission refusée");

  // Table dynamique : le typage généré de Supabase n'accepte pas un nom variable.
  const supabase = createAdminClient() as unknown as {
    from: (t: string) => {
      select: (s: string) => {
        eq: (col: string, v: string) => {
          maybeSingle: () => Promise<{ data: Row | null; error: unknown }>;
        };
      };
    };
  };
  const { data, error } = await supabase
    .from(chemin.table)
    .select(chemin.select)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) throw new Error("Ressource introuvable");
  const org = chemin.extract(data);
  if (!org || org !== user.organisation_id) throw new Error("Permission refusée");
}

/** Variante non levante, pour les actions qui renvoient { ok: false, error }. */
export async function estProprietaire(
  user: CurrentUser,
  table: Table,
  id: string
): Promise<boolean> {
  try {
    await assertOwned(user, table, id);
    return true;
  } catch {
    return false;
  }
}
