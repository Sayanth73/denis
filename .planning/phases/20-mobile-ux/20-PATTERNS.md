# Phase 20: Mobile UX — iPhone Responsive — Pattern Map

**Mapped:** 2026-05-05
**Files analyzed:** 13
**Analogs found:** 12 / 13 (mobile-nav.tsx is new with no direct analog)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/layout.tsx` | layout | request-response | `app/layout.tsx` (self) | exact — 1-char change |
| `components/layout/sidebar.tsx` | component | request-response | `components/layout/sidebar.tsx` (self) | exact — class addition |
| `components/layout/header.tsx` | component | event-driven | `components/layout/header.tsx` (self) | exact — add button |
| `components/layout/mobile-nav.tsx` | component | event-driven | `components/layout/sidebar.tsx` | role-match (nav items reuse) |
| `components/clients/clients-table.tsx` | component | CRUD | `components/clients/clients-table.tsx` (self) | exact — 1-char change |
| `components/production/ordre-fabrication-table.tsx` | component | CRUD | `components/production/ordre-fabrication-table.tsx` (self) | exact — 1-char change |
| `components/livraisons/deliveries-table.tsx` | component | CRUD | `components/livraisons/deliveries-table.tsx` (self) | exact — 1-char change |
| `components/matieres/raw-materials-table.tsx` | component | CRUD | `components/matieres/raw-materials-table.tsx` (self) | exact — 1-char change |
| `components/clients/client-dialog.tsx` | component | request-response | `components/clients/client-dialog.tsx` (self) | exact — 1-class change |
| `components/production/recette-dialog.tsx` | component | request-response | `components/production/recette-dialog.tsx` (self) | exact — 1-class change |
| `components/production/production-wizard.tsx` | component | request-response | `components/production/production-wizard.tsx` (self) | exact — 1-class change |
| `components/livraisons/new-delivery-dialog.tsx` | component | request-response | `components/livraisons/new-delivery-dialog.tsx` (self) | exact — 1-class change |
| `components/matieres/reception-dialog.tsx` | component | request-response | `components/matieres/reception-dialog.tsx` (self) | exact — 1-class change |

---

## Pattern Assignments

### `app/layout.tsx` — layout offset

**Change:** Line 27 — `className="pl-60"` → `className="md:pl-60"`

**Current pattern** (lines 26-30):
```tsx
<div className="pl-60">
  <Header />
  <main className="px-6 py-6">
    <SeedProvider>{children}</SeedProvider>
  </main>
</div>
```

**After change:**
```tsx
<div className="md:pl-60">
```

No other changes to this file. The `md:` prefix makes the left offset apply only at ≥768px. At mobile widths the `<div>` has zero left offset, so content fills 100% width.

---

### `components/layout/sidebar.tsx` — hide on mobile

**Change:** Line 9 — add `hidden md:flex` to the `<aside>` className.

**Current pattern** (lines 7-9):
```tsx
export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-border bg-zinc-50">
```

**After change:**
```tsx
<aside className="fixed left-0 top-0 hidden md:flex h-screen w-60 flex-col border-r border-border bg-zinc-50">
```

Note: `flex` is currently in the class list. Replace bare `flex` with `hidden md:flex` — the element is hidden by default (mobile) and becomes a flex container at ≥768px. Do not duplicate `flex-col`.

---

### `components/layout/header.tsx` — add hamburger button

**Analog:** `components/layout/header.tsx` (self) + Button pattern from `components/ui/button.tsx`

**Current pattern** (lines 1-18):
```tsx
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
```

**After change — add MobileNav on the left, visible only on mobile:**
```tsx
"use client";

import { usePathname } from "next/navigation";
import { getActiveLabel } from "@/lib/nav";
import { ResetButton } from "@/components/layout/reset-button";
import { MobileNav } from "@/components/layout/mobile-nav";

export function Header() {
  const pathname = usePathname();
  const title = getActiveLabel(pathname);
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-zinc-50 px-6">
      <div className="md:hidden mr-3">
        <MobileNav />
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="ml-auto">
        <ResetButton />
      </div>
    </header>
  );
}
```

The `MobileNav` component owns both the trigger (hamburger button) and the Sheet. The `md:hidden` wrapper hides the entire trigger+drawer on desktop — sidebar handles navigation there.

---

### `components/layout/mobile-nav.tsx` — NEW: Sheet drawer (no direct analog)

**Analog for nav items rendering:** `components/layout/sidebar.tsx` (lines 2-5 imports, lines 15-27 nav map)
**Analog for Button pattern:** `components/ui/button.tsx`
**Sheet component:** to be installed via `npx shadcn@latest add sheet`

**Nav items source** (from `components/layout/sidebar.tsx`, lines 2-26):
```tsx
import { NAV_ITEMS } from "@/lib/nav";
import { NAV_ICONS } from "@/lib/nav-icons";
import { NavItem } from "@/components/layout/nav-item";

// Nav map pattern — reuse verbatim inside Sheet:
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
```

**Button ghost/icon pattern** (Decision D-04 — hamburger trigger):
```tsx
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

<Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
  <Menu size={20} />
