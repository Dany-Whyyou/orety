import { Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RolesList } from "@/components/roles/roles-list";
import { getRoles, getPermissions } from "@/lib/queries/roles";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [roles, permissions] = await Promise.all([getRoles(), getPermissions()]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Rôles & accès"
        description={`${roles.length} rôle${roles.length > 1 ? "s" : ""} · ${permissions.length} permissions du catalogue`}
        icon={<Shield className="size-5" />}
        breadcrumbs={[
          { label: "Paramètres", href: "/admin/parametres" },
          { label: "Rôles & accès" },
        ]}
      />
      <RolesList roles={roles} permissions={permissions} />
    </div>
  );
}
