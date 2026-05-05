import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type { AlerteItem } from "@/lib/dashboard";

type AlertesColumnProps = {
  items: AlerteItem[];
};

export function AlertesColumn({ items }: AlertesColumnProps) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">Alertes</h2>
      {items.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          heading="Tout va bien"
          body="Aucune alerte en cours."
        />
      ) : (
        <ul className="list-none m-0 p-0">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2 py-2 border-b border-border last:border-b-0"
            >
              <span
                className={cn(
                  "mt-1.5 size-2 rounded-full flex-shrink-0",
                  item.severity === "critical" ? "bg-red-500" : "bg-amber-400",
                )}
                aria-hidden="true"
              />
              <p className="text-sm text-foreground leading-snug">{item.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
