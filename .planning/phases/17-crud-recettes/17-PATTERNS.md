# Phase 17: CRUD Recettes - Pattern Map

**Mapped:** 2026-05-05
**Files analyzed:** 2 (1 rewrite + 1 minor edit)
**Analogs found:** 2 / 2

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `components/production/recettes-tab.tsx` | component (CRUD UI + form dialogs + delete guard) | CRUD + event-driven | `components/clients/client-dialog.tsx` + `components/clients/clients-table.tsx` | exact (role + data flow) |
| `app/production/page.tsx` | page (host, minor edit) | request-response | self (existing file) | self |

---

## Pattern Assignments

### `components/production/recettes-tab.tsx` (component, CRUD)

**Primary analog:** `components/clients/client-dialog.tsx`
**Secondary analog:** `components/clients/clients-table.tsx`

---

**Imports pattern** — copy from `components/clients/client-dialog.tsx` lines 1-27 and `components/clients/clients-table.tsx` lines 1-27, merge as follows:

```typescript
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Edit2, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTraceabilityStore } from "@/lib/store";
import type { Recipe } from "@/lib/types";
```

---

**Store selector pattern (self-contained, no prop drilling)** — copy from `app/production/page.tsx` lines 13-16, adapted:

```typescript
// Source: app/production/page.tsx lines 9-16
// RecettesTab reads directly from store — no props passed from host page
export function RecettesTab() {
  const recipes          = useTraceabilityStore((s) => s.recipes);
  const productionOrders = useTraceabilityStore((s) => s.productionOrders);
  const customers        = useTraceabilityStore((s) => s.customers);
  const addRecipe        = useTraceabilityStore((s) => s.addRecipe);
  const updateRecipe     = useTraceabilityStore((s) => s.updateRecipe);
  const deleteRecipe     = useTraceabilityStore((s) => s.deleteRecipe);
  const updateCustomer   = useTraceabilityStore((s) => s.updateCustomer);
  // ...
}
```

---

**Zod schema + useForm pattern** — copy from `components/clients/client-dialog.tsx` lines 29-54:

```typescript
// Source: components/clients/client-dialog.tsx lines 29-54
const recipeSchema = z.object({
  nom:              z.string().min(1, "Le nom est requis."),
  prixParDefautHT:  z.coerce.number().positive("Le prix doit être un nombre positif."),
});
type RecipeFormValues = z.infer<typeof recipeSchema>;

// Inside the component:
const createForm = useForm<RecipeFormValues>({
  resolver: zodResolver(recipeSchema),
  defaultValues: { nom: "", prixParDefautHT: 0 },
});
const editForm = useForm<RecipeFormValues>({
  resolver: zodResolver(recipeSchema),
  defaultValues: { nom: "", prixParDefautHT: 0 },
});
```

Note: use `z.coerce.number()` (not `z.number()`) so HTML input strings are coerced automatically — avoids Pitfall 2.

---

**useEffect pre-fill on dialog open** — copy from `components/clients/client-dialog.tsx` lines 56-69:

```typescript
// Source: components/clients/client-dialog.tsx lines 56-69
// For CREATE dialog — reset to blank on open
React.useEffect(() => {
  if (createOpen) {
    createForm.reset({ nom: "", prixParDefautHT: 0 });
  }
}, [createOpen, createForm]);

// For EDIT dialog — pre-fill with current recipe values on open
React.useEffect(() => {
  if (editRecipe) {
    editForm.reset({ nom: editRecipe.nom, prixParDefautHT: editRecipe.prixParDefautHT });
  }
}, [editRecipe, editForm]);
```

Dependency arrays must include both `open`/`editRecipe` and `form` — matches `client-dialog.tsx` line 69: `[open, mode, client, form]`.

---

**Dialog JSX structure** — copy from `components/clients/client-dialog.tsx` lines 106-213:

