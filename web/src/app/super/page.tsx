import { getOrganisations } from "@/lib/queries/super";
import { OrganisationsView } from "@/components/super/organisations-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const organisations = await getOrganisations();

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Organisations</h1>
        <p className="text-sm text-muted-foreground">
          Les écoles clientes de la plateforme ({organisations.length}).
        </p>
      </div>
      <OrganisationsView organisations={organisations} />
    </>
  );
}
