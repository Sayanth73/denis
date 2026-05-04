"use client";

import { usePathname } from "next/navigation";
import { getActiveLabel } from "@/lib/nav";
import { ResetButton } from "@/components/layout/reset-button";

export function Header() {
  const pathname = usePathname();
  const title = getActiveLabel(pathname);
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-zinc-50 px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="ml-auto">
        <ResetButton />
      </div>
    </header>
  );
}
