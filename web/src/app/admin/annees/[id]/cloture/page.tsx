import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, Award } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ClotureWizard } from "@/components/cloture/cloture-wizard";
import { getClotureState, getProchaineAnnee } from "@/lib/queries/cloture";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [state, prochaineAnnee] = await Promise.all([
    getClotureState(id),
    getProchaineAnnee(id),
  ]);
  if (!state) notFound();

  if (state.est_archivee) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" asChild size="sm" className="mb-4">
          <Link href="/admin/annees">
            <ArrowLeft /> Retour
          </Link>
        </Button>
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
            <Lock className="size-6" />
          </div>
          <h2 className="font-display text-xl font-bold">
            {state.annee_libelle} est déjà archivée
          </h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Les données restent consultables en lecture seule dans les archives.
          </p>
          <Button variant="gradient" asChild>
            <Link href="/admin/archives">
              <Award /> Voir les archives
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={`Clôture de ${state.annee_libelle}`}
        description="Validation des décisions de fin d'année puis archivage de l'année"
        icon={<Lock className="size-5" />}
        breadcrumbs={[
          { label: "Années scolaires", href: "/admin/annees" },
          { label: state.annee_libelle },
          { label: "Clôture" },
        ]}
      />
      <ClotureWizard state={state} prochaineAnnee={prochaineAnnee} />
    </div>
  );
}
