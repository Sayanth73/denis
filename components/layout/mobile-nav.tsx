"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/lib/nav";
import { NAV_ICONS } from "@/lib/nav-icons";
import { NavItem } from "@/components/layout/nav-item";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
      >
        <Menu size={20} aria-hidden="true" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="flex h-14 items-center justify-start px-4 border-b border-border">
            <SheetTitle className="text-base font-semibold">TraceKebab</SheetTitle>
          </SheetHeader>
          <nav
            className="flex flex-col gap-1 px-2 py-4"
            onClick={() => setOpen(false)}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item.iconName];
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
        </SheetContent>
      </Sheet>
    </>
  );
}
