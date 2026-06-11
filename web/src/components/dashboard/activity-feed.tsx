"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ActivityItem = {
  icon: React.ReactNode;
  title: string;
  detail: string;
  time: string;
  color: string;
};

type ActivityFeedProps = {
  items?: ActivityItem[];
};

export function ActivityFeed({ items = [] }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="bg-card/60 backdrop-blur-xl border-border/50 h-full">
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Les derniers événements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {items.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
              <div className="size-10 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground">
                <Activity className="size-4" />
              </div>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Aucune activité pour l&apos;instant. Les événements apparaîtront ici dès qu&apos;il y en aura.
              </p>
            </div>
          ) : (
            items.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
                className="flex items-start gap-3 group"
              >
                <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium leading-tight truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.detail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-1">{a.time}</span>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
