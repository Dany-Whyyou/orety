"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Erreur dashboard:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="size-7" />
      </div>
      <h1 className="mt-5 font-display text-xl font-bold">Une erreur est survenue</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Cette page n&apos;a pas pu être chargée. Vos données ne sont pas perdues — réessayez,
        et si le problème persiste, contactez l&apos;administrateur de la plateforme.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
          Référence : {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button variant="gradient" onClick={reset}>
          <RotateCcw /> Réessayer
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin">Retour au tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
}
