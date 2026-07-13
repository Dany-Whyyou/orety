import { getUtilisateursSysteme } from "@/lib/queries/super";
import { UtilisateursSystemeView } from "@/components/super/utilisateurs-systeme-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const utilisateurs = await getUtilisateursSysteme();

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Utilisateurs système</h1>
        <p className="text-sm text-muted-foreground">
          Comptes à privilèges de toutes les organisations ({utilisateurs.length}).
        </p>
      </div>
      <UtilisateursSystemeView utilisateurs={utilisateurs} />
    </>
  );
}
