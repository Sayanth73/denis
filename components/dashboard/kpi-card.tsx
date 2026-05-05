import Link from "next/link";
import { Card } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string | number;
  subLabel: string;
  alert?: string; // rendered as red badge when truthy
  href?: string;  // when provided, wraps card in a Next.js Link
};

export function KpiCard({ label, value, subLabel, alert, href }: KpiCardProps) {
  const card = (
    <Card className={href ? "p-5 hover:bg-accent transition-colors cursor-pointer" : "p-5"}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {value}
        </span>
        {alert && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
            {alert}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{subLabel}</p>
    </Card>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}
