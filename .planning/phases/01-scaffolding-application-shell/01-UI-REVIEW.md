# Phase 1 — UI Review

**Audited:** 2026-05-04
**Baseline:** `.planning/phases/01-scaffolding-application-shell/01-UI-SPEC.md`
**Screenshots:** not captured (dev server live at :3000, but `playwright` browser binary not installed — `npx playwright install` required before any future screenshot run; code-only audit for this pass)
**Audit stance:** adversarial — no scores were averaged upward.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Six placeholder copy strings + brand + reset stub toast all byte-exact match against UI-SPEC's locked French copy table. |
| 2. Visuals | 3/4 | Sober B2B layout; one stylistic drift — sidebar active-state indicator is rendered as a pill-shaped pip (`rounded-full`, inset top/bottom 6px) instead of a flush left-edge strip. |
| 3. Color | 4/4 | HSL tokens map correctly to declared zinc/blue palette; accent (`bg-primary`) appears only on the active sidebar strip and inside shadcn `Button` variants — no hardcoded hex, no off-list semantic colors leaking. |
| 4. Typography | 2/4 | Header reset button renders at **12px (`text-xs`)** because shadcn's `size="sm"` variant overrides to `text-xs` — UI-SPEC permits only `text-sm`/`text-xl`/`text-3xl` (+ `text-base` for brand). Brand row uses `text-base` which is also undeclared in the §Typography table (though mandated by §Layout). Two undeclared sizes in a 4-size budget. |
| 5. Spacing | 4/4 | All spacing classes resolve to the 4px scale (`px-6`, `py-4`, `gap-3`, `h-9`, `h-14`, `w-60`). Only one bracketed value found — `min-h-[calc(100vh-3.5rem)]` — which is a computed layout expression using the contract's exact 56px header height, not an arbitrary spacing value. |
| 6. Experience Design | 3/4 | Focus-visible ring on nav items, `aria-current="page"`, `aria-hidden="true"` on decorative icons, sticky header, sonner stub wired correctly. Missing: explicit hover→active "pressed" state on nav items (`bg-zinc-200`) declared in §Color §Hover/focus/active table. |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **Header reset button label is 12px, not the contract's 14px.**
   File: `components/layout/reset-button.tsx:10` uses `<Button size="sm" …>`, which in `components/ui/button.tsx:25` resolves to `h-8 rounded-md px-3 text-xs`. The `text-xs` (12px) breaks UI-SPEC §Typography §Label (14px / `text-sm font-medium`).
   Fix: either drop `size="sm"` and let the default size's `text-sm` apply, or override at call site with `className="text-sm"` (cheapest), or — preferred — patch the local `button.tsx` `sm` variant to drop the `text-xs` token so the whole project stays on the 4-size scale. This change ripples to every later phase that uses small buttons.

2. **Sidebar active indicator is a pill, not an edge strip.**
   File: `components/layout/nav-item.tsx:31-34`. The strip is rendered as `top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary` — i.e. inset 6px top/bottom and pill-rounded. UI-SPEC §Color and §Layout describe a 2px `bg-primary` *left-edge* indicator (full-row height). User has visually approved, so this is contract drift, not a bug — but later phases inherit this and the contract should either be amended (preferred — pill is arguably more refined) or the implementation aligned (drop the inset and `rounded-full`).
   Fix (align): replace with `<span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" aria-hidden="true" />`.

3. **Active-pressed state on sidebar items is unimplemented.**
   File: `components/layout/nav-item.tsx:25-28`. UI-SPEC §Color §Hover/focus/active row 1 declares the inactive item's pressed state as `bg-zinc-200`. The `cn()` block only declares resting and hover. No `active:bg-zinc-200`. Keyboard users pressing Enter/Space will see no feedback distinguishable from hover.
   Fix: append `active:bg-zinc-200` to the inactive branch's class string (and consider the same on the `Button` ghost variant for the reset button — UI-SPEC declares `bg-zinc-200` pressed for the header ghost button too).

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

Verified byte-exact against UI-SPEC §Copywriting Contract Phase 1 table:

