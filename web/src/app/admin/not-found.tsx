import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <FileQuestion className="size-7" />
      </div>
      <h1 className="mt-5 font-display text-xl font-bold">Introuvable</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Cet élément n&apos;existe pas, ou il a été archivé.
      </p>
      <Button variant="gradient" className="mt-6" asChild>
        <Link href="/admin">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
