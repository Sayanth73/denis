"use client";

import { Home, Package, Factory, Truck, Users, Search } from "lucide-react";
import { NAV_ITEMS, type NavIconName } from "@/lib/nav";
import { NavItem } from "@/components/layout/nav-item";

const ICONS: Record<
  NavIconName,
  React.ComponentType<{ className?: string; size?: number | string }>
> = {
  Home,
  Package,
  Factory,
  Truck,
  Users,
  Search,
};

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-border bg-zinc-50">
      {/* Brand row — 56px tall to align with header */}
      <div className="flex h-14 items-center px-4">
        <span className="text-base font-semibold">TraceKebab</span>
      </div>
      {/* Nav list */}
      <nav className="flex flex-col gap-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.iconName];
          return (
            <NavItem
              key={item.route}
              label={item.label}
              route={item.route}
              icon={Icon}
            />
          );
        })}
      </nav>
    </aside>
  );
}
