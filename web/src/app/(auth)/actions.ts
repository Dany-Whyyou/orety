"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pseudoToEmail } from "@/lib/auth";

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
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/admin");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