| Element | Expected | Actual | File:Line |
|---------|----------|--------|-----------|
| App brand | `TraceKebab` | `TraceKebab` | `components/layout/sidebar.tsx:24` |
| Sidebar items (×6, ordered) | `Tableau de bord` / `Matières premières` / `Production` / `Livraisons` / `Clients` / `Traçabilité` | match | `lib/nav.ts:21-26` |
| Header reset button | `Réinitialiser démo` | `Réinitialiser démo` | `components/layout/reset-button.tsx:16` |
| Reset stub toast (`toast.info`) | `Disponible en Phase 2` | `Disponible en Phase 2` | `components/layout/reset-button.tsx:12` |
| `/` description | `Les indicateurs clés de votre activité s'afficheront ici dès la phase 8.` | match | `app/page.tsx:8` |
| `/matieres-premieres` description | `La gestion des lots de matières premières arrive en phase 3.` | match | `app/matieres-premieres/page.tsx:8` |
| `/production` description | `Les recettes et ordres de fabrication arrivent en phase 4.` | match | `app/production/page.tsx:8` |
| `/livraisons` description | `Le suivi des livraisons arrive en phase 5.` | match | `app/livraisons/page.tsx:8` |
| `/clients` description | `La gestion des clients arrive en phase 6.` | match | `app/clients/page.tsx:8` |
| `/tracabilite` description | `Le moteur de traçabilité bidirectionnelle arrive en phase 7.` | match | `app/tracabilite/page.tsx:8` |

All accents and apostrophes (`s'afficheront`) preserved. Toast variant is correctly `toast.info` (not `toast()` or `toast.success`), matching the inherited copy contract row. No emojis, no anglicisms, no generic "Submit/OK/Cancel" patterns found in `grep -rn "Submit\|Click Here\|OK"` of the source. Tone is formal "vous" throughout.

`<title>` metadata is `TraceKebab` and the description is in French — consistent with `<html lang="fr">`. PASS without reservation.

### Pillar 2: Visuals (3/4)

- **Focal point per route:** PlaceholderPage centers a 48px muted icon + bold title + grey description block in the viewport. Clear focal point per route. PASS.
- **Icon-only controls have aria labels:** `RotateCcw` has `aria-hidden="true"` and the button still has the visible "Réinitialiser démo" label, so the affordance is announced correctly. Nav item icons are `aria-hidden`, label is the accessible name. PASS.
- **No decorative shadows or animations:** confirmed — only `shadow-lg` appears on the sonner toast surface (`components/ui/sonner.tsx:17`), which is a minor inflation over UI-SPEC §Density's "shadcn default `shadow-md` on dialogs" rule. Toast is dialog-adjacent so `shadow-lg` is defensible but undeclared.
- **Sidebar active indicator visual drift:** `nav-item.tsx:31-34` renders the indicator as `top-1.5 bottom-1.5 w-0.5 rounded-full` — a 24px tall pill inset 6px from top and bottom. UI-SPEC §Color line 168 + §Layout line 213 describe a flush 2px `bg-primary` left strip (full-row height). The pill reads more like a "current item dot" than an "edge strip". User has visually approved, but the contract wording is unambiguous. Either amend the spec or align the code.

Score reduced one point for the active-strip drift (most user-visible visual contract deviation).

### Pillar 3: Color (4/4)

- **`grep -rn "#[0-9a-fA-F]\|rgb("` returns no matches** in `app/` or `components/` (only the comments in `app/globals.css` reference hex codes — those are documentation). Zero hardcoded colors in TSX. PASS.
- **HSL token verification against UI-SPEC §Color Tailwind hex column:**

  | Token | Spec hex | globals.css HSL | Resolved | Match |
  |-------|----------|-----------------|----------|-------|
  | `--background` | `#FFFFFF` | `0 0% 100%` | `#FFFFFF` | ✓ |
  | `--foreground` | `#18181B` (zinc-900) | `240 6% 10%` | ≈ `#181819` | ✓ (rounded form, ≤1 LSB delta) |
  | `--primary` | `#2563EB` (blue-600) | `221.2 83.2% 53.3%` | `#2563EB` | ✓ exact |
  | `--destructive` | `#DC2626` (red-600) | `0 84% 60%` | ≈ `#EB3B3B` | ⚠ slight drift; tailwind red-600 is `0 72.2% 50.6%` (`#DC2626`). Current value renders a brighter red. **Not exercised in Phase 1 surface** — flagged here for Phase 2 amendment/audit. |
  | `--muted-foreground` | `#71717A` (zinc-500) | `240 4% 46%` | ≈ `#71717A` | ✓ |
  | `--border` | `#E4E4E7` (zinc-200) | `240 6% 90%` | ≈ `#E4E4E7` | ✓ |
  | `--ring` | blue-600 (per §Color "focus ring matches primary") | `221.2 83.2% 53.3%` | `#2563EB` | ✓ |

- **Accent reserved-for compliance:**
  - `bg-primary` appears in: `components/layout/nav-item.tsx:33` (active strip — declared), `components/ui/button.tsx:13` (default variant — declared for primary CTAs), `components/ui/button.tsx:21` (link variant — `text-primary`, used nowhere on Phase 1 surface), `components/ui/sonner.tsx:20` (toast actionButton, not exercised on Phase 1 surface). All occurrences are inside the reserved-for envelope.
  - Phase 1 surface's only blue pixel is the active sidebar strip — matches the §Color reserved-for list line 130. PASS.
