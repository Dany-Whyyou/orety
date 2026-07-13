"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export type NotificationItem = {
  id: string;
  type: string;
  titre: string;
  contenu: string | null;
  url_action: string | null;
  lue: boolean;
  cree_le: string;
};

/** Notifications du membre connecté (les 10 dernières). */
export async function getMesNotifications(): Promise<{
  items: NotificationItem[];
  non_lues: number;
}> {
  const user = await getCurrentUser();
  if (!user) return { items: [], non_lues: 0 };

  const supabase = createAdminClient();
  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, titre, contenu, url_action, lue, cree_le")
      .eq("destinataire_id", user.id)
      .order("cree_le", { ascending: false })
      .limit(10),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("destinataire_id", user.id)
      .eq("lue", false),
  ]);

  return { items: (data ?? []) as NotificationItem[], non_lues: count ?? 0 };
}

/** Marque toutes les notifications du membre connecté comme lues. */
export async function marquerToutLu(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const supabase = createAdminClient();
  await supabase
    .from("notifications")
    .update({ lue: true, lue_le: new Date().toISOString() })
    .eq("destinataire_id", user.id)
    .eq("lue", false);

  revalidatePath("/admin");
  return { ok: true };
}
