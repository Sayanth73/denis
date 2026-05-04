"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActiveRoute } from "@/lib/nav";

type NavItemProps = {
  label: string;
  route: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
};

export function NavItem({ label, route, icon: Icon }: NavItemProps) {
  const pathname = usePathname();
  const active = isActiveRoute(pathname, route);

  return (
    <Link
      href={route}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "bg-zinc-100 text-foreground"
          : "text-muted-foreground hover:bg-zinc-100 hover:text-foreground",
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"
        />
      )}
      <Icon size={16} className="shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
