"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Activity, Package, Factory, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { formatRelativeDate } from "@/lib/dashboard";
import type { ActivityItem } from "@/lib/dashboard";

const ICON_MAP: Record<ActivityItem["iconName"], LucideIcon> = {
  Package,
  Factory,
  Truck,
};

type RecentActivityColumnProps = {
  items: ActivityItem[];
};

export function RecentActivityColumn({ items }: RecentActivityColumnProps) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Activité récente
      </h2>
      {items.length === 0 ? (
        <EmptyState
          icon={Activity}
          heading="Aucune activité"
          body="Réceptionnez un lot ou créez une livraison pour voir l'activité ici."
        />
      ) : (
        <ul className="list-none m-0 p-0">
          {items.map((item) => {
            const Icon = ICON_MAP[item.iconName];
            return (
              <li key={item.id} className="border-b border-border last:border-b-0">
                <Link
                  href={item.href}
                  className="flex items-start gap-3 py-2.5 hover:bg-accent rounded-sm -mx-1 px-1 transition-colors"
                >
                  <Icon
                    size={16}
                    className="mt-0.5 text-muted-foreground flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(item.date)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
