# Phase 12: Auto-Factures - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (full autonomy)

<domain>
## Phase Boundary

Add Facture type to lib/types.ts, addFacture/deleteFacture to Zustand store, auto-create facture on "Marquer comme livrée" in delivery dialog, new /factures list and /factures/[id] detail pages, sidebar "Factures" entry.

</domain>

<decisions>
## Implementation Decisions

### Facture Type (lib/types.ts)
```typescript
export type FactureLigne = {
  brocheId: string;
  numeroLot: string;
  recetteNom: string;
  poidsKg: number;
  prixUnitaireHT: number; // 25 CHF/kg
  montantHT: number;      // poidsKg * prixUnitaireHT
};

export type Facture = {
  id: string;
  numeroFacture: string; // F-AAAA-NNNN
  livraisonId: string;
  clientId: string;
  dateFacture: string;   // ISO date
  lignes: FactureLigne[];
  totalHT: number;
  tva: number;           // 0.081
  totalTTC: number;
};
```

### Facture Number Format
- `F-AAAA-NNNN` e.g. `F-2026-0001`
- Helper in lib/factures.ts: `generateFactureNumber(date, sequence): string`
- Sequence: count existing factures + 1

### Store (lib/store.ts)
- Add `factures: Facture[]` to state and partialize
- Add `addFacture(f: Facture)`, `deleteFacture(id: string)` actions
- Seed: include `factures: []` in initialState and buildSeed return

### Auto-create on Marquer comme livrée (components/livraisons/new-delivery-dialog.tsx)
- In the confirm handler: after updating broche statuses and adding delivery, compute facture
- For each delivered broche: resolve recipe via getRecipeForBroche, compute montantHT = poids * 25
- totalHT = sum of montantHT, tva = 0.081, totalTTC = totalHT * 1.081
- Toast: "Livraison confirmée — Facture [numeroFacture] générée"

### Routes
- /factures — list table: N° facture, Client, Date, Nb broches, Total HT, TVA, Total TTC + row link
- /factures/[id] — detail: client header, lignes table, totals footer, "Imprimer / PDF" button via react-to-print
- Both are client components reading from Zustand store

### Sidebar
- Icon: Receipt from lucide-react
- Label: "Factures"
- Position: after "Livraisons" in lib/nav.ts

### File Size
- Max 300 lines per file — split components into components/factures/ if needed

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- lib/lot-number.ts generateLotNumber pattern — model generateFactureNumber similarly
- lib/finished-products.ts getRecipeForBroche — use in auto-create logic
- components/tracabilite/tracabilite-printable.tsx + useReactToPrint — pattern for print button
- lib/raw-materials.ts formatDate — use for date display
- components/empty-state.tsx, components/dlc-badge.tsx

### Established Patterns
- Store additions: follow lib/store.ts existing CRUD action pattern
- Nav: lib/nav.ts NavIconName union + NAV_ICONS record in lib/nav-icons.tsx
- Print: useReactToPrint({ contentRef }) pattern from tracabilite-downstream.tsx
- Zod forms: z.string().refine() + parseFloat() — NO z.coerce.number()

### Integration Points
- lib/types.ts — add Facture, FactureLigne
- lib/store.ts — add state + actions
- lib/seed.ts — add factures: [] to seed return
- components/livraisons/new-delivery-dialog.tsx — trigger auto-create
- lib/nav.ts + lib/nav-icons.tsx — add Receipt icon
- app/factures/page.tsx — new list route
- app/factures/[id]/page.tsx — new detail route

</code_context>

<deferred>
None.
</deferred>
