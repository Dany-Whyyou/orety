"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, pseudoToEmail } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import type { Database } from "@/lib/supabase/database.types";

const profSchema = z.object({
  nom: z.string().min(2, "Nom requis").max(80),
  prenom: z.string().min(1, "Prénom requis").max(80),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  telephone: z.string().max(40).optional().or(z.literal("")).nullable(),
  matricule: z.string().max(40).optional().or(z.literal("")).nullable(),
  date_embauche: z.string().optional().or(z.literal("")).nullable(),
  diplome: z.string().max(200).optional().or(z.literal("")).nullable(),
  specialite: z.string().max(200).optional().or(z.literal("")).nullable(),
  etablissement_ids: z.array(z.string().uuid()).min(1, "Au moins un établissement"),
  matiere_ids: z.array(z.string().uuid()),
});

export type ActionResult =
  | { ok: true; pseudo?: string; password?: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!["super_admin", "admin_org"].includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

function generatePassword(length = 12) {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p = "";
  const rand = new Uint32Array(length);
  crypto.getRandomValues(rand);
  for (let i = 0; i < length; i++) p += alphabet[rand[i] % alphabet.length];
  return p;
}

async function generatePseudo(nom: string, prenom: string): Promise<string> {
  const supabase = createAdminClient();
  const nomSlug = slugify(nom).toUpperCase().slice(0, 8);
  const prenomInitial = slugify(prenom).toUpperCase().slice(0, 1);
  const base = `PR-${nomSlug}-${prenomInitial}`;
  const { data } = await supabase
    .from("utilisateurs")
    .select("pseudo")
    .like("pseudo", `${base}%`);
  const taken = new Set(data?.map((u) => u.pseudo));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function createAuthClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function createProf(raw: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = profSchema.parse(raw);

    const supabase = createAdminClient();
    const authClient = createAuthClient();

    // Generate pseudo + password
    const pseudo = await generatePseudo(input.nom, input.prenom);
    const password = generatePassword(12);

    // Get prof role id
    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("code", "prof")
      .eq("is_system", true)
      .single();
    if (!roleData) return { ok: false, error: "Rôle 'prof' introuvable" };

    // 1) Create auth user
    const { data: authData, error: authErr } = await authClient.auth.admin.createUser({
      email: pseudoToEmail(pseudo),
      password,
      email_confirm: true,
      user_metadata: { pseudo, role: "prof" },
    });
    if (authErr || !authData.user) {
      return { ok: false, error: authErr?.message ?? "Erreur création auth" };
    }
    const userId = authData.user.id;

    try {
      // 2) Insert into utilisateurs
      const { error: uErr } = await supabase.from("utilisateurs").insert({
        id: userId,
        organisation_id: admin.organisation_id!,
        pseudo,
        role_id: roleData.id,
        nom: input.nom,
        prenom: input.prenom,
        email: input.email || null,
        telephone: input.telephone || null,
        actif: true,
        mot_de_passe_initial_utilise: false,
      });
      if (uErr) throw uErr;

      // 3) Insert into profs
      const { error: pErr } = await supabase.from("profs").insert({
        utilisateur_id: userId,
        matricule: input.matricule || null,
        date_embauche: input.date_embauche || null,
        diplome: input.diplome || null,
        specialite: input.specialite || null,
      });
      if (pErr) throw pErr;

      // 4) Link etablissements
      if (input.etablissement_ids.length > 0) {
        const { error: ueErr } = await supabase.from("utilisateur_etablissements").insert(
          input.etablissement_ids.map((eid) => ({
            utilisateur_id: userId,
            etablissement_id: eid,
          }))
        );
        if (ueErr) throw ueErr;
      }

      // 5) Link matieres
      if (input.matiere_ids.length > 0) {
        const { error: pmErr } = await supabase.from("prof_matieres").insert(
          input.matiere_ids.map((mid) => ({
            utilisateur_id: userId,
            matiere_id: mid,
          }))
        );
        if (pmErr) throw pmErr;
      }
    } catch (inner) {
      // Rollback auth user on failure
      await authClient.auth.admin.deleteUser(userId);
      return {
        ok: false,
        error: inner instanceof Error ? inner.message : "Erreur lors de la création",
      };
    }

    revalidatePath("/admin/profs");
    revalidatePath("/admin");
    return { ok: true, pseudo, password };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateProf(utilisateur_id: string, raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = profSchema.parse(raw);
    const supabase = createAdminClient();

    // Update utilisateurs
    const { error: uErr } = await supabase
      .from("utilisateurs")
      .update({
        nom: input.nom,
        prenom: input.prenom,
        email: input.email || null,
        telephone: input.telephone || null,
      })
      .eq("id", utilisateur_id);
    if (uErr) return { ok: false, error: uErr.message };

    // Update profs
    const { error: pErr } = await supabase
      .from("profs")
      .update({
        matricule: input.matricule || null,
        date_embauche: input.date_embauche || null,
        diplome: input.diplome || null,
        specialite: input.specialite || null,
      })
      .eq("utilisateur_id", utilisateur_id);
    if (pErr) return { ok: false, error: pErr.message };

    // Replace etablissement links
    await supabase
      .from("utilisateur_etablissements")
      .delete()
      .eq("utilisateur_id", utilisateur_id);
    if (input.etablissement_ids.length > 0) {
      await supabase.from("utilisateur_etablissements").insert(
        input.etablissement_ids.map((eid) => ({
          utilisateur_id,
          etablissement_id: eid,
        }))
      );
    }

    // Replace matiere links
    await supabase.from("prof_matieres").delete().eq("utilisateur_id", utilisateur_id);
    if (input.matiere_ids.length > 0) {
      await supabase.from("prof_matieres").insert(
        input.matiere_ids.map((mid) => ({ utilisateur_id, matiere_id: mid }))
      );
    }

    revalidatePath("/admin/profs");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function toggleProfActif(
  utilisateur_id: string,
  actif: boolean
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("utilisateurs")
      .update({ actif })
      .eq("id", utilisateur_id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/profs");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function regenerateProfPassword(utilisateur_id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const authClient = createAuthClient();
    const supabase = createAdminClient();
    const password = generatePassword(12);

    const { error: aErr } = await authClient.auth.admin.updateUserById(utilisateur_id, {
      password,
    });
    if (aErr) return { ok: false, error: aErr.message };

    await supabase
      .from("utilisateurs")
      .update({ mot_de_passe_initial_utilise: false })
      .eq("id", utilisateur_id);

    const { data: u } = await supabase
      .from("utilisateurs")
      .select("pseudo")
      .eq("id", utilisateur_id)
      .single();

    revalidatePath("/admin/profs");
    return { ok: true, pseudo: u?.pseudo, password };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteProf(utilisateur_id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const authClient = createAuthClient();
    const { error } = await authClient.auth.admin.deleteUser(utilisateur_id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/profs");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