```typescript
// Source: components/clients/client-dialog.tsx lines 106-213
<Dialog open={createOpen} onOpenChange={setCreateOpen}>
  <DialogContent className="sm:max-w-[480px]">
    <DialogHeader>
      <DialogTitle>Nouvelle recette</DialogTitle>
      <DialogDescription>
        Renseignez le nom et le prix de la recette.
      </DialogDescription>
    </DialogHeader>
    <Form {...createForm}>
      <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
        <FormField
          control={createForm.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Nom de la recette" maxLength={120} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={createForm.control}
          name="prixParDefautHT"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prix par défaut HT (CHF/kg)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" variant="default">Créer</Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

The edit dialog follows the same structure with `editForm`, title "Modifier la recette", and submit button "Enregistrer".

---

**pendingDeleteId AlertDialog pattern** — copy from `components/clients/clients-table.tsx` lines 35-45 and 127-155:

```typescript
// Source: components/clients/clients-table.tsx lines 35-45
const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

function handleDeleteClick(id: string) {
  const isReferenced = productionOrders.some((o) => o.recipeId === id);
  if (isReferenced) {
    toast.error("Impossible de supprimer : cette recette est utilisée dans des ordres de fabrication.");
    return;                     // short-circuit — do NOT set pendingDeleteId
  }
  setPendingDeleteId(id);
}

function handleConfirmDelete() {
  if (!pendingDeleteId) return;
  // Cascade FIRST, then delete — order is mandatory (see Pitfall 4 in RESEARCH.md)
  customers
    .filter((c) => c.tarifs.some((t) => t.recetteId === pendingDeleteId))
    .forEach((c) =>
      updateCustomer(c.id, { tarifs: c.tarifs.filter((t) => t.recetteId !== pendingDeleteId) })
    );
  deleteRecipe(pendingDeleteId);
  toast.success("Recette supprimée");
  setPendingDeleteId(null);
}
```

```typescript
// Source: components/clients/clients-table.tsx lines 127-155
// AlertDialogDescription uses asChild + <div> to avoid invalid <p>-wraps-<div> (Pitfall 3)
<AlertDialog
  open={pendingDeleteId !== null}
  onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Supprimer la recette</AlertDialogTitle>
      <AlertDialogDescription asChild>
        <div>
          <p>Êtes-vous sûr de vouloir supprimer « {pendingRecipe?.nom} » ?</p>
          <p className="mt-1">Cette action est irréversible.</p>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={handleConfirmDelete}
      >
        Supprimer
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

**Icon action buttons (ghost, size sm)** — copy from `components/clients/clients-table.tsx` lines 99-119:

```typescript
// Source: components/clients/clients-table.tsx lines 99-119
<div className="flex items-center gap-1">
  <Button
    variant="ghost"
    size="sm"
    type="button"
    aria-label="Modifier"
    onClick={() => setEditRecipe(recipe)}
  >
    <Edit2 size={14} aria-hidden="true" />
  </Button>
  <Button
    variant="ghost"
    size="sm"
    type="button"
    aria-label="Supprimer"
    className="text-destructive hover:text-destructive"
    onClick={() => handleDeleteClick(recipe.id)}
  >
    <Trash2 size={14} aria-hidden="true" />
  </Button>
</div>
```

---

**Tab content header row with CTA** — copy from `app/production/page.tsx` lines 34-40, adapted to tab-internal context (mb-4, not mb-6):

```typescript
// Source: app/production/page.tsx lines 34-40 (adapted — mb-4 for tab-level, not mb-6 page-level)
<div className="flex items-center justify-between mb-4">
  <div />
  <Button variant="default" size="sm" onClick={() => setCreateOpen(true)}>
    <Plus size={14} className="mr-1.5" aria-hidden="true" />
    Nouvelle recette
  </Button>
</div>
```

---

**Empty state pattern** — add when `recipes.length === 0`:

```typescript
// Pattern from RESEARCH.md anti-patterns section
{recipes.length === 0 && (
  <p className="text-sm text-muted-foreground py-8 text-center">Aucune recette.</p>
)}
```

---

**onSubmit handlers** — copy from `components/clients/client-dialog.tsx` lines 78-103:

