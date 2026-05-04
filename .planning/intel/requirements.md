# Requirements (Synthesized)

Source: §5 Écrans à implémenter and §9 Critères de succès of the PRD. Each requirement carries a stable ID, source attribution, description, and acceptance criteria.

---

## REQ-layout-shell — Application shell with sidebar navigation

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.1)
- scope: navigation, layout
- description: Provide a fixed left sidebar with navigation entries and a header carrying the page title plus a discrete "Réinitialiser démo" reset button.
- acceptance:
  - Sidebar lists: Tableau de bord, Matières premières, Production, Livraisons, Clients, Traçabilité (with the icons listed in §5.1).
  - Header shows the current page title.
  - Header includes a discrete reset button in the top-right that resets `localStorage` to seed state.
  - Navigation works on every page; the active route is visually indicated.

## REQ-dashboard — Dashboard with KPI cards, alerts, and recent activity

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.2)
- scope: dashboard
- description: Route `/` shows 4 KPI cards across the top, then two columns: alerts and recent activity timeline.
- acceptance:
  - 4 KPI cards: "Matières premières en stock" (count of active lots, red alert if any DLC < 3 days), "Broches en stock" (count + total weight), "Production cette semaine" (count of broches produced), "Livraisons cette semaine" (count + estimated value).
  - Alerts column lists: raw materials with near DLC, low stock, broches not delivered for >3 days.
  - Recent activity column shows the 5 most recent actions (réceptions, productions, livraisons) as a timeline.

## REQ-raw-materials-list — Sortable raw materials table

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.3)
- scope: raw materials
- description: Route `/matieres-premieres` displays a sortable table of all received lots.
- acceptance:
  - Columns: Type, Nom, Fournisseur, N° lot fournisseur, Quantité restante / reçue, DLC (color badge per proximity), Statut.
  - Columns are sortable.
  - Empty state shown when no lots exist: "Aucune matière première en stock — réceptionnez votre premier lot".

## REQ-raw-material-receive — Receive a new raw material lot

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.3)
- scope: raw materials
- description: From the raw materials page, the user can receive a new lot via a Dialog form.
- acceptance:
  - Trigger: "+ Réceptionner un lot" button opens a Dialog.
  - Form fields: Type (select), Nom (input), Fournisseur (input with auto-complete on existing suppliers), N° de lot fournisseur (input), Quantité reçue en kg (number), Date de réception (date picker, default today), DLC (date picker), Température de réception en °C (number), Certificat sanitaire (optional input).
  - All fields required except Certificat sanitaire.
  - Validation: DLC must be strictly later than Date de réception.
  - On confirm: persist the new RawMaterial; show a success toast.

## REQ-recipes-readonly — Recipes tab listing seeded recipes

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.4 — Onglet Recettes)
- scope: production / recipes
- description: Within `/production`, a "Recettes" tab lists the 3 seeded recipes with their composition. Read-only.
- acceptance:
  - 3 recipes shown: "Broche standard 25 kg", "Broche poulet 20 kg", "Broche premium agneau 15 kg".
  - Each recipe shows its composition (typeMatiere + pourcentage rows summing to 100%).
  - No create/edit/delete affordance.

## REQ-production-orders-list — Production orders table

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.4 — Onglet Ordres de fabrication)
- scope: production
- description: Within `/production`, an "Ordres de fabrication" tab lists every production order.
- acceptance:
  - Columns: Date, Recette, Nombre de broches, Poids total, Lots consommés (linkable).
  - "Lots consommés" links navigate to or expand into the lot detail/traçabilité.

## REQ-production-wizard — 3-step production order wizard

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.4 — Onglet Ordres de fabrication)
- scope: production
- description: Creating a production order goes through a 3-step wizard.
- acceptance:
  - Step 1: choose a recipe and number of broches.
  - Step 2: for each ingredient of the chosen recipe, the system computes the total required quantity and proposes available lots of that type sorted by DLC ascending (FIFO). User may split the required quantity across one or more lots. UI shows in real time "manquant : X kg" if allocation is short.
  - Step 3: récapitulatif page with a "Confirmer la production" button.
  - On confirmation:
    1. Decrement `quantiteRestante` on every consumed lot.
    2. Create N FinishedProduct broches with auto-generated internal lot numbers (format DEC-internal-lot-format).
    3. Create the ProductionOrder linking inputs to outputs.
    4. Show a success toast with a link to the traçabilité screen for the new production.

## REQ-deliveries-list — Deliveries table

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.5)
- scope: deliveries
- description: Route `/livraisons` lists all deliveries in a table.
- acceptance:
  - Columns: Date, Client, Nombre de broches, Poids total, Statut.

## REQ-delivery-create — Create a new delivery

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.5)
- scope: deliveries
- description: From `/livraisons`, the user can create a delivery via a Dialog.
- acceptance:
  - Trigger: "+ Nouvelle livraison" button opens a Dialog.
  - Fields: Client (searchable select), Date de livraison, Broches en stock (multi-select with checkboxes showing n° lot interne, poids, DLC), Notes (optional textarea).
  - Two-state action: "Préparer la livraison" then "Marquer comme livrée".
  - On "Marquer comme livrée": broches transition `en_stock` → `livree`, the Delivery is created, and broches reference the Delivery via `livraisonId`.

