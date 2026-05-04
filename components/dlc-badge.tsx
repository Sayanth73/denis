"use client";

import { cn } from "@/lib/utils";
import { dlcColor, type DlcColor } from "@/lib/dlc";

type DlcBadgeProps = { value: string; className?: string };

const BUCKET_CLASSES: Record<DlcColor, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  orange: "bg-amber-100 text-amber-800 border-amber-200",
  red: "bg-red-100 text-red-800 border-red-200",
  grey: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

function formatDateJjMmAaaa(iso: string): string {
  const day = iso.slice(8, 10);
  const month = iso.slice(5, 7);
  const year = iso.slice(0, 4);
  return `${day}.${month}.${year}`;
}

export function DlcBadge({ value, className }: DlcBadgeProps) {
  const bucket = dlcColor(value, new Date());
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
        BUCKET_CLASSES[bucket],
        className,
      )}
    >
      {formatDateJjMmAaaa(value)}
    </span>
  );
}
