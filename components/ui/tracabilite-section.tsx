import * as React from "react";
import { cn } from "@/lib/utils";

type TracabiliteSectionProps = {
  step: 1 | 2 | 3;
  heading: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Reusable section card for the Traçabilité 3-section layout.
 * Renders a card with a step dot that aligns to the parent's left-rail
 * connector line (parent must have className="relative").
 *
 * Used by TracabiliteUpstream and TracabiliteDownstream.
 */
export function TracabiliteSection({
  heading,
  children,
  className,
}: TracabiliteSectionProps) {
  return (
    <div className={cn("relative pl-10 pb-2", className)}>
      {/* Step dot — centered on the left rail line (rail at left-4, dot size-3) */}
      <div
        className="absolute left-[0.625rem] top-3 size-3 rounded-full bg-border ring-2 ring-background"
        aria-hidden="true"
      />
      {/* Card surface */}
      <div className="rounded-md border bg-background p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{heading}</h3>
        {children}
      </div>
    </div>
  );
}
