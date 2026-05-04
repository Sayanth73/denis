---
phase: 01-scaffolding-application-shell
reviewed: 2026-05-04T00:00:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - package.json
  - tsconfig.json
  - tailwind.config.ts
  - components.json
  - app/globals.css
  - app/layout.tsx
  - app/page.tsx
  - app/matieres-premieres/page.tsx
  - app/production/page.tsx
  - app/livraisons/page.tsx
  - app/clients/page.tsx
  - app/tracabilite/page.tsx
  - components/ui/button.tsx
  - components/ui/sonner.tsx
  - components/layout/sidebar.tsx
  - components/layout/nav-item.tsx
  - components/layout/header.tsx
  - components/layout/reset-button.tsx
  - components/placeholder-page.tsx
  - lib/utils.ts
  - lib/nav.ts
findings:
  blocker: 0
  warning: 3
  total: 3
status: clean
---

# Phase 1: Code Review Report

**Reviewed:** 2026-05-04
**Depth:** standard
**Files Reviewed:** 21
**Status:** clean (all 3 warnings resolved 2026-05-04)

## Summary

Phase 1 ships a clean Next.js 14 / TypeScript-strict / Tailwind / shadcn (New York, neutral) scaffold with sidebar, header, six placeholder routes, the `cn` util, and a Sonner toaster. All 21 files are well under the 300-line cap (max 72 lines, total 600). UI is French-only, no emojis, no debug artifacts, no hardcoded secrets, no dangerous APIs (`eval`, `innerHTML`, `dangerouslySetInnerHTML`), no empty catch blocks, no TODO/FIXME, no `any` casts, no unhandled promises (no async code yet). Stack matches the 18 locked decisions in `PROJECT.md` (Next 14, TS strict, Tailwind, shadcn neutrals, lucide-react, sonner).

Findings are all minor quality issues — three WARNINGs around latent route-matching boundaries, code duplication of the icon registry, and a defensive `Toaster` props order. No BLOCKERs.

Note: `lucide-react@^1.14.0` was verified against the npm registry — this is genuinely the current `latest` dist-tag of the legitimate `lucide-icons/lucide` repository (not a typosquat or supply-chain issue), so the unusually-low major version is correct.

## Warnings

### WR-01: `isActiveRoute` and `getActiveLabel` use unbounded `startsWith` — latent prefix collision

**File:** `lib/nav.ts:38-46`
**Issue:** `pathname.startsWith(item.route)` and `pathname.startsWith(route)` (lines 39, 45) treat any path beginning with the route string as a match. Today none of the six locked routes (`/`, `/matieres-premieres`, `/production`, `/livraisons`, `/clients`, `/tracabilite`) collide, so the bug is latent — but `/production-foo`, `/clients-archive`, etc. would falsely highlight as active if such a route is ever added. The author already handled the special case for `/`; the same separator-aware check should be applied uniformly. This will silently misroute the active-state indicator the moment a sibling route is introduced (e.g., `/clients-archive` in a later phase).
**Fix:** Anchor prefix matches to a path separator so `/production` matches `/production` and `/production/123` but not `/production-foo`:

```ts
function matchesRoute(pathname: string, route: string): boolean {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(route + "/");
}

export function getActiveLabel(pathname: string): string {
  if (pathname === "/") return NAV_LABELS["/"];
  const match = NAV_ITEMS.find(
    (item) => item.route !== "/" && matchesRoute(pathname, item.route),
  );
  return match?.label ?? "TraceKebab";
}

export function isActiveRoute(pathname: string, route: string): boolean {
  return matchesRoute(pathname, route);
}
```

<resolution>
**Status:** resolved
**Commit:** c490bcc
**Applied:** Both `getActiveLabel` and `isActiveRoute` now use `pathname === route || pathname.startsWith(route + "/")` so prefix matches are anchored to a path separator. Inlined the check in both helpers (the review's `matchesRoute` extraction was optional refactor — kept changes minimal).
</resolution>

### WR-02: `ICONS` registry duplicated between `sidebar.tsx` and `placeholder-page.tsx`

**File:** `components/layout/sidebar.tsx:7-17`, `components/placeholder-page.tsx:4-14`
**Issue:** The exact same `Record<NavIconName, ...>` mapping `{ Home, Package, Factory, Truck, Users, Search }` is declared twice with two slightly different value types (the `placeholder-page.tsx` variant adds an `aria-hidden` prop). When a seventh nav icon is added in a later phase, both copies must be updated in lockstep — a classic drift hazard. `lib/nav.ts` already comments that it is the "single source of truth", so the icon registry should live there too (or in a sibling module that imports `NavIconName`).
**Fix:** Extract a single `ICONS` registry (e.g., into `lib/nav-icons.tsx` — a `.tsx` client-safe module since icons are React components) and import it from both consumers. Use the broadest prop type so both call sites are covered:

```tsx
// lib/nav-icons.tsx
import { Home, Package, Factory, Truck, Users, Search, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import type { NavIconName } from "@/lib/nav";

export const NAV_ICONS: Record<NavIconName, ComponentType<LucideProps>> = {
  Home, Package, Factory, Truck, Users, Search,
};
```

<resolution>
**Status:** resolved
**Commit:** d9f2e39
**Applied:** Created `lib/nav-icons.tsx` exporting `NAV_ICONS: Record<NavIconName, ComponentType<LucideProps>>`. Both `components/layout/sidebar.tsx` and `components/placeholder-page.tsx` now import the shared registry and dropped their local `ICONS` maps + direct `lucide-react` icon imports.
</resolution>

### WR-03: `Toaster` defaults are overridable by spread order — defensive ordering missing

**File:** `components/ui/sonner.tsx:7-27`
**Issue:** `const Toaster = ({ ...props }: ToasterProps) => ( <Sonner theme="light" position="top-right" richColors={false} ... {...props} /> )` spreads `props` *after* the hardcoded values, so any caller passing `theme`, `position`, `richColors`, `className`, or `toastOptions` silently overrides the project-wide defaults locked by UI-SPEC. For a POC this is unlikely to fire, but the typical shadcn pattern places `{...props}` *before* the locked defaults precisely to prevent accidental overrides of project conventions (or omits the spread entirely if no caller-supplied props are intended). With only one call site (`app/layout.tsx:30 <Toaster />` no props), this is currently harmless but invites regressions when a later phase passes through props.
**Fix:** Either drop the spread (no caller currently passes props):

```tsx
const Toaster = (props: ToasterProps) => (
  <Sonner
    {...props}
    theme="light"
    position="top-right"
    richColors={false}
    className="toaster group"
    toastOptions={{ /* ... */ }}
  />
);
```

…or, if extensibility is intended, move `{...props}` to the *first* attribute so locked defaults win. Either way, document the intent.

<resolution>
**Status:** resolved
**Commit:** e2f734a
**Applied:** Dropped the `{...props}` spread entirely. `Toaster` is now a zero-arg component — the only call site (`app/layout.tsx:30 <Toaster />`) passes no props, and locking the global UI defaults at the source matches the "no caller customization" intent for the POC.
</resolution>

---

_Reviewed: 2026-05-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
