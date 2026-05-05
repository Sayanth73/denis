---
phase: 07-tracabilite-screen
plan: 03
subsystem: tracabilite
tags: [next-link, next-navigation, sonner-toast, cross-screen-navigation, broches-expansion, production-wizard]

requires:
  - phase: 07-01
    provides: lib/tracabilite.ts helpers, TracabiliteSection, TracabilitePrintable, @media print CSS
  - phase: 07-02
    provides: app/tracabilite/page.tsx, TracabiliteUpstream, TracabiliteDownstream components

provides:
  - components/clients/broches-expansion.tsx (lot number cell → /tracabilite?lot= clickable link)
  - components/production/production-wizard.tsx (success toast → "Voir la traçabilité" action link)

affects:
  - Phase 7 complete — all 4 REQ-tracabilite-* requirements fulfilled
  - Cross-screen navigation story: any broche lot number anywhere in the app links to /tracabilite

tech-stack:
  added: []
  patterns:
    - next/link for static href navigation from table cell (no router needed)
    - useRouter at component level for programmatic navigation inside toast.success action
    - Defensive spread pattern for conditional toast action: ...(firstBrocheLot ? { action: {...} } : {})

key-files:
  created: []
  modified:
    - components/clients/broches-expansion.tsx
    - components/production/production-wizard.tsx

key-decisions:
  - "Used next/link Link component (not router.push) for BrochesExpansion lot cell — static href, simpler, no useRouter hook needed"
  - "Used defensive spread ...(firstBrocheLot ? { action } : {}) on toast to guard against empty brochesProduites edge case"
  - "Added useRouter at ProductionWizard component level (not inside handler) to satisfy React hooks rules"

requirements-completed:
  - REQ-tracabilite-search
  - REQ-tracabilite-upstream
  - REQ-tracabilite-downstream
  - REQ-tracabilite-pdf-export

duration: ~5min
completed: 2026-05-05
---

# Phase 7 Plan 03: Cross-Screen Tracabilite Link Integrations Summary

**Two surgical link integrations completing the Phase 7 cross-screen traceability navigation story: BrochesExpansion lot numbers are now clickable links to /tracabilite, and the production wizard success toast has a "Voir la traçabilité" action button.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-05
- **Completed:** 2026-05-05
- **Tasks:** 2 auto + 1 human-verify (auto-approved per milestone policy)
- **Files modified:** 2

## Accomplishments

- `BrochesExpansion` N° lot interne cell: replaced `<span className="font-mono">` with `<Link href="/tracabilite?lot={fp.numeroLotInterne}" className="font-mono hover:underline text-primary">` — users on the client detail page can now jump directly to the traçabilité view for any delivered broche
- `ProductionWizard` success toast: added `action: { label: "Voir la traçabilité", onClick: () => router.push("/tracabilite?lot={firstBrocheLot}") }` — users who just confirmed production can navigate immediately to the new broche's traceability record
- Both integrations are PRD §9 step 4 requirements — completes the full POC demo flow

## Task Commits

1. **Task 1: Add /tracabilite?lot= link in BrochesExpansion lot number cell** — `6921159` (feat)
2. **Task 2: Add tracabilite toast action in production wizard confirmation** — `8f8cc8a` (feat)

## Files Modified

- `components/clients/broches-expansion.tsx` — Added `import Link from "next/link"` + wrapped `fp.numeroLotInterne` span in `<Link href="/tracabilite?lot={fp.numeroLotInterne}" className="font-mono hover:underline text-primary" title="Voir la traçabilité de ce lot">`. File: 195 lines.
- `components/production/production-wizard.tsx` — Added `import { useRouter } from "next/navigation"`, `const router = useRouter()` at component level, `const firstBrocheLot = brochesProduites[0]?.numeroLotInterne ?? ""`, and defensive toast action. File: 240 lines.

## Implementation Details

### BrochesExpansion Link (Task 1)

```tsx
import Link from "next/link";

// Before:
<TableCell className="py-2 px-4 text-sm">
  <span className="font-mono">{fp.numeroLotInterne}</span>
</TableCell>

// After:
<TableCell className="py-2 px-4 text-sm">
  <Link
    href={`/tracabilite?lot=${fp.numeroLotInterne}`}
    className="font-mono hover:underline text-primary"
    title="Voir la traçabilité de ce lot"
  >
    {fp.numeroLotInterne}
  </Link>
</TableCell>
```

`text-primary` maps to `--primary: 221.2 83.2% 53.3%` (accent blue) — no new color token.

### Production Wizard Toast Action (Task 2)

```typescript
// Component level:
const router = useRouter();

// Inside handleConfirm(), after building brochesProduites:
const firstBrocheLot = brochesProduites[0]?.numeroLotInterne ?? "";
toast.success(`Production confirmée — ${nombreBroches} broches (${selectedRecipe.nom})`, {
  ...(firstBrocheLot
    ? {
        action: {
          label: "Voir la traçabilité",
          onClick: () => router.push(`/tracabilite?lot=${firstBrocheLot}`),
        },
      }
    : {}),
});
```

## Deviations from Plan

None — plan executed exactly as written. Both tasks matched the locked interface contracts in the plan's `<interfaces>` block.

## Phase 7 Complete — All Requirements Fulfilled

All four traceability requirements are now fully implemented across the three waves:

| Requirement | Wave | Status |
|-------------|------|--------|
| REQ-tracabilite-search | Wave 2 (07-02) | Complete — search bar, URL sync, shortcut chips |
| REQ-tracabilite-upstream | Wave 2 (07-02) | Complete — TracabiliteUpstream Cas 1 view |
| REQ-tracabilite-downstream | Wave 2 (07-02) | Complete — TracabiliteDownstream Cas 2 view |
| REQ-tracabilite-pdf-export | Wave 1+2 (07-01, 07-02) | Complete — useReactToPrint + print isolation CSS |

Cross-screen navigation (Wave 3, this plan) cements the full POC demo flow per PRD §9 step 4.

## Verification Results

All five verification checks passed:

1. `grep -q "import Link from" components/clients/broches-expansion.tsx` — PASS
2. `grep -q "/tracabilite?lot=" components/clients/broches-expansion.tsx` — PASS
3. `grep -q "tracabilite" components/production/production-wizard.tsx` — PASS
4. `grep -q "Voir la traçabilité" components/production/production-wizard.tsx` — PASS
5. File sizes: broches-expansion.tsx 195 lines, production-wizard.tsx 240 lines (both under 300-line cap) — PASS

## Threat Surface Scan

No new threat surface introduced. Both integrations use store-generated lot numbers (validated format at creation time via `generateLotNumber()`). Threat model T-07-07 (BrochesExpansion href tampering) and T-07-08 (toast router.push injection) both accepted — same-origin navigation only, no user-controlled input enters the URLs.

## Known Stubs

None — both integrations use live data (`fp.numeroLotInterne` from FinishedProduct store records, `brochesProduites[0]` from the just-confirmed production order).

## Self-Check: PASSED

- `components/clients/broches-expansion.tsx` — exists, 195 lines, Link import and /tracabilite?lot= href present
- `components/production/production-wizard.tsx` — exists, 240 lines, "Voir la traçabilité" and tracabilite path present
- Commits `6921159` and `8f8cc8a` verified in git log
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0 — /tracabilite route in build output
- Task 3 checkpoint:human-verify auto-approved per milestone policy (tsc + build pass)
