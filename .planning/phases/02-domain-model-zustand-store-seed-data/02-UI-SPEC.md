---
phase: 2
slug: domain-model-zustand-store-seed-data
status: draft
shadcn_initialized: true
preset: inherits Phase 1 (New York / neutral / CSS variables)
created: 2026-05-04
---

# Phase 2 — UI Design Contract (Supplemental)

> **Supplemental contract.** Phase 2 is primarily a non-visual data-layer phase (types, Zustand store, seed fixtures, helpers). The only net-new UI surface is the **reset confirmation `AlertDialog`** that replaces Phase 1's stub button behavior, plus the success toast wired to it. All tokens, colors, typography, spacing, and the broader copywriting contract are inherited from `01-UI-SPEC.md` without override.
>
> **Inheritance rule:** every section below either declares a phase-specific composition or explicitly defers to Phase 1. The auditor must validate Phase 2 surface against Phase 1 tokens — no token redeclaration is permitted here.

---

## Design System

Inherits Phase 1 §Design System — no override.

**New shadcn component installed in this phase:** `alert-dialog`

```bash
npx shadcn@2.10.0 add alert-dialog
```

This updates the Phase 1 component inventory: `alert-dialog` was listed as "first phase = 9 (audit)" — Phase 2 promotes it to first-used in Phase 2 because it satisfies the destructive-confirmation primitive for the reset flow ahead of schedule.

---

## Spacing Scale

Inherits Phase 1 §Spacing Scale — no override.

The reset `AlertDialog` uses shadcn defaults (`p-6` content padding, `gap-2` between footer buttons) which already align with Phase 1's md/lg tokens.

---

## Typography

Inherits Phase 1 §Typography — no override.

`AlertDialog` typography mapping (shadcn defaults already comply):
- `<AlertDialogTitle>` → Heading role (`text-xl font-semibold leading-snug`).
- `<AlertDialogDescription>` → Body role (`text-sm font-normal leading-6 text-muted-foreground`).
- `<AlertDialogAction>` / `<AlertDialogCancel>` button labels → Label role (`text-sm font-medium`).

---

## Color

Inherits Phase 1 §Color — no override.