```typescript
// Source: components/clients/client-dialog.tsx lines 78-103 (adapted)
function onSubmitCreate(values: RecipeFormValues) {
  addRecipe({
    id: crypto.randomUUID(),           // same as client-dialog.tsx line 83
    nom: values.nom.trim(),
    prixParDefautHT: values.prixParDefautHT,
    poidsTotal: 0,
    composition: [],
  });
  toast.success(`Recette créée — ${values.nom.trim()}`);
  setCreateOpen(false);
}

function onSubmitEdit(values: RecipeFormValues) {
  if (!editRecipe) return;
  updateRecipe(editRecipe.id, {
    nom: values.nom.trim(),
    prixParDefautHT: values.prixParDefautHT,
  });
  toast.success("Recette mise à jour");
  setEditRecipe(null);
}
```

---

### `app/production/page.tsx` (page, minor edit)

**Analog:** self (existing file, minimal change)

**Change required** — line 49, remove the `recipes` prop from `<RecettesTab>`:

```typescript
// BEFORE (app/production/page.tsx line 49):
<RecettesTab recipes={recipes} />

// AFTER:
<RecettesTab />
```

Also remove the `recipes` selector at line 13 if it is no longer referenced elsewhere on the page. Verify by checking whether `recipes` is passed to `<OrdreFabricationTable>` (it is, at line 55) — therefore the `recipes` selector at line 13 stays; only the prop to `<RecettesTab>` is removed.

---

## Shared Patterns

### Store access (direct, no prop drilling)
**Source:** `app/production/page.tsx` lines 13-16; `components/clients/clients-table.tsx` line 26
**Apply to:** `components/production/recettes-tab.tsx`

```typescript
// Source: app/production/page.tsx lines 13-16
const recipes          = useTraceabilityStore((s) => s.recipes);
const productionOrders = useTraceabilityStore((s) => s.productionOrders);
```

Use granular selectors (one per state slice) to avoid unnecessary re-renders. Do not use `useTraceabilityStore.getState()` in event handlers inside the component body — use the selector-bound values instead. (`getState()` is used inside `onSubmit` in `client-dialog.tsx` line 79 only because that component does not read state itself; RecettesTab does, so use the selector-bound values.)

### Toast pattern
**Source:** `components/clients/client-dialog.tsx` lines 91, 100; `components/clients/clients-table.tsx` line 43
**Apply to:** All submit and delete handlers

```typescript
// Source: components/clients/client-dialog.tsx lines 91 and 100
toast.success("Client ajouté — " + values.nom.trim());
toast.success("Client mis à jour — " + values.nom.trim());
// For error guard:
toast.error("Impossible de supprimer : ...");
```

### UUID generation
**Source:** `components/clients/client-dialog.tsx` line 83
**Apply to:** `onSubmitCreate` in RecettesTab

```typescript
// Source: components/clients/client-dialog.tsx line 83
id: crypto.randomUUID(),
```

### AlertDialogDescription with asChild
**Source:** `components/clients/clients-table.tsx` lines 136-141
**Apply to:** Delete confirmation AlertDialog in RecettesTab

```typescript
// Source: components/clients/clients-table.tsx lines 136-141
<AlertDialogDescription asChild>
  <div>
    <p>Êtes-vous sûr de vouloir supprimer {pendingCustomer?.nom} ?</p>
    <p className="mt-1">Cette action est irréversible.</p>
  </div>
</AlertDialogDescription>
```

This avoids the React hydration warning from a `<p>` wrapping a `<div>`.

---

## No Analog Found

No files in this phase lack an analog. Both files to be modified have direct analogs in the codebase.

---

## Metadata

**Analog search scope:** `components/clients/`, `components/production/`, `app/production/`, `lib/`
**Files scanned:** 4 (`client-dialog.tsx`, `clients-table.tsx`, `recettes-tab.tsx`, `app/production/page.tsx`) + `lib/store.ts` lines 1-170
**Pattern extraction date:** 2026-05-05

**Key decisions captured:**
- Two separate Dialog elements (create + edit) — not a single mode-switched dialog
- `z.coerce.number()` for `prixParDefautHT` — not `z.number()` + `valueAsNumber`
- Cascade (`updateCustomer`) called before `deleteRecipe` — mandatory ordering
- `AlertDialogDescription asChild` with inner `<div>` — avoids hydration warning
- `recipes` selector stays in `app/production/page.tsx` (used by `<OrdreFabricationTable>`) — only the prop pass to `<RecettesTab>` is removed