- **Semantic colors (DLC + alerts) absent from Phase 1 surface.** PASS (correctly scoped — no premature use).

Note on `--destructive` HSL drift: this is **not exercised** anywhere in Phase 1 (no destructive button rendered). Flagging now so Phase 2 (when reset confirmation lands) audits the actual rendered red against `#DC2626`. Score not docked since the dimension to audit is "Phase 1 surface".

### Pillar 4: Typography (2/4)

`grep -rohn "text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)"` results across `app/` + `components/`:

```
text-xs   — components/ui/button.tsx:25 (sm size variant)
text-sm   — components/ui/button.tsx:8 (base), nav-item.tsx:23, placeholder-page.tsx:29
text-base — components/layout/sidebar.tsx:24 (brand row)
text-xl   — components/layout/header.tsx:12, components/placeholder-page.tsx:28
```

`grep -rohn "font-(thin|...|extrabold)"` results:

```
font-medium    — button.tsx:8, nav-item.tsx:23
font-semibold  — sidebar.tsx:24 (brand), header.tsx:12 (page title), placeholder-page.tsx:28 (placeholder title)
```

**UI-SPEC §Typography permits only:** `text-sm` (Body 14px / Label 14px), `text-xl` (Heading 20px), `text-3xl` (Display 28px). Three sizes exercised in Phase 1 (Display not yet on the surface). Two weights: `font-normal` (default), `font-medium`, `font-semibold`. Wait — `font-normal` and `font-medium` and `font-semibold` is **three** weights, but UI-SPEC line 100 says "two weights": medium (500) and semibold (600). Body uses `font-normal` (400) which is the default and is also explicitly listed in the §Typography Body row. So three weights are technically declared (400/500/600) and all three appear. PASS on weights.

**Two drifts on size:**

1. `text-xs` (12px) at `components/ui/button.tsx:25` — fires whenever any caller uses `<Button size="sm">`. The reset button on the header is exactly that case (`reset-button.tsx:10`), so the rendered text "Réinitialiser démo" is **12px**, not the 14px contract for §Label role. **BLOCKER for Pillar 4.**
2. `text-base` (16px) at `components/layout/sidebar.tsx:24` for the brand "TraceKebab". UI-SPEC §Typography table does NOT include `text-base`, but UI-SPEC §Layout line 215 explicitly mandates `text-base font-semibold` for the brand row. Internal contradiction in the spec. The implementation followed §Layout. Recommend: amend §Typography to add a "Brand" role (16px / 600 / `text-base font-semibold`) to remove the contradiction.

Score 2/4: drift #1 is real (a button label is rendering at the wrong size) and warrants a fix. Drift #2 is a spec internal inconsistency that the implementation resolved correctly but should be reconciled.

### Pillar 5: Spacing (4/4)

Spacing classes used (exhaustive list across audited files):

`gap-1` `gap-2` `gap-3` `gap-4` `px-2` `px-3` `px-4` `px-6` `px-8` `py-2` `py-4` `py-6` `h-8` `h-9` `h-10` `h-14` `h-screen` `w-9` `w-60` `w-0.5` (= 2px — declared exception for active strip).

All resolve to the 4px scale. The single arbitrary expression found is `min-h-[calc(100vh-3.5rem)]` at `placeholder-page.tsx:25` — a layout calc subtracting the header's `3.5rem` (56px) to fill remaining viewport. This uses the contract's exact 56px header height. Acceptable as a layout expression, not a spacing-scale violation.

**Layout dimensions verified:**

- Sidebar: `w-60 h-screen` ✓ (240px × full height) — `sidebar.tsx:21`
- Header: `h-14` ✓ (56px) — `header.tsx:11`
- Sidebar item: `h-9 px-3 gap-3` ✓ (36px × 12px × 12px gap) — `nav-item.tsx:23`
- Sidebar internal padding: `px-2 py-4` — UI-SPEC declares `py-4` ✓ but doesn't specify horizontal; `px-2` lets each item's `px-3` produce a 20px effective inset, which reads correct.
- Brand row: `h-14 px-4` ✓ (56px × 16px) — `sidebar.tsx:23`
- Header padding: `px-6` ✓ — `header.tsx:11`
- Main content padding: `px-6 py-6` ✓ — `layout.tsx:28`
- Layout offset for sidebar: `pl-60` ✓ — `layout.tsx:26`

PASS without reservation.

### Pillar 6: Experience Design (3/4)

**Accessibility & state coverage:**

