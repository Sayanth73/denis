# Phase 13: Suivi des paiements - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-answered (user delegated all choices)

<domain>
## Phase Boundary

Ajouter le cycle de vie paiement aux factures existantes : 3 statuts (en_attente / payee_livraison / payee_virement), détection visuelle du retard, et une KPI card "Factures impayées" sur le tableau de bord. Pas de notification push ni de relance email — uniquement des signaux visuels dans l'app.

</domain>

<decisions>
## Implementation Decisions

### Type Facture — champ paiement
- **D-01:** Ajouter `paiement: { statut: "en_attente" | "payee_livraison" | "payee_virement"; datePaiement?: string }` à `Facture` dans `lib/types.ts`.
- **D-02:** Les factures existantes en localStorage (v2 du store) recevront `paiement: { statut: "en_attente" }` via la migration v2→v3 dans `lib/store.ts`. Bumper `version` à 3.
- **D-03:** Ajouter `updateFacture(id, patch)` au store (manquant actuellement — seuls `addFacture` / `deleteFacture` existent).

### Marquage paiement — UI
- **D-04:** Boutons uniquement sur le détail `/factures/[id]`, pas depuis la liste. Position : sous le bloc totals footer, dans une section "Paiement".
- **D-05:** Deux boutons distincts : "Payé à la livraison" (variant outline + vert) et "Virement reçu" (variant outline + bleu). Disparaissent une fois la facture payée.
- **D-06:** Pas de confirmation dialog — le marquage paiement n'est pas destructif.
- **D-07:** `datePaiement` = `new Date().toISOString().slice(0, 10)` au moment du clic. Toast : "Facture [N°] marquée comme payée".
- **D-08:** Une fois payée, afficher un badge statut + date de paiement dans la section "Paiement" (pas de boutons).

### Détection retard et tri liste
- **D-09:** Une facture est "en retard" si `statut === "en_attente"` ET `daysSince(dateFacture) > settings.delaiPaiementJours`.
- **D-10:** Helper pur `isFactureEnRetard(facture, settings, today): boolean` dans `lib/factures.ts`.
- **D-11:** Liste `/factures` triée : en retard d'abord, puis en attente, puis payées (tri stable, pas de filtre chips).
- **D-12:** Badge inline "En retard" (orange, même style que badge alerte DLC) dans une nouvelle colonne "Statut paiement" de la liste.

### KPI dashboard
- **D-13:** Remplacer la KpiCard "Livraisons cette semaine" par "Factures impayées".
- **D-14:** Valeur principale = total TTC en attente formaté (ex: "1 245.00 CHF"). Sous-label = "X en retard" en rouge si > 0, sinon "Toutes à jour" en vert.
- **D-15:** `href="/factures"` sur cette KpiCard.
- **D-16:** Nouvelles fonctions dans `lib/dashboard.ts` : `sumFacturesEnAttente(factures): number` et `countFacturesEnRetard(factures, settings, today): number`.

### Délai de paiement paramétrable
- **D-17:** Ajouter `delaiPaiementJours: number` (défaut 30) à `AppSettings` dans `lib/types.ts`.
- **D-18:** Champ numérique dans `/parametres` sous l'IBAN (label : "Délai de paiement (jours)"). Validation : entier positif ≤ 365.
- **D-19:** Migration store v2→v3 initialise `settings.delaiPaiementJours = 30`.

### Claude's Discretion
- Couleurs badges paiement : reprendre les classes shadcn Badge existantes (green-100/green-700 pour payée, orange-100/orange-700 pour retard, zinc pour en_attente).
- Libellés exacts des statuts dans la liste : "En attente", "Payée livraison", "Virement reçu", "En retard".
- Le budget 300 lignes s'applique — si `/factures/[id]` dépasse 300 lignes après les ajouts, extraire la section paiement dans `components/factures/paiement-section.tsx`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Types et store
- `lib/types.ts` — `Facture`, `FactureLigne`, `AppSettings` — étendre avec `paiement` et `delaiPaiementJours`
- `lib/store.ts` — pattern CRUD, migration versionnée — ajouter `updateFacture` + bump version 3
- `lib/factures.ts` — `generateFactureNumber`, `buildQrBillPayload` — ajouter `isFactureEnRetard`

### Pages à modifier
- `app/factures/page.tsx` — liste sans statut paiement → ajouter colonne + tri
- `app/factures/[id]/page.tsx` — détail sans section paiement → ajouter section sous totals
- `app/page.tsx` — dashboard KPI 4 cartes → remplacer card 4
- `app/parametres/page.tsx` — settings IBAN/adresse → ajouter champ délai

### Patterns établis à suivre
- `lib/deliveries.ts` — `STATUT_LIVRAISON_CLASSES` / `STATUT_LIVRAISON_LABELS` — créer équivalent pour paiements dans `lib/factures.ts`
- `lib/dashboard.ts` — fonctions KPI pures — ajouter `sumFacturesEnAttente` / `countFacturesEnRetard`
- `components/dashboard/kpi-card.tsx` — props `label`, `value`, `subLabel`, `alert`, `href`

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/factures.ts` — ajouter `isFactureEnRetard` et les constantes de labels/classes statut paiement ici
- `lib/dashboard.ts` — pattern fonctions pures sans React — ajouter les deux nouvelles fonctions KPI
- `components/dashboard/kpi-card.tsx` — déjà doté de `href`, `alert`, `subLabel` — utilisable tel quel
- `components/empty-state.tsx`, shadcn `Badge` — pour le badge "En retard" inline

### Established Patterns
- Store CRUD: `addX / updateX / deleteX` — `updateFacture(id, patch)` doit suivre ce pattern exact
- Migration versionnée: `if (version === N) { return { ...state, newField: default } }` — reproduire pour v2→v3
- Badges statut: classes inline `cn("inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium", CLASS)` — ne pas utiliser le composant Badge shadcn pour cohérence avec le tableau livraisons
- `partialize` dans store: lister chaque champ d'état explicitement (pas de spread)

### Integration Points
- `lib/types.ts` → `lib/store.ts` → `lib/seed.ts` — chaîne type → store → seed à mettre à jour ensemble
- `app/parametres/page.tsx` + `lib/store.ts settings` — le nouveau champ `delaiPaiementJours` passe par les deux
- `app/page.tsx` subscrit à `deliveries` — après D-13, subscrit aussi à `factures` et `settings`

</code_context>

<specifics>
## Specific Ideas

- Le tri de la liste factures doit placer les "en retard" en premier pour que le gérant voie immédiatement ce qui brûle — c'est la valeur démo.
- Le sous-label de la KPI "Factures impayées" doit être rouge si `countEnRetard > 0` pour créer une urgence visuelle lors de la démo.
- Texte bouton de paiement livraison : "Payé à la livraison" (pas "Cash") — plus professionnel.
- Texte bouton virement : "Virement reçu" — confirme la réception, pas juste l'attente.

</specifics>

<deferred>
## Deferred Ideas

- Relances email automatiques — POC sans backend, hors scope
- Paiement partiel / acompte — complexité comptable, phase ultérieure si intéressé
- Export comptable CSV des factures payées — utile mais pas dans le demo flow actuel

</deferred>

---

*Phase: 13-suivi-paiements*
*Context gathered: 2026-05-05*
