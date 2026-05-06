---
phase: 17
plan: "01"
depth: standard
reviewed_files:
  - components/production/recette-dialog.tsx
  - components/production/recettes-tab.tsx
  - app/production/page.tsx
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 17 Code Review

## Summary

**PASS_WITH_WARNINGS.** The three files are structurally sound: the dialog/tab split is clean, the Zustand integration is correct, and the delete guard + cascade delete logic is coherent. Two warnings require attention before merge — a schema gap that allows `Infinity` through validation, and a visual glitch (orphan divider) for newly created recipes. No critical bugs or data-loss risks found.

## Findings

| Severity | File | Line | Finding |
|----------|------|------|---------|
| WARNING | `components/production/recette-dialog.tsx` | 34–35 | Schema accepts `Infinity` (`1e400` passes both refines) |
| WARNING | `components/production/recettes-tab.tsx` | 125–139 | Border divider renders unconditionally — orphan line when `composition` is empty |
| INFO | `components/production/recette-dialog.tsx` | 34–35 | Both `.refine()` calls run when first fails, emitting a spurious second error into the zod error array |
| INFO | `components/production/recettes-tab.tsx` | 126–139 | No empty-state hint inside composition section for newly created recipes |

---

## Critical (must fix before merge)

None.

---

## Warning (should fix)

### WR-01: Schema accepts `Infinity` — `1e400` passes both refines

**File:** `components/production/recette-dialog.tsx:34–35`

**Issue:** `parseFloat("1e400")` returns `Infinity`. `!Number.isNaN(Infinity)` is `true` and `Infinity > 0` is `true`, so the value passes validation and is written to the store as `recipe.prixParDefautHT = Infinity`. The `type="number"` attribute on the `<Input>` makes this hard to trigger from a browser keyboard, but it is not prevented at the schema level — programmatic form submission, pasting, or a future API surface could store `Infinity`. `(Infinity).toFixed(2)` renders the string `"Infinity"` in the price column rather than crashing, but the stored domain value is nonsensical.

**Fix:** Add a third refine (or merge into a single `.superRefine`) checking `isFinite`:

```ts
prixParDefautHT: z
  .string()
  .min(1, "Le prix est requis.")
  .refine((v) => {
    const n = parseFloat(v);
    return !Number.isNaN(n) && isFinite(n) && n > 0;
  }, "Le prix doit être un nombre positif."),
```

This collapses all three guards into one message and eliminates the `Infinity` gap.

---

### WR-02: Border divider always renders — orphan line for empty-composition recipes

**File:** `components/production/recettes-tab.tsx:125–139`

**Issue:** The `<div className="border-t border-border my-3" />` separator at line 125 is rendered unconditionally. All recipes created through the new dialog are initialised with `composition: []` (line 41). Those cards will display the recipe name and price, then a horizontal rule, then nothing — a floating divider with no content below it. Seed data always has non-empty compositions, so this is invisible in demo mode but will appear the moment a user creates their first recipe.

**Fix:** Gate the entire composition block on `recipe.composition.length > 0`:

```tsx
{recipe.composition.length > 0 && (
  <>
    <div className="border-t border-border my-3" />
    <div className="space-y-1.5">
      {recipe.composition.map((ing) => (
        <div key={ing.typeMatiere} className="flex items-center justify-between">
          <span className="text-sm text-foreground">{TYPE_LABELS[ing.typeMatiere]}</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {ing.pourcentage} %
          </span>
        </div>
      ))}
    </div>
  </>
)}
```

---

## Info (nice to have)

### IN-01: Both `.refine()` calls execute when the first fails — spurious second error in zod array

**File:** `components/production/recette-dialog.tsx:34–35`

**Issue:** Zod chains `.refine()` with `abort_early: false` semantics by default — all refines run regardless. For input `"abc"`, `parseFloat("abc") = NaN`, so both the `!isNaN` refine and the `> 0` refine fail. The zod error array for the field contains two entries: `"Le prix doit être un nombre."` and `"Le prix doit être un nombre positif."`. `<FormMessage>` renders only `error.message` (the first), so the second error is never shown to the user. It is benign, but it is noise in the error object and slightly confusing when debugging.

**Fix:** Either consolidate into a single refine (see WR-01 fix above), or use `.superRefine()` to return early after the first failure:

```ts
.superRefine((v, ctx) => {
  const n = parseFloat(v);
  if (Number.isNaN(n) || !isFinite(n)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Le prix doit être un nombre." });
    return z.NEVER; // abort remaining checks
  }
  if (n <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Le prix doit être un nombre positif." });
  }
})
```

---

### IN-02: No empty-state hint in composition section for new recipes

**File:** `components/production/recettes-tab.tsx:126–139`

**Issue:** Once WR-02 is fixed (composition block hidden when empty), the card for a newly created recipe will show only name + price with no indication that the composition is empty. A user might not realise the recipe is incomplete. This is a UX gap rather than a bug.

**Fix (optional):** Inside the `recipe.composition.length > 0` guard, add an `else` branch:

```tsx
{recipe.composition.length === 0 && (
  <p className="text-xs text-muted-foreground mt-2">Aucun ingrédient — composition à définir.</p>
)}
```

---

## Verdict

**PASS_WITH_WARNINGS.** Fix WR-01 (Infinity in schema) and WR-02 (orphan divider) before merging. No logic errors, no security issues, no data-loss paths. The delete guard, cascade-delete, and dialog reset patterns are all correct. The `app/production/page.tsx` 1-line change is clean — `recipes` is still consumed by `<OrdreFabricationTable>` on line 55 so there is no unused selector.

---

_Reviewed: 2026-05-05T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
