"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { generateParentPseudo, createParent } from "@/lib/actions/parents";

const SEXES = ["m", "f"] as const;

// L'enum Postgres sexe_eleve n'accepte que 'M' | 'F'
function toDbSexe(sexe: (typeof SEXES)[number] | null | undefined) {
  return sexe ? (sexe.toUpperCase() as "M" | "F") : null;
}

const eleveSchema = z.object({
  etablissement_id: z.string().uuid(),
  matricule: z.string().max(40).optional().or(z.literal("")).nullable(),
  nom: z.string().min(1, "Nom requis").max(80),
  prenom: z.string().min(1, "Prénom requis").max(80),
  date_naissance: z.string().optional().or(z.literal("")).nullable(),
  lieu_naissance: z.string().max(100).optional().or(z.literal("")).nullable(),
  sexe: z.enum(SEXES).optional().nullable(),
  nationalite: z.string().max(80).optional().or(z.literal("")).nullable(),
  adresse: z.string().max(500).optional().or(z.literal("")).nullable(),
  tel_urgence: z.string().max(40).optional().or(z.literal("")).nullable(),
  personne_urgence: z.string().max(120).optional().or(z.literal("")).nullable(),
  infos_medicales: z.string().max(1000).optional().or(z.literal("")).nullable(),
  infos_allergies: z.string().max(1000).optional().or(z.literal("")).nullable(),
  // Parent handling
  parent_mode: z.enum(["existing", "new"]),
  parent_utilisateur_id: z.string().optional().or(z.literal("")).nullable(),
  parent_nom: z.string().optional().or(z.literal("")).nullable(),
  parent_prenom: z.string().optional().or(z.literal("")).nullable(),
  parent_email: z.string().email("Email invalide").optional().or(z.literal("")).nullable(),
  parent_telephone: z.string().optional().or(z.literal("")).nullable(),
  parent_pseudo_custom: z.string().optional().or(z.literal("")).nullable(),
  // Inscription
  annee_scolaire_id: z.string().uuid().optional().or(z.literal("")).nullable(),
  classe_id: z.string().uuid().optional().or(z.literal("")).nullable(),
});

const eleveUpdateSchema = eleveSchema
  .omit({
    parent_mode: true,
    parent_nom: true,
    parent_prenom: true,
    parent_email: true,
    parent_telephone: true,
    parent_pseudo_custom: true,
  })
  .extend({
    parent_utilisateur_id: z.string().uuid("Parent requis"),
  });

