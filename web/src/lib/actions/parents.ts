"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertOwned, assertCibleGerable, messageErreur } from "@/lib/authz";
import { getCurrentUser, pseudoToEmail, ROLES_ADMINISTRATIFS } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import type { Database } from "@/lib/supabase/database.types";

const parentSchema = z.object({
  nom: z.string().max(80).optional().or(z.literal("")).nullable(),
  prenom: z.string().max(80).optional().or(z.literal("")).nullable(),
  email: z.string().email("Email invalide").optional().or(z.literal("")).nullable(),
  telephone: z.string().max(40).optional().or(z.literal("")).nullable(),
  pseudo_custom: z.string().max(30).optional().or(z.literal("")).nullable(),
});

export type ActionResult =
  | { ok: true; pseudo?: string; password?: string; utilisateur_id?: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!ROLES_ADMINISTRATIFS.includes(user.role?.code ?? "")) {
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

function createAuthClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Build a unique mnemonic pseudo for a parent.
 * Format: NOM-INITIALES_PRENOM-AA (ex: DOVI-MP-26)
 * Falls back to DOVI-26 if no prenom, and suffixes -2, -3... on collision.
 */
export async function generateParentPseudo(
  nom: string,
  prenom: string | null
): Promise<string> {
  await requireAdmin();
  const supabase = createAdminClient();
  const nomSlug = slugify(nom).toUpperCase().slice(0, 8) || "PARENT";
  const prenomInitials = (prenom ?? "")
    .split(/[\s-]+/)
    .map((p) => slugify(p).toUpperCase().slice(0, 1))
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  const year = new Date().getFullYear().toString().slice(-2);
  const base = prenomInitials
    ? `${nomSlug}-${prenomInitials}-${year}`
    : `${nomSlug}-${year}`;

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

export async function createParent(raw: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parentSchema.parse(raw);

    const supabase = createAdminClient();
    const authClient = createAuthClient();

    // Pseudo : custom or generated
    let pseudo = (input.pseudo_custom ?? "").trim().toUpperCase();
    if (!pseudo) {
      pseudo = await generateParentPseudo(input.nom ?? "PARENT", input.prenom ?? null);
    } else {
      // Check uniqueness
      const { data: existing } = await supabase
        .from("utilisateurs")
        .select("pseudo")
        .eq("pseudo", pseudo)
        .maybeSingle();
      if (existing) return { ok: false, error: "Ce pseudo est déjà utilisé" };
    }

    const password = generatePassword(12);

    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("code", "parent")
      .eq("is_system", true)
      .single();
    if (!roleData) return { ok: false, error: "Rôle 'parent' introuvable" };

    const { data: authData, error: authErr } = await authClient.auth.admin.createUser({
      email: pseudoToEmail(pseudo),
      password,
      email_confirm: true,
      user_metadata: { pseudo, role: "parent" },
    });
    if (authErr || !authData.user) {
      return { ok: false, error: authErr?.message ?? "Erreur création auth" };
    }
    const userId = authData.user.id;

    const { error: uErr } = await supabase.from("utilisateurs").insert({
      id: userId,
      organisation_id: admin.organisation_id!,
      pseudo,
      role_id: roleData.id,
      nom: input.nom || null,
      prenom: input.prenom || null,
      email: input.email || null,
      telephone: input.telephone || null,
      actif: true,
      mot_de_passe_initial_utilise: false,
    });
    if (uErr) {
      await authClient.auth.admin.deleteUser(userId);
      return { ok: false, error: messageErreur(uErr) };
    }

    revalidatePath("/admin/parents");
    revalidatePath("/admin/eleves");
    revalidatePath("/admin");
    return { ok: true, pseudo, password, utilisateur_id: userId };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateParent(
  utilisateur_id: string,
  raw: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "utilisateurs", utilisateur_id);
    const cibleErr = await assertCibleGerable(user, utilisateur_id, "parent");
    if (cibleErr) return { ok: false, error: cibleErr };
    const input = parentSchema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("utilisateurs")
      .update({
        nom: input.nom || null,
        prenom: input.prenom || null,
        email: input.email || null,
        telephone: input.telephone || null,
      })
      .eq("id", utilisateur_id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/parents");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function toggleParentActif(
  utilisateur_id: string,
  actif: boolean
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "utilisateurs", utilisateur_id);
    const cibleErr = await assertCibleGerable(user, utilisateur_id, "parent");
    if (cibleErr) return { ok: false, error: cibleErr };
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("utilisateurs")
      .update({ actif })
      .eq("id", utilisateur_id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/parents");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function regenerateParentPassword(
  utilisateur_id: string
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "utilisateurs", utilisateur_id);
    const gardeErr = await assertCibleGerable(user, utilisateur_id, "parent");
    if (gardeErr) return { ok: false, error: gardeErr };
    const authClient = createAuthClient();
    const supabase = createAdminClient();
    const password = generatePassword(12);

    const { error: aErr } = await authClient.auth.admin.updateUserById(utilisateur_id, {
      password,
    });
    if (aErr) return { ok: false, error: messageErreur(aErr) };

    await supabase
      .from("utilisateurs")
      .update({ mot_de_passe_initial_utilise: false, pin_hash: null })
      .eq("id", utilisateur_id);

    const { data: u } = await supabase
      .from("utilisateurs")
      .select("pseudo")
      .eq("id", utilisateur_id)
      .single();

    revalidatePath("/admin/parents");
    return { ok: true, pseudo: u?.pseudo, password };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteParent(utilisateur_id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "utilisateurs", utilisateur_id);
    const gardeErr = await assertCibleGerable(user, utilisateur_id, "parent");
    if (gardeErr) return { ok: false, error: gardeErr };
    const supabase = createAdminClient();

    // Check: do any eleves still reference this parent via cle_parentale?
    const { data: u } = await supabase
      .from("utilisateurs")
      .select("pseudo")
      .eq("id", utilisateur_id)
      .single();
    if (!u) return { ok: false, error: "Parent introuvable" };

    const { count } = await supabase
      .from("eleves")
      .select("*", { count: "exact", head: true })
      .eq("cle_parentale", u.pseudo)
      .is("archive_le", null);
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: `Impossible : ${count} élève(s) utilisent encore cette clé parentale`,
      };
    }

    // Conformité : archivage définitif, compte Auth banni mais conservé
    const { error } = await supabase
      .from("utilisateurs")
      .update({ archive_le: new Date().toISOString(), actif: false })
      .eq("id", utilisateur_id);
    if (error) return { ok: false, error: messageErreur(error) };

    const authClient = createAuthClient();
    const { error: banErr } = await authClient.auth.admin.updateUserById(utilisateur_id, {
      ban_duration: "876000h",
    });
    if (banErr) {
      return {
        ok: false,
        error: `Compte archivé mais blocage de connexion échoué : ${banErr.message}`,
      };
    }
    revalidatePath("/admin/parents");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
