"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, pseudoToEmail } from "@/lib/auth";

export type LoginState = {
  error: string | null;
};

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const pseudo = String(formData.get("pseudo") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  if (!pseudo || !password) {
    return { error: "Pseudo et mot de passe requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: pseudoToEmail(pseudo),
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("invalid")) {
      return { error: "Pseudo ou mot de passe incorrect." };
    }
    if (error.message.toLowerCase().includes("banned")) {
      return { error: "Ce compte a été désactivé. Contactez l'administration." };
    }
    return { error: error.message };
  }

  // Compte désactivé/archivé ou organisation suspendue : on coupe tout de suite
  const user = await getCurrentUser();
  if (!user) {
    await supabase.auth.signOut();
    return { error: "Ce compte a été désactivé. Contactez l'administration." };
  }

  const admin = createAdminClient();
  await admin
    .from("utilisateurs")
    .update({ dernier_login: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/admin");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
