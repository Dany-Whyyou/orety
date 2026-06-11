import Image from "next/image";
import { LoginForm } from "./login-form";

type SearchParams = Promise<{ next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = params.next ?? "/admin";

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/4 -left-20 size-[40rem] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 -right-20 size-[30rem] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute inset-0 dot-pattern opacity-40" />
      </div>

      <div className="relative w-full max-w-md px-6 py-12">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 blur-xl" />
            <div className="relative size-16 rounded-2xl bg-gradient-to-br from-primary via-primary-500 to-accent shadow-xl shadow-primary/30 flex items-center justify-center">
              <Image
                src="/logo-neutre.png"
                alt="Orety"
                width={44}
                height={44}
                className="size-11 object-contain invert"
                priority
              />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Orety</h1>
          <p className="text-sm text-muted-foreground mt-1">Plateforme de gestion scolaire</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl p-8 shadow-xl">
          <div aria-hidden className="pointer-events-none absolute -top-32 -right-20 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-xl font-semibold mb-1">Connexion</h2>
            <p className="text-xs text-muted-foreground mb-6">
              Utilisez votre pseudo mnémonique fourni par l&apos;administrateur.
            </p>
            <LoginForm next={next} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Besoin d&apos;aide ? Contactez l&apos;administration de l&apos;école.
        </p>
      </div>
    </div>
  );
}
