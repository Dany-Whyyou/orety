"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { KeyRound, UserCircle2, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { loginAction, type LoginState } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

const initialState: LoginState = { error: null };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-1.5">
        <label htmlFor="pseudo" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Pseudo
        </label>
        <div className="relative">
          <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            id="pseudo"
            name="pseudo"
            type="text"
            autoComplete="username"
            autoFocus
            required
            placeholder="ex: ADM-DD-01"
            className="w-full h-11 pl-10 pr-3 rounded-lg border border-border bg-background/50 backdrop-blur text-sm font-mono placeholder:text-muted-foreground/50 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Mot de passe
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="w-full h-11 pl-10 pr-10 rounded-lg border border-border bg-background/50 backdrop-blur text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-7 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Masquer" : "Afficher"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {state.error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger"
          )}
        >
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{state.error}</span>
        </motion.div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full h-11 rounded-lg bg-gradient-to-r from-primary via-primary-500 to-accent text-white font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 bg-[length:200%_100%] bg-left hover:bg-right transition-[background-position,box-shadow] duration-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      <span>{pending ? "Connexion en cours…" : "Se connecter"}</span>
    </button>
  );
}
