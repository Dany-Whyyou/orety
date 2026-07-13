"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, ROLES_ADMINISTRATIFS } from "@/lib/auth";

export type SearchResult = {
  type: "eleve" | "prof" | "classe" | "parent";
  id: string;
  titre: string;
  sous_titre: string;
  href: string;
};

/** Recherche globale du dashboard (palette ⌘K). */
export async function globalSearch(q: string): Promise<SearchResult[]> {
  await requireRole(ROLES_ADMINISTRATIFS);
  const term = q.trim();
  if (term.length < 2) return [];

  const supabase = createAdminClient();
  const like = `%${term}%`;

  const [eleves, profs, classes, parents] = await Promise.all([
    supabase
      .from("eleves")
      .select("id, nom, prenom, matricule, cle_parentale")
      .or(`nom.ilike.${like},prenom.ilike.${like},matricule.ilike.${like}`)
      .limit(5),
    supabase
      .from("utilisateurs")
      .select("id, nom, prenom, pseudo, roles:role_id!inner(code)")
      .eq("roles.code", "prof")
      .or(`nom.ilike.${like},prenom.ilike.${like},pseudo.ilike.${like}`)
      .limit(5),
    supabase
      .from("classes")
      .select("id, nom, niveaux(libelle)")
      .ilike("nom", like)
      .limit(5),
    supabase
      .from("utilisateurs")
      .select("id, nom, prenom, pseudo, roles:role_id!inner(code)")
      .eq("roles.code", "parent")
      .or(`nom.ilike.${like},pseudo.ilike.${like}`)
      .limit(4),
  ]);

  const results: SearchResult[] = [];

  for (const e of eleves.data ?? []) {
    results.push({
      type: "eleve",
      id: e.id,
      titre: `${e.prenom} ${e.nom}`,
      sous_titre: `Élève · ${e.matricule}`,
      href: "/admin/eleves",
    });
  }
  for (const p of profs.data ?? []) {
    results.push({
      type: "prof",
      id: p.id,
      titre: p.prenom ? `${p.prenom} ${p.nom}` : (p.nom ?? p.pseudo),
      sous_titre: `Professeur · ${p.pseudo}`,
      href: "/admin/profs",
    });
  }
  for (const c of classes.data ?? []) {
    const niveau = Array.isArray(c.niveaux) ? c.niveaux[0] : c.niveaux;
    results.push({
      type: "classe",
      id: c.id,
      titre: c.nom,
      sous_titre: `Classe · ${niveau?.libelle ?? ""}`,
      href: "/admin/classes",
    });
  }
  for (const p of parents.data ?? []) {
    results.push({
      type: "parent",
      id: p.id,
      titre: p.prenom ? `${p.prenom} ${p.nom}` : (p.nom ?? p.pseudo),
      sous_titre: `Parent · ${p.pseudo}`,
      href: "/admin/parents",
    });
  }

  return results;
}
