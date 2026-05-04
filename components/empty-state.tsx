import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: LucideIcon;
  heading: string;
  body: string;
  cta?: { label: string; onClick: () => void; icon?: LucideIcon };
  className?: string;
};

export function EmptyState({ icon: Icon, heading, body, cta, className }: EmptyStateProps) {
  const CtaIcon = cta?.icon;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-16 px-4 border border-dashed border-border rounded-md bg-background",
        className,
      )}
    >
      <Icon size={48} className="text-muted-foreground mb-4" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-foreground mb-2">{heading}</h2>
      <p className={cn("text-sm text-muted-foreground max-w-md", cta ? "mb-6" : "mb-0")}>
        {body}
      </p>
      {cta ? (
        <Button onClick={cta.onClick} className="gap-2">
          {CtaIcon ? <CtaIcon size={16} aria-hidden="true" /> : null}
          <span>{cta.label}</span>
        </Button>
      ) : null}
    </div>
  );
}
