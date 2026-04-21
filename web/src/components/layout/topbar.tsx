"use client";

import * as React from "react";
import Image from "next/image";
import { Bell, Search, Moon, Sun, Command, LogOut, Settings2, UserCog } from "lucide-react";
import { useTheme } from "next-themes";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TopbarProps = {
  user?: { pseudo: string; nom?: string; prenom?: string; role?: string; avatar?: string };
};

export function Topbar({ user }: TopbarProps) {
  const u = user ?? {
    pseudo: "ADM-DD-01",
    nom: "Doviakon",
    prenom: "Daniel",
    role: "Directeur général",
  };

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="h-full px-6 flex items-center gap-4">
        {/* Search */}
        <SearchBar />

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NotificationsButton />
          <UserMenu user={u} />
        </div>
      </div>
    </header>
  );
}

function SearchBar() {
  return (
    <div className="relative flex-1 max-w-xl group">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Rechercher un élève, un prof, une classe…"
          className="w-full h-10 pl-10 pr-16 rounded-lg border border-border/60 bg-card/50 backdrop-blur text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
          <Command className="size-2.5" />K
        </kbd>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-muted-foreground hover:text-foreground"
      aria-label="Basculer le thème"
    >
      {mounted && theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function NotificationsButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative size-8 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary ring-2 ring-background">
            <span className="absolute inset-0 rounded-full bg-primary animate-ping" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Badge variant="info" className="text-[10px]">3 nouvelles</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {[
            { title: "12 bulletins à valider", time: "il y a 10 min", type: "info" },
            { title: "Nouveau message de M. Mboussou", time: "il y a 1 h", type: "info" },
            { title: "3 élèves absents aujourd'hui", time: "ce matin", type: "warning" },
            { title: "Rapport mensuel disponible", time: "hier", type: "success" },
          ].map((n, i) => (
            <DropdownMenuItem key={i} className="flex items-start gap-3 py-3 cursor-pointer">
              <div
                className={cn(
                  "mt-1 size-2 rounded-full shrink-0",
                  n.type === "info" && "bg-accent",
                  n.type === "warning" && "bg-warning",
                  n.type === "success" && "bg-emerald-500"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.time}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ user }: { user: { pseudo: string; nom?: string; prenom?: string; role?: string; avatar?: string } }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
          <Avatar className="size-8">
            {user.avatar && <AvatarImage src={user.avatar} alt={user.pseudo} />}
            <AvatarFallback>{initials(user.nom ?? "", user.prenom)}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start min-w-0">
            <span className="text-xs font-semibold leading-tight truncate max-w-[140px]">
              {user.prenom ? `${user.prenom} ${user.nom}` : user.pseudo}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">{user.role}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold">
            {user.prenom ? `${user.prenom} ${user.nom}` : user.pseudo}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{user.pseudo}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserCog /> Mon profil
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings2 /> Paramètres
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-danger focus:text-danger">
          <LogOut /> Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