export type EleveActionResult =
  | { ok: true; pseudo?: string; password?: string; eleve_id?: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!["super_admin", "admin_org", "secretariat"].includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

async function generateMatricule(etablissement_id: string): Promise<string> {
  const supabase = createAdminClient();
  const year = new Date().getFullYear().toString().slice(-2);
  const { data } = await supabase
    .from("eleves")
    .select("matricule")
    .eq("etablissement_id", etablissement_id)
    .like("matricule", `OR${year}-%`);
  const nums = (data ?? [])
    .map((r) => parseInt((r.matricule ?? "").split("-")[1] ?? "0", 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `OR${year}-${String(next).padStart(4, "0")}`;
}

export async function createEleve(raw: unknown): Promise<EleveActionResult> {
  try {
    await requireAdmin();
    const input = eleveSchema.parse(raw);
    const supabase = createAdminClient();

    let clePseudo: string | null = null;
    let generatedPassword: string | null = null;

    if (input.parent_mode === "existing") {
      if (!input.parent_utilisateur_id) {
        return { ok: false, error: "Sélectionnez le parent existant" };
      }
      const { data: parent } = await supabase
        .from("utilisateurs")
        .select("pseudo")
        .eq("id", input.parent_utilisateur_id)
        .single();
      if (!parent) return { ok: false, error: "Parent introuvable" };
      clePseudo = parent.pseudo;
    } else {
      // new parent: if custom pseudo provided use it; else generate from parent nom/prenom
      const parentNom = input.parent_nom || input.nom;
      const res = await createParent({
        nom: parentNom,
        prenom: input.parent_prenom ?? null,
        email: input.parent_email ?? null,
        telephone: input.parent_telephone ?? null,
        pseudo_custom: input.parent_pseudo_custom ?? null,
      });
      if (!res.ok) return { ok: false, error: `Parent: ${res.error}` };
      clePseudo = res.pseudo!;
      generatedPassword = res.password!;
    }

    // Matricule: explicit or auto
    const matricule = input.matricule || (await generateMatricule(input.etablissement_id));

    const { data: newEleve, error: insertErr } = await supabase
      .from("eleves")
      .insert({
        etablissement_id: input.etablissement_id,
        matricule,
        nom: input.nom,
        prenom: input.prenom,
        date_naissance: input.date_naissance || null,
        lieu_naissance: input.lieu_naissance || null,
        sexe: toDbSexe(input.sexe),
        nationalite: input.nationalite || null,
        adresse: input.adresse || null,
        tel_urgence: input.tel_urgence || null,
        personne_urgence: input.personne_urgence || null,
        infos_medicales: input.infos_medicales || null,
        infos_allergies: input.infos_allergies || null,
        cle_parentale: clePseudo!,
        actif: true,
      })
      .select("id")
      .single();

    if (insertErr) return { ok: false, error: insertErr.message };

    // Optional inscription
    if (input.annee_scolaire_id && input.classe_id) {
      await supabase.from("inscriptions").insert({
        eleve_id: newEleve.id,
        annee_scolaire_id: input.annee_scolaire_id,
        classe_id: input.classe_id,
        statut: "inscrit",
      });
    }

    revalidatePath("/admin/eleves");
    revalidatePath("/admin/parents");
    revalidatePath("/admin");

    if (generatedPassword && clePseudo) {
      return { ok: true, pseudo: clePseudo, password: generatedPassword, eleve_id: newEleve.id };
    }
    return { ok: true, eleve_id: newEleve.id };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateEleve(id: string, raw: unknown): Promise<EleveActionResult> {
  try {
    await requireAdmin();
    const input = eleveUpdateSchema.parse(raw);
    const supabase = createAdminClient();

    const { data: parent } = await supabase
      .from("utilisateurs")
      .select("pseudo")
      .eq("id", input.parent_utilisateur_id)
      .single();
    if (!parent) return { ok: false, error: "Parent introuvable" };

    const { error } = await supabase
      .from("eleves")
      .update({
        etablissement_id: input.etablissement_id,
        matricule: input.matricule || undefined,
        nom: input.nom,
        prenom: input.prenom,
        date_naissance: input.date_naissance || null,
        lieu_naissance: input.lieu_naissance || null,
        sexe: toDbSexe(input.sexe),
        nationalite: input.nationalite || null,
        adresse: input.adresse || null,
        tel_urgence: input.tel_urgence || null,
        personne_urgence: input.personne_urgence || null,
        infos_medicales: input.infos_medicales || null,
        infos_allergies: input.infos_allergies || null,
        cle_parentale: parent.pseudo,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    // Handle inscription — replace current-year inscription if new one provided
    if (input.annee_scolaire_id && input.classe_id) {
      await supabase
        .from("inscriptions")
        .delete()
        .eq("eleve_id", id)
        .eq("annee_scolaire_id", input.annee_scolaire_id);
      await supabase.from("inscriptions").insert({
        eleve_id: id,
        annee_scolaire_id: input.annee_scolaire_id,
        classe_id: input.classe_id,
        statut: "inscrit",
      });
    }

    revalidatePath("/admin/eleves");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function toggleEleveActif(id: string, actif: boolean): Promise<EleveActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("eleves").update({ actif }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/eleves");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteEleve(id: string): Promise<EleveActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("eleves").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/eleves");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

// Preview what the generated pseudo would be (called from client to show live preview)
export async function previewParentPseudo(
  nom: string,
  prenom: string
): Promise<{ pseudo: string }> {
  const pseudo = await generateParentPseudo(nom || "PARENT", prenom || null);
  return { pseudo };
}
