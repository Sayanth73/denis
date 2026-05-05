import { Card } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string | number;
  subLabel: string;
  alert?: string; // rendered as red badge when truthy
};

export function KpiCard({ label, value, subLabel, alert }: KpiCardProps) {
  return (
    <Card className="p-5">
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
}