## REQ-clients-crud — Clients list with basic CRUD

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.6)
- scope: clients
- description: Route `/clients` provides basic CRUD over restaurant clients.
- acceptance:
  - Table of clients.
  - "+ Nouveau client" creates a client.
  - Edit and delete affordances on each client.

## REQ-client-detail-history — Client detail with delivery history and full trace

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.6)
- scope: clients, traçabilité
- description: Clicking a client opens a detail view including the history of deliveries received, with each delivery expandable to show the broches and the upstream raw materials.
- acceptance:
  - Detail view lists every Delivery for the client.
  - Each delivery is expandable to reveal its broches.
  - From a broche, the upstream raw material lots are reachable (full traçabilité chain visible from the client view).

## REQ-tracabilite-search — Traçabilité search bar with example shortcuts

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.7)
- scope: traçabilité
- description: Route `/tracabilite` provides a prominent search bar accepting either a supplier lot number or an internal broche lot number, plus two example shortcut buttons.
- acceptance:
  - Large search bar with placeholder: "Rechercher un numéro de lot (matière première ou broche finie)...".
  - Two example buttons above the bar:
    - "🔎 Voir un exemple : tracer un lot de matière première" — pre-fills with a seeded supplier lot number.
    - "🔎 Voir un exemple : tracer une broche livrée" — pre-fills with a seeded internal lot number.
  - Search routes to the appropriate result view (Cas 1 or Cas 2).

## REQ-tracabilite-upstream — Trace from raw material to clients (Cas 1)

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.7 — Cas 1)
- scope: traçabilité
- description: Searching by a supplier lot number renders three vertically stacked sections with visual connections.
- acceptance:
  - Section 1 (🟦 Matière première): card with all lot info — fournisseur, certificat sanitaire, dates (réception, DLC), température, etc.
  - Section 2 (🟨 Ordres de fabrication concernés): every production order that consumed the lot, with quantity used.
  - Section 3 (🟥 Clients impactés): every restaurant that received a broche derived from the lot, with delivery date and the internal broche lot number.
  - Visual connection (lines/arrows) drawn between the three sections.
  - "📄 Exporter dossier traçabilité (PDF)" button visible in the top-right.

## REQ-tracabilite-downstream — Trace from broche to raw materials (Cas 2)

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.7 — Cas 2)
- scope: traçabilité
- description: Searching by an internal broche lot number renders the inverse three-section view.
- acceptance:
  - Section 1 (🟥 Broche finie): n° lot interne, date de production, poids, DLC, client livré + date de livraison.
  - Section 2 (🟨 Ordre de fabrication): the recipe used for this broche.
  - Section 3 (🟦 Matières premières utilisées): every supplier lot that contributed to the broche.
  - "📄 Exporter dossier traçabilité (PDF)" button visible in the top-right.

## REQ-tracabilite-pdf-export — PDF export of traçabilité dossier

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.7, §9)
- scope: traçabilité
- description: From either Cas 1 or Cas 2 result view, the user can export the dossier as PDF.
- acceptance:
  - Button in top-right of the result view.
  - Implemented with `react-to-print` or `jsPDF`.
  - PDF lists the same information shown on screen. Visual polish is not required; output must simply be generated.

## REQ-dlc-color-coding — DLC badge color codes

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§6)
- scope: cross-cutting UX
- description: Wherever a DLC is shown as a badge, the badge color reflects time-to-DLC.
- acceptance:
  - Green if more than 5 days remain.
  - Orange if 2-5 days remain.
  - Red if less than 2 days remain.
  - Gray if the DLC has already passed.

## REQ-toasts-on-mutations — Toasts on every create/modify action

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§6)
- scope: cross-cutting UX
- description: Every action that creates or modifies data shows a toast.
- acceptance:
  - Implemented via `sonner`.
  - Toast appears for: receive raw material, create production order, create delivery, mark delivery as livrée, create/edit/delete client, reset démo.

## REQ-confirmations-on-critical-actions — Confirmation prompts for critical actions

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§6)
- scope: cross-cutting UX
- description: Critical actions require an explicit confirmation step.
- acceptance:
  - Production order creation requires confirmation (the wizard's step 3 satisfies this).
  - Delivery confirmation ("Marquer comme livrée") requires explicit user click.
  - Démo reset requires a confirm dialog.

## REQ-empty-states — Polished empty states on every table

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§6)
- scope: cross-cutting UX
- description: Every list/table shows a thoughtful empty state instead of an empty grid.
- acceptance:
  - Empty state copy is contextual (example: "Aucune matière première en stock — réceptionnez votre premier lot").
  - Applies to: matières premières, ordres de fabrication, livraisons, clients, traçabilité (no result), dashboard activity feed.

## REQ-no-pagination — No pagination, capped data volume

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§6)
- scope: cross-cutting UX
- description: Tables do not paginate; expected dataset size is 20-30 rows max per table.
- acceptance:
  - No pagination controls anywhere.
  - Tables render the full dataset.

## REQ-success-criteria-demo-flow — End-to-end 5-minute demo flow

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§9)
- scope: end-to-end acceptance
- description: The POC is considered successful only if the following 5-step flow can be executed in under 5 minutes.
- acceptance:
  1. Receive a new raw material lot of viande de bœuf.
  2. Launch a production order that consumes that lot and produces 4 broches.
  3. Deliver 2 of those broches to a kebab restaurant client.
  4. Run a traçabilité search on the original supplier lot number and visually see the full chain: fournisseur → production → client final.
  5. Export the traçabilité dossier as PDF.
