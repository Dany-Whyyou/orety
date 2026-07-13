import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Building2, ChartBar, LayoutDashboard, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";

const liens = [
  { href: "/super", label: "Organisations", icon: Building2 },
  { href: "/super/utilisateurs-systeme", label: "Utilisateurs système", icon: Users },
  { href: "/super/stats-globales", label: "Stats globales", icon: ChartBar },
];

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/super");
  if (user.role?.code !== "super_admin") redirect("/admin");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-primary-900 text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/super" className="flex items-center gap-2.5">
              <Image
                src="/logo-neutre.png"
                alt="Orety"
                width={28}
                height={28}
                className="size-7 object-contain invert"
              />
              <span className="font-display text-sm font-bold">
                Orety <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Super admin</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {liens.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <l.icon className="size-3.5" />
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LayoutDashboard className="size-3.5" />
              Dashboard école
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