Reset `AlertDialog` color contract:
- Dialog surface: `bg-background` (dominant 60%).
- Confirm button (`<AlertDialogAction>`): `destructive` variant — `bg-destructive text-destructive-foreground` (#DC2626 red-600). This matches Phase 1's destructive reservation for "Reset démo" confirmation.
- Cancel button (`<AlertDialogCancel>`): `outline` variant — neutral, no accent.
- No accent blue inside this dialog (consistent with Phase 1: accent is reserved for creation/confirmation CTAs, not destructive flows).

---

## Component Inventory (Phase 2 net-new + amendments)

| Component | Path | Type | Purpose |
|-----------|------|------|---------|
| `<ResetButton />` (amended) | `components/layout/reset-button.tsx` | Client | Phase 1 stub replaced: clicking now opens `<AlertDialog>`; on confirm → `useTraceabilityStore.getState().resetToSeed()` + `toast.success("Données démo réinitialisées.")` |
| `<AlertDialog />` (shadcn) | `components/ui/alert-dialog.tsx` | (shadcn) | Installed via `npx shadcn@2.10.0 add alert-dialog`. No customization — use shadcn defaults |
| `<DlcBadge />` | *not built in Phase 2* | — | Phase 2 ships only the `dlcColor()` helper in `lib/dlc.ts`; the visual `<DlcBadge />` component is first built in Phase 3. Phase 2 surface has no DLC rendering |

File-size budget per file: ≤ 300 lines (locked, inherited from Phase 1).

---

## Reset Confirmation Dialog — Composition Spec

The only screen-level interaction in this phase. Composition is fully prescriptive so the executor can implement without design ambiguity.

**Trigger:** Header `<ResetButton />` (variant `ghost`, label "Réinitialiser démo", icon `RotateCcw` size 16). Phase 1 surface, unchanged visually.

**Mechanism:** wrap the existing button with `<AlertDialog>` / `<AlertDialogTrigger asChild>` so the button retains its Phase 1 styling but opens the dialog instead of firing the stub toast.

**Dialog structure (shadcn `AlertDialog` primitives):**

```
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="sm">
      <RotateCcw size={16} />
      Réinitialiser démo
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Réinitialiser les données démo ?</AlertDialogTitle>
      <AlertDialogDescription>
        Cette action efface l'intégralité des données de démonstration et restaure le jeu de données initial. Cette opération est irréversible.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction
        className={buttonVariants({ variant: "destructive" })}
        onClick={handleReset}
      >
        Réinitialiser
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Behavior on confirm:**
1. Wipe `localStorage` (clear the Zustand persist key) AND reset in-memory store state (avoid stale React state).
2. Re-seed by invoking the same `seedIfEmpty` / `resetToSeed` action used at first-mount.
3. Fire `toast.success("Données démo réinitialisées.")` (sonner — already mounted globally via Phase 1's `<Toaster />`).
4. Dialog closes (shadcn `AlertDialogAction` default behavior).

**Behavior on cancel:**
- Dialog closes. No state mutation. No toast.

**Keyboard / focus contract (shadcn `AlertDialog` defaults — verify, do not customize):**
- `Esc` → cancels (closes dialog, no mutation).
- `Tab` cycles between Cancel and Confirm; initial focus lands on `AlertDialogCancel` (shadcn default — non-destructive default focus is the safer choice for destructive flows).
- Click outside content area → no-op (modal-with-overlay; matches Radix `AlertDialog` semantics, distinct from `Dialog`).

---

## Copywriting Contract (Phase 2 net-new)

All copy below is **locked** per CONTEXT.md §Specifics. Tone follows Phase 1's formal French B2B contract (no emojis, second-person plural implied, no exclamation marks).

| Element | Copy | Source |
|---------|------|--------|
| Reset dialog title | Réinitialiser les données démo ? | CONTEXT.md §Specifics |
| Reset dialog body | Cette action efface l'intégralité des données de démonstration et restaure le jeu de données initial. Cette opération est irréversible. | CONTEXT.md §Specifics |
| Reset confirm button | Réinitialiser | CONTEXT.md §Specifics |
| Reset cancel button | Annuler | CONTEXT.md §Specifics |
| Reset success toast | Données démo réinitialisées. | CONTEXT.md §Specifics |

**Note on copy reconciliation with Phase 1:**

Phase 1's inherited copy table (§Destructive confirmations row "Reset démo") declared a slightly different body text and an unpunctuated toast:

| Field | Phase 1 declared | Phase 2 (this contract, locked) | Resolution |
|-------|------------------|----------------------------------|------------|
| Body | "Cette action efface toutes les données saisies et restaure le seed initial. Cette opération est irréversible." | "Cette action efface l'intégralité des données de démonstration et restaure le jeu de données initial. Cette opération est irréversible." | **Phase 2 wins.** CONTEXT.md is the canonical source for this surface; Phase 1 was a forward-looking placeholder. The Phase 2 wording is more formal-B2B ("l'intégralité des données de démonstration" vs "toutes les données saisies") and aligns better with the prospect-facing tone. |
| Toast | "Données démo réinitialisées" (no period) | "Données démo réinitialisées." (period) | **Phase 2 wins.** Adds terminal period to match formal sentence punctuation. Phase 1's table convention for other toasts (single phrase, no period) is preserved for non-confirmation toasts; destructive-confirmation success messages take a period as a sentence. |

This is recorded as an amendment to Phase 1's inherited copy table.

All other copy (sidebar labels, header reset button label, placeholder descriptions, future empty states, future CTAs) — **inherited from Phase 1, no change.**

---

## Amendments to Phase 1 Contract

1. **`alert-dialog` first-phase moved from 9 → 2.** Phase 1's component inventory listed `alert-dialog` as "first phase 9 (audit)" with the note "if not satisfied by `dialog`". Phase 2 establishes that `AlertDialog` (not `Dialog`) is the correct primitive for destructive confirmations because (a) Radix `AlertDialog` has stricter semantics (forces explicit cancel/confirm, no outside-click dismiss, role="alertdialog"), and (b) it's idiomatic for shadcn destructive flows. Therefore: install `alert-dialog` in Phase 2 and use it for the reset flow. Subsequent destructive flows (delete client in Phase 6) should also use `AlertDialog`, not `Dialog`.

2. **Reset dialog body + toast copy updated** (see Copywriting Contract reconciliation table above).

No other tokens, scales, or contracts are amended.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official (`ui.shadcn.com`) | `alert-dialog` (net-new in Phase 2) | not required — official shadcn registry |

No third-party registries declared. No third-party blocks introduced.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — all net-new strings locked from CONTEXT.md, formal French B2B tone, Phase 1 reconciliation documented.
- [ ] Dimension 2 Visuals: PASS — single `AlertDialog` composition, shadcn defaults, no custom visuals.
- [ ] Dimension 3 Color: PASS — destructive confirm uses Phase 1's reserved destructive token; no accent in this surface.
- [ ] Dimension 4 Typography: PASS — `AlertDialog` typography maps cleanly to Phase 1's Heading / Body / Label roles.
- [ ] Dimension 5 Spacing: PASS — shadcn `AlertDialog` internal spacing aligns with Phase 1's md/lg scale.
- [ ] Dimension 6 Registry Safety: PASS — only shadcn official, `alert-dialog` block.

**Approval:** pending
