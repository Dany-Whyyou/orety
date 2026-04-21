"use client";

import { GraduationCap, Users, BookOpenCheck, TrendingUp } from "lucide-react";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { EnrollmentChart } from "@/components/dashboard/enrollment-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { TopClasses } from "@/components/dashboard/top-classes";

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeBanner firstName="Daniel" />

      <QuickActions />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Élèves inscrits" value={847} delta={4.2} icon={Users} accent="primary" delay={0.05} />
        <StatCard label="Professeurs actifs" value={62} delta={2.1} icon={GraduationCap} accent="accent" delay={0.1} />
        <StatCard label="Moyenne générale" value={13.4} delta={0.8} icon={BookOpenCheck} accent="warning" delay={0.15} />
        <StatCard label="Taux de présence" value={94.3} format="percent" delta={1.2} icon={TrendingUp} accent="primary" delay={0.2} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EnrollmentChart />
        </div>
        <TopClasses />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ActivityFeed />
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <DistributionCard />
          <SchoolHealthCard />
        </div>
      </section>
    </div>
  );
}

function DistributionCard() {
  const segments = [
    { label: "Primaire", value: 325, color: "hsl(var(--warning))" },
    { label: "Collège", value: 340, color: "hsl(var(--accent))" },
    { label: "Lycée", value: 182, color: "hsl(var(--primary))" },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-accent/8 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Répartition par cycle</p>
        <p className="font-display text-2xl font-bold mt-1">{total.toLocaleString("fr-FR")} élèves</p>
      </div>
      <div className="mt-4 flex h-2.5 w-full rounded-full overflow-hidden bg-secondary relative">
        {segments.map((s, i) => (
          <div
            key={s.label}
            className="h-full transition-all"
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color, marginLeft: i === 0 ? 0 : 2 }}
          />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="font-medium">{s.label}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{s.value}</span>
              <span className="font-mono text-[10px]">{((s.value / total) * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchoolHealthCard() {
  const metrics = [
    { label: "Taux de réussite", value: 94, target: 95 },
    { label: "Satisfaction parents", value: 88, target: 90 },
    { label: "Assiduité profs", value: 97, target: 95 },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5">
      <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 size-44 rounded-full bg-primary/8 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Santé de l'établissement</p>
        <p className="font-display text-2xl font-bold mt-1">Excellente 🎯</p>
      </div>
      <div className="mt-4 space-y-3.5 relative">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{m.label}</span>
              <span className="font-mono text-muted-foreground">
                {m.value}% <span className="opacity-50">/ {m.target}%</span>
              </span>
            </div>
            <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${(m.value / 100) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 w-px bg-foreground/40"
                style={{ left: `${m.target}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
