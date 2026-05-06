---
phase: 19-sauvegarde-restauration-json
reviewed: 2026-05-05T00:00:00Z
depth: deep
files_reviewed: 2
files_reviewed_list:
  - components/parametres/backup-section.tsx
  - lib/store.ts
findings:
  critical: 3
  warning: 3
  info: 1
  total: 7
status: issues_found
verdict: FAIL
---

# Phase 19: Code Review — JSON Backup/Restore

**Reviewed:** 2026-05-05
**Depth:** deep (cross-file, call-chain tracing)
**Files Reviewed:** 2 (`backup-section.tsx`, `lib/store.ts` for store contract)
**Status:** FAIL — 3 Critical blockers must be resolved before shipping

---

## Summary

The backup/restore feature has the right structure: export via Blob download, import via
FileReader, confirmation dialog before destructive write. However, three Critical defects make
it unsafe to ship as-is:

1. `isValidSnapshot` checks key *presence* only — not type or shape. A file containing
   `{ "rawMaterials": null, ... }` passes validation and then corrupts the entire store,
   crashing every list view.
2. `handleConfirmImport` has no error handling. If `setState` throws (storage quota, middleware
   error), the dialog freezes open and the store may be partially written with no recovery path.
3. The Blob URL is revoked synchronously after `a.click()`, before the browser has fetched the
   blob — reliably failing the download on Firefox and intermittently on Chrome.

Three Warnings address silent FileReader failures, missing file-size guard, and wholesale
`as never` casts that defeat TypeScript's protection at the most critical boundary in the
feature.

---

## Critical Issues

### CR-01: `isValidSnapshot` — null/non-array values pass, write null into store arrays

**File:** `components/parametres/backup-section.tsx:30-37`

**Issue:**
`isValidSnapshot` only checks `k in obj` — key presence. It does not check that each field
is an array (or, for `settings`, an object). A crafted or malformed file such as:

```json
{ "rawMaterials": null, "recipes": null, "productionOrders": null,
  "finishedProducts": null, "customers": null, "deliveries": null,
  "factures": null, "settings": null }
```

passes `isValidSnapshot` because every key exists. `handleConfirmImport` then writes these
`null` values into the store via `setState`. Every downstream component that calls
`.map()` / `.filter()` on `rawMaterials`, `recipes`, etc. will throw
`TypeError: Cannot read properties of null (reading 'map')`, crashing the entire UI.
This is a data-loss + crash scenario: the user confirms the restore, the store is overwritten
with nulls, the app is inoperable, and there is no undo.

**Fix — add array/object type guards:**

```typescript
function isValidSnapshot(obj: unknown): obj is StoreSnapshot {
  if (typeof obj !== "object" || obj === null) return false;
  const r = obj as Record<string, unknown>;
  const arrayKeys: (keyof StoreSnapshot)[] = [
    "rawMaterials", "recipes", "productionOrders", "finishedProducts",
    "customers", "deliveries", "factures",
  ];
  if (arrayKeys.some((k) => !Array.isArray(r[k]))) return false;
  if (typeof r.settings !== "object" || r.settings === null || Array.isArray(r.settings)) {
    return false;
  }
  return true;
}
```

For defense in depth, also validate that `settings` has the expected scalar fields
(`iban`, `nomCreancier`, `adresseLigne1`, `adresseLigne2`, `delaiPaiementJours`).

---

### CR-02: `handleConfirmImport` — no error handling, dialog freezes on setState throw

**File:** `components/parametres/backup-section.tsx:85-99`

**Issue:**
`useTraceabilityStore.setState(...)` (line 87) is called with no try/catch. Zustand's
`persist` middleware writes to `localStorage` synchronously inside `setState`. If `localStorage`
is full (QuotaExceededError), the middleware write throws. Additionally, any Zustand subscriber
that throws will propagate through `setState`. When this happens:

- `setPendingImport(null)` on line 98 is never reached — the dialog stays permanently open.
- `toast.success("Données restaurées")` on line 97 may or may not have fired.
- The store is in an unknown partial state (some slices written, some not).
- There is no recovery path: the user cannot close the dialog without a page reload.

**Fix:**

```typescript
function handleConfirmImport() {
  if (!pendingImport) return;
  try {
    useTraceabilityStore.setState({
      rawMaterials: pendingImport.rawMaterials as never,
      recipes: pendingImport.recipes as never,
      // ... rest of fields
    }, false);
    toast.success("Données restaurées");
  } catch (err) {
    console.error("[backup] setState failed:", err);
    toast.error("Restauration échouée — stockage insuffisant ou données invalides.");
  } finally {
    setPendingImport(null);
  }
}
```

Using `finally` guarantees the dialog closes regardless of outcome.

---

### CR-03: Blob URL revoked synchronously — download fails on Firefox, intermittent on Chrome

**File:** `components/parametres/backup-section.tsx:56-61`

