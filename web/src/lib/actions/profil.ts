"use server";

import { z } from "zod";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { messageErreur } from "@/lib/authz";
import { getCurrentUser, pseudoToEmail } from "@/lib/auth";

const schema = z.object({
  mot_de_passe_actuel: z.string().min(1, "Mot de passe actuel requis"),
  nouveau_mot_de_passe: z
    .string()
    .min(8, "8 caractères minimum")
    .regex(/[A-Za-z]/, "Au moins une lettre")
    .regex(/[0-9]/, "Au moins un chiffre"),
});

export type ProfilActionResult = { ok: true } | { ok: false; error: string };

export async function changerMonMotDePasse(raw: unknown): Promise<ProfilActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Non authentifié" };

    const input = schema.parse(raw);

    // Vérifie le mot de passe actuel via une tentative de connexion isolée
    const verif = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { error: authErr } = await verif.auth.signInWithPassword({
      email: pseudoToEmail(user.pseudo),
      password: input.mot_de_passe_actuel,
    });
    if (authErr) return { ok: false, error: "Mot de passe actuel incorrect" };

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: input.nouveau_mot_de_passe,
    });
    if (error) return { ok: false, error: messageErreur(error) };

    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
