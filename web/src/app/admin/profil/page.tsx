import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfilView } from "@/components/profil/profil-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/profil");

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Mon profil</h1>
        <p className="text-sm text-muted-foreground">
          Vos informations personnelles et la sécurité de votre compte.
        </p>
      </div>
      <ProfilView
        user={{
          pseudo: user.pseudo,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          photo_url: user.photo_url,
          role: user.role?.libelle ?? null,
        }}
      />
    </>
  );
}
