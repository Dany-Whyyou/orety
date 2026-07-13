import { redirect } from "next/navigation";
import { Sidebar, SidebarProvider } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser, ROLES_ADMINISTRATIFS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMesNotifications } from "@/lib/actions/notifications";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // Session Auth encore valide mais compte désactivé/archivé ou organisation
  // suspendue : on coupe la session, sinon le middleware nous renverrait ici
  // en boucle (login → admin → login…).
  if (!user) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) await supabase.auth.signOut();
    redirect("/login?next=/admin");
  }
  // Le dashboard est réservé au personnel : rôles administratifs système, ou
  // rôles sur mesure (comptable, surveillant…) au-dessus du niveau prof (20).
  // Parents et profs passent par les apps mobiles.
  const roleCode = user.role?.code ?? "";
  const estPersonnalise = !["super_admin", "admin_org", "directeur_site", "secretariat", "prof", "parent"].includes(roleCode);
  const accesDashboard =
    ROLES_ADMINISTRATIFS.includes(roleCode) ||
    (estPersonnalise && (user.role?.niveau_hierarchique ?? 0) > 20);
  if (!accesDashboard) redirect("/");

  const { items: notifications, non_lues } = await getMesNotifications();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
        >
          <div className="absolute top-0 left-1/3 size-[40rem] rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute bottom-0 right-1/4 size-[30rem] rounded-full bg-accent/[0.04] blur-3xl" />
        </div>

        <Sidebar roleCode={roleCode} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            user={{
              pseudo: user.pseudo,
              nom: user.nom ?? undefined,
              prenom: user.prenom ?? undefined,
              role: user.role?.libelle,
              avatar: user.photo_url ?? undefined,
              isSuperAdmin: user.role?.code === "super_admin",
            }}
            notifications={notifications}
            nonLues={non_lues}
          />
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
