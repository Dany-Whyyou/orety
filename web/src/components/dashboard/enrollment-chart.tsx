"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SeriesPoint = {
  mois: string;
  primaire: number;
  college: number;
  lycee: number;
};

type EnrollmentChartProps = {
  data?: SeriesPoint[];
};

export function EnrollmentChart({ data = [] }: EnrollmentChartProps) {
  const hasData = data.length > 0 && data.some((d) => d.primaire + d.college + d.lycee > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative overflow-hidden bg-card/60 backdrop-blur-xl border-border/50">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 size-64 rounded-full bg-primary/5 blur-3xl"
        />
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Évolution des effectifs</CardTitle>
            <CardDescription>Inscriptions par cycle depuis septembre</CardDescription>
          </div>
          {hasData && (
            <div className="flex items-center gap-2">
              <Legend color="hsl(var(--primary))" label="Primaire" />
              <Legend color="hsl(var(--accent))" label="Collège" />
              <Legend color="hsl(var(--warning))" label="Lycée" />
            </div>
          )}
        </CardHeader>
        <CardContent className="pb-2">
          {hasData ? (
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPrimaire" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCollege" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradLycee" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mois" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover) / 0.95)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid hsl(var(--border) / 0.6)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Area type="monotone" dataKey="primaire" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gradPrimaire)" />
                  <Area type="monotone" dataKey="college" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#gradCollege)" />
                  <Area type="monotone" dataKey="lycee" stroke="hsl(var(--warning))" strokeWidth={2} fill="url(#gradLycee)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center gap-3 text-center">
              <div className="size-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Pas encore de données</p>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
                  La courbe s'alimentera automatiquement dès les premières inscriptions.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 pl-1.5">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-medium">{label}</span>
    </Badge>
  );
}