- ✓ `<html lang="fr">` (layout.tsx:21) — required for screen readers / spell-check.
- ✓ `aria-current="page"` on the active nav item (nav-item.tsx:21).
- ✓ `aria-hidden="true"` on the decorative active strip (nav-item.tsx:32) and on icons paired with visible labels (placeholder-page.tsx:27, reset-button.tsx:15).
- ✓ Focus-visible keyboard ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on nav items (nav-item.tsx:24). shadcn Button has its own focus-visible ring (button.tsx:8).
- ✓ Sticky header (`sticky top-0 z-10`) — header.tsx:11.
- ✓ Sonner registered globally with light theme + top-right + `richColors={false}` matching §Design System line 28 — sonner.tsx:9-13.
- ✓ Reset button stub fires `toast.info("Disponible en Phase 2")` exactly per UI-SPEC line 238 — reset-button.tsx:12.

**Missing / partial:**

- ✗ **No active/pressed state on nav items.** UI-SPEC §Color §Hover/focus/active row 1 declares pressed = `bg-zinc-200`. `nav-item.tsx:27` only has resting + hover. Keyboard activation (Enter/Space) shows no distinct pressed feedback. **Specific fix:** append `active:bg-zinc-200` to the inactive branch's class list.
- ✗ **No active state on the reset button either.** UI-SPEC §Color row 3 says ghost button pressed = `bg-zinc-200`. The shadcn ghost variant only has `hover:bg-accent hover:text-accent-foreground` (button.tsx:20). Same fix pattern.
- — Loading / error / empty states: not applicable to the Phase 1 surface (placeholders are intentionally inert — UI-SPEC line 247 "No CTAs"). PASS by exemption.
- — Disabled-state styling: not exercised; shadcn Button has `disabled:pointer-events-none disabled:opacity-50` baked in (button.tsx:8). PASS by inheritance.

Score 3/4: solid baseline accessibility, two missing pressed-state classes that the contract explicitly requires.

---

## Registry Safety

`components.json` confirms `style: new-york`, `baseColor: neutral`, shadcn official registry only. Two shadcn components installed: `button.tsx`, `sonner.tsx`. UI-SPEC §Registry Safety line 386 declares only the official `ui.shadcn.com` registry.

Per the audit definition (third-party registries trigger automated `shadcn view` / suspicious-pattern grep): **no third-party registries declared, no third-party blocks installed, registry audit skipped.** No flags.

Manual sanity check on the two installed components for sanity:

- `components/ui/button.tsx`: pure Radix `Slot` + `cva` variants, no `fetch`, no `process.env`, no dynamic imports, no `eval`. Clean.
- `components/ui/sonner.tsx`: pure re-export of `sonner`'s `Toaster` with class overrides. No network, no env access, no dynamic code. Clean.

Registry audit: 0 third-party blocks checked, no flags.

---

## Files Audited

- `app/globals.css` — HSL tokens vs §Color table
- `app/layout.tsx` — root mount of Sidebar / Header / `<main>` / Toaster, `pl-60`, `lang="fr"`, GeistSans/Mono variables
- `tailwind.config.ts` — semantic color mapping, `fontFamily.sans` / `.mono` referencing `var(--font-geist-sans/mono)`
- `components/layout/sidebar.tsx` — `fixed left-0 top-0 h-screen w-60 bg-zinc-50 border-r border-border`, brand row `h-14 px-4 text-base font-semibold`
- `components/layout/nav-item.tsx` — active state, focus ring, indicator strip, hover transitions
- `components/layout/header.tsx` — `sticky h-14 bg-zinc-50 border-b px-6`, page title `text-xl font-semibold`, reset button right-anchored
- `components/layout/reset-button.tsx` — ghost variant, `RotateCcw size=16`, sonner stub copy
- `components/placeholder-page.tsx` — centered layout, `min-h-[calc(100vh-3.5rem)]`, 48px muted icon, title + description
- `components/ui/sonner.tsx` — light theme, top-right, `richColors={false}`
- `components/ui/button.tsx` — variant audit (text-xs in `sm` size flagged)
- `lib/nav.ts` — six nav items in canonical order, `getActiveLabel`, `isActiveRoute`
- `app/page.tsx`, `app/matieres-premieres/page.tsx`, `app/production/page.tsx`, `app/livraisons/page.tsx`, `app/clients/page.tsx`, `app/tracabilite/page.tsx` — placeholder copy strings (all byte-exact)

**Not audited / out of scope for Phase 1 surface:** `lib/utils.ts` (shadcn `cn` helper, no UI implications), `components/ui/button.tsx` variants beyond `default`/`ghost` (not exercised in Phase 1 — destructive/outline/secondary deferred to Phase 2+ audit).
