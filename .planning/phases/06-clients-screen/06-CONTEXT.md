# Phase 6: Clients Screen - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Manage restaurant clients via CRUD; drill into any client to see their delivery history with full upstream traçabilité.

**Requirements:** REQ-clients-crud, REQ-client-detail-history.

**Success criteria (ROADMAP §Phase 6):**
1. `/clients` shows a clients table with "+ Nouveau client" + edit/delete affordances per row; mutations show toasts.
2. Clicking a client row opens a detail view listing every Delivery for that client.
3. Each delivery row in detail view is expandable to reveal its broches (n° lot interne, poids, DLC).
4. From any broche, the user can reach upstream raw material lots that contributed to it (link or inline expansion exposing fournisseur lot numbers).
5. Deleting a client requires confirmation and shows a success toast.

</domain>

<decisions>
## Implementation Decisions

### Locked
- Stack as before. File-size cap 300. French only.
- Customer type already defined in `lib/types.ts`.
- Store actions exist: `addCustomer`, `updateCustomer`, `deleteCustomer`.
- Delivery → customer linkage via `Delivery.customerId`.
- Broche traceability: `FinishedProduct.productionOrderId` → `ProductionOrder.matieresPremieresUtilisees[].rawMaterialId` → `RawMaterial`.
- AlertDialog already installed (Phase 5).
- shadcn primitives needed: probably none new. Maybe `Table`, `Dialog`, `Form`, `Input`, `Button` (all installed).
- Reuse `<EmptyState>`, `<DlcBadge>`, `<Combobox>` (probably not needed here), `<DatePicker>` (not needed here).
- Routes: `/clients` (list) + `/clients/[id]` (detail). Use Next.js dynamic route segment.

### Claude's Discretion
- Form for create/edit: `<ClientDialog>` parametrized by `mode: "create" | "edit"` and optional `client` prop. Reuse the same dialog for both.
- Customer fields: id (uuid), nom (required, min 2), adresse (required), telephone (required), email (optional, validated email if present).
- Detail view at `/clients/[id]`: header with client info, then a list of Deliveries (each expandable via `Collapsible` or shadcn's accordion-like primitive — or just internal `useState` per row).
- Each delivery row in expansion: list broches (n° lot interne, poids, DLC); each broche can be clicked to navigate to `/tracabilite?lot={numeroLotInterne}` (placeholder until Phase 7 builds it). For now, also support inline expansion: clicking the broche reveals upstream raw material lots inline.
- Pure helpers in `lib/clients.ts`:
  - `getDeliveriesForCustomer(customerId, deliveries): Delivery[]`
  - `getBrochesForDelivery(delivery, finishedProducts): FinishedProduct[]`
  - `getRawMaterialsForBroche(broche, productionOrders, rawMaterials): { rm: RawMaterial; quantiteUtilisee: number }[]`

</decisions>

<code_context>
## Existing Code Insights

- Existing pages use `"use client"` and Zustand store directly.
- Hydration guard: `if (!hasHydrated) return <Stub />`.
- Inline action with AlertDialog confirmation pattern from `components/livraisons/deliveries-table.tsx`.
- Client/deliveries linkage: `deliveries.filter(d => d.customerId === id)`.
- `crypto.randomUUID()` for new ids.

</code_context>

<specifics>
## Specific Ideas

- Page `/clients`:
  - Header CTA: "+ Nouveau client" → opens `<ClientDialog mode="create" />`.
  - Table columns: Nom, Adresse, Téléphone, Email, Actions (Edit/Delete buttons).
  - Click any row navigates to `/clients/{id}` (use Next.js `<Link>`).
  - Empty state: `<EmptyState icon={Users} heading="Aucun client" body="Ajoutez votre premier client pour suivre les livraisons." cta={...}>`.

- Detail page `/clients/[id]`:
  - Server component that uses `useParams` (since we are client-only). Actually since we're storing state in Zustand (client-side), the page must be a `"use client"` component, reading params via `useParams()`.
  - Header section: nom (h2), adresse, telephone, email. Plus a "Retour aux clients" link.
  - Below: list of deliveries in chronological order (most recent first). For each:
    - Top row: date, n° broches, poids total, statut badge.
    - Expand button revealing the broches (table inside).
    - Each broche row clickable to expand again revealing upstream raw materials (inline accordion).

- Toasts:
  - Created: `Client ajouté — {nom}`
  - Updated: `Client mis à jour — {nom}`
  - Deleted: `Client supprimé`

- Validation messages: same patterns as Phase 3/5 ("Champ requis", "Email invalide" for email format).

</specifics>

<deferred>
## Deferred Ideas

- Cascading deletes (deleting a client with active deliveries) — for POC, just delete the client; Phase 9 polish can add a guard if time allows.
- Paginated tables — none (≤30 rows expected).

</deferred>