</Button>
```

**Full template for `mobile-nav.tsx`** (~70 lines, satisfies D-08 and file-size-cap):
```tsx
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
          <nav className="flex flex-col gap-1 px-2 py-4">
            {NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item.iconName];
              return (
                <NavItem
                  key={item.route}
                  label={item.label}
                  route={item.route}
                  icon={Icon}
                  onClick={() => setOpen(false)}
                />
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

**Important:** `NavItem` currently does not accept an `onClick` prop. Two options:
1. Add optional `onClick?: () => void` to `NavItemProps` in `components/layout/nav-item.tsx` and forward to the `<Link>` element.
2. Wrap the entire `<Sheet>` nav in a click handler on the `<nav>` element using event delegation (`onClick={() => setOpen(false)}`).

Option 2 requires zero changes to `nav-item.tsx` — prefer it to stay within scope. The `<nav onClick={() => setOpen(false)}>` wrapper will close the sheet on any nav item click without modifying `NavItem`.

---

### Table files — `overflow-x-auto` pattern

**All four tables share the identical wrapper class string.** The change is the same in each file.

**Current wrapper** (identical in all 4 files):
```tsx
<div className="rounded-md border bg-background overflow-hidden">
```

**After change** — add `overflow-x-auto` before `overflow-hidden`:
```tsx
<div className="rounded-md border bg-background overflow-x-auto overflow-hidden">
```

Exact line references per file:
- `components/clients/clients-table.tsx` — line 49
- `components/production/ordre-fabrication-table.tsx` — line 44
- `components/livraisons/deliveries-table.tsx` — line 100
- `components/matieres/raw-materials-table.tsx` — line 135

`overflow-x-auto` allows the table to scroll horizontally when its content exceeds the container width. `overflow-hidden` on the same element still applies to the vertical axis and preserves the rounded corners clipping behaviour.

---

### Dialog files — `mx-4` mobile width pattern

**Pattern:** Every `DialogContent` that uses a fixed `sm:max-w-[Xpx]` needs `mx-4` added so dialogs have 16px margin on each side at widths below 640px (iPhone 390px).

**Current patterns found:**

`components/clients/client-dialog.tsx` line 108:
```tsx
<DialogContent className="sm:max-w-[480px]">
```
After: `<DialogContent className="mx-4 sm:max-w-[480px]">`

`components/production/recette-dialog.tsx` line 69:
```tsx
<DialogContent className="sm:max-w-[480px]">
```
After: `<DialogContent className="mx-4 sm:max-w-[480px]">`

`components/livraisons/new-delivery-dialog.tsx` line 128:
```tsx
<DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
```
After: `<DialogContent className="mx-4 sm:max-w-[640px] max-h-[90vh] overflow-y-auto">`

`components/matieres/reception-dialog.tsx` line 116:
```tsx
<DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
```
After: `<DialogContent className="mx-4 sm:max-w-[560px] max-h-[90vh] overflow-y-auto">`

`components/production/production-wizard.tsx` line 142:
```tsx
<DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
```
After: `<DialogContent className="mx-4 sm:max-w-[640px] max-h-[90vh] overflow-y-auto">`

Additionally for `production-wizard.tsx` (Decision D-07): wrap each step's content div with `min-w-0` to prevent flex children from overflowing. Search for step content divs inside the wizard after line 142 and add `min-w-0` to any `flex` child containers.

---

## Shared Patterns

### `md:` breakpoint convention
**Source:** `app/page.tsx` lines 36, 69, 104 — `grid-cols-1 md:grid-cols-2`
**Source:** `components/ui/textarea.tsx` line 12 — `md:text-sm`
**Source:** `components/ui/input.tsx` line 11 — `md:text-sm`
**Apply to:** All new responsive classes in Phase 20.

The project already uses Tailwind `md:` (768px) as the mobile/desktop breakpoint. No `sm:` breakpoint is used for layout — `sm:` is reserved for dialog max-width overrides only. Follow this consistently.

### Ghost icon button pattern
**Source:** `components/clients/clients-table.tsx` lines 100-108:
```tsx
<Button
  variant="ghost"
  size="sm"
  type="button"
  aria-label="Modifier"
  onClick={() => onEdit(customer)}
>
  <Pencil size={14} aria-hidden="true" />
</Button>
```
**Apply to:** Hamburger button in `mobile-nav.tsx`. Use `size="icon"` (not `size="sm"`) for a square touch target, `size={20}` for the Menu icon (larger than table action icons).

### `"use client"` directive
**Source:** Every layout component (`sidebar.tsx`, `header.tsx`, `nav-item.tsx`) uses `"use client"` on line 1.
**Apply to:** `mobile-nav.tsx` must also be `"use client"` — it manages `useState` for Sheet open state and uses `usePathname` indirectly via `NavItem`.

### Import path alias
**Source:** All files use `@/` alias (e.g., `@/lib/nav`, `@/components/ui/button`).
**Apply to:** All imports in `mobile-nav.tsx`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `components/layout/mobile-nav.tsx` | component | event-driven | No Sheet/drawer component exists yet in the codebase. shadcn Sheet must be installed first. Nav items rendering is reused from sidebar.tsx but the Sheet wrapper is net-new. |

---

## Pre-requisite: Install shadcn Sheet

Sheet is not present in `components/ui/` (confirmed by directory listing). Before writing `mobile-nav.tsx`, run:

```bash
npx shadcn@latest add sheet
```

This generates `components/ui/sheet.tsx` which exports `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`, `SheetTrigger`, and `SheetPortal`.

---

## Metadata

**Analog search scope:** `components/layout/`, `components/clients/`, `components/production/`, `components/livraisons/`, `components/matieres/`, `components/ui/`, `app/`
**Files scanned:** 17
**Pattern extraction date:** 2026-05-05