**Issue:**
`URL.revokeObjectURL(url)` is called on line 61 immediately after `a.click()` on line 60.
`a.click()` dispatches the click event synchronously, but the browser's download manager
fetches the Blob URL asynchronously after the current call stack unwinds. Revoking the URL
before the browser fetches it invalidates the object URL, producing a download that either
fails silently or produces a zero-byte file. This is a reproducible failure on Firefox and
an intermittent race on Chrome.

**Fix — defer revocation:**

```typescript
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `tracekebab-backup-${new Date().toISOString().slice(0, 10)}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
// Revoke after browser has had a chance to schedule the download
setTimeout(() => URL.revokeObjectURL(url), 100);
```

Note: the anchor also needs to be appended to `document.body` before clicking — some
browsers ignore programmatic clicks on detached elements (see Warning WR-03 below for
a separate callout).

---

## Warnings

### WR-01: `FileReader.onerror` absent — silent hang on OS-level read failure

**File:** `components/parametres/backup-section.tsx:68-81`

**Issue:**
If `FileReader.readAsText` encounters an OS error (file removed between selection and read,
permission denied), neither `onload` nor any error callback fires unless `onerror` is set.
The user sees no feedback, the spinner-equivalent is the cursor — there is no toast, no
dialog dismissal. The component silently stalls.

**Fix — add `onerror` handler:**

```typescript
reader.onerror = () => {
  toast.error("Impossible de lire le fichier.");
};
reader.readAsText(file);
```

---

### WR-02: No file-size guard before `FileReader.readAsText`

**File:** `components/parametres/backup-section.tsx:65-83`

**Issue:**
An arbitrarily large file (e.g., 500 MB) is passed directly to `readAsText` with no size
check. `FileReader.readAsText` on the main thread will read the entire file into a JS string,
blocking the UI thread and potentially exhausting memory. A legitimate TraceKebab backup is
well under 1 MB; anything larger is almost certainly not a valid backup.

**Fix — add a size check before reading:**

```typescript
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — generous upper bound
if (file.size > MAX_BYTES) {
  toast.error("Fichier trop volumineux. La taille maximale est 5 Mo.");
  e.target.value = "";
  return;
}
const reader = new FileReader();
// ... rest of handler
```

---

### WR-03: `as never` casts in `handleConfirmImport` defeat TypeScript at the restore boundary

**File:** `components/parametres/backup-section.tsx:88-95`

**Issue:**
Eight `as never` casts are needed because `StoreSnapshot` types all fields as `unknown`, but
`useTraceabilityStore.setState` requires typed values. This means TypeScript provides zero
type safety between JSON.parse output and the store write — the most critical boundary in the
entire feature. If a future store refactor adds a required field, TypeScript will not catch
that the snapshot restore skips it.

The root cause is that `StoreSnapshot` uses `unknown` instead of the actual domain types.

**Fix — type `StoreSnapshot` with domain types and remove the casts:**

```typescript
import type { RawMaterial, Recipe, ProductionOrder, FinishedProduct,
               Customer, Delivery, Facture, AppSettings } from "@/lib/types";

type StoreSnapshot = {
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  productionOrders: ProductionOrder[];
  finishedProducts: FinishedProduct[];
  customers: Customer[];
  deliveries: Delivery[];
  factures: Facture[];
  settings: AppSettings;
};
```

`isValidSnapshot` would then be a genuine type guard and the `as never` casts would
disappear, restoring compiler protection across the restore path.

---

## Info

### IN-01: Anchor not appended to DOM before click — may silently no-op in some browsers

**File:** `components/parametres/backup-section.tsx:57-60`

**Issue:**
The created `<a>` element is never appended to `document.body` before `.click()` is called.
The MDN-documented pattern and browser compatibility guidance requires the element to be in
the document for programmatic click to reliably trigger a download. Some non-Chromium browsers
ignore clicks on detached elements. This interacts with CR-03 (the fix there includes the
`appendChild`/`removeChild` pattern).

**Fix:** See CR-03 fix snippet — `document.body.appendChild(a)` before `a.click()`, then
`document.body.removeChild(a)` after.

---

## Verdict

**FAIL** — 3 Critical blockers.

| # | Severity | Issue |
|---|----------|-------|
| CR-01 | BLOCKER | `isValidSnapshot` accepts null/non-array values; corrupts store and crashes app |
| CR-02 | BLOCKER | `handleConfirmImport` has no error handling; dialog freezes on localStorage quota error |
| CR-03 | BLOCKER | Blob URL revoked synchronously; download silently fails on Firefox |
| WR-01 | WARNING | `FileReader.onerror` absent; OS read errors produce silent hang |
| WR-02 | WARNING | No file-size guard; 500 MB file freezes UI thread |
| WR-03 | WARNING | `as never` casts defeat TypeScript at JSON→store boundary |
| IN-01 | INFO | Detached anchor `.click()` may no-op in non-Chromium browsers |

CR-01 and CR-02 together create a viable path to data loss: a malformed file passes
validation, the restore writes garbage to the store, and if that write throws, the dialog
locks up with the corrupted state already partially applied. Fix all three Criticals before
shipping.

---

_Reviewed: 2026-05-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
