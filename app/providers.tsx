"use client";

import { useEffect } from "react";
import { useTraceabilityStore } from "@/lib/store";

/**
 * Lifecycle de seed au plus haut niveau. Monté une seule fois dans
 * `app/layout.tsx` autour de `{children}`.
 *
 * Stratégie :
 *   1. Souscrit à `hasHydrated` (basculé à `true` par `onRehydrateStorage`
 *      du middleware persist).
 *   2. Une fois `true`, déclenche `seedIfEmpty()` — idempotent, ne remplit
 *      les tableaux que s'ils sont tous vides.
 *   3. Le rendu n'est jamais bloqué : les enfants se rendent sur tableaux
 *      vides pendant le SSR + la brève fenêtre d'hydratation, puis se
 *      re-rendent avec les données seed au tick suivant.
 */
export function SeedProvider({ children }: { children: React.ReactNode }) {
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);
  const seedIfEmpty = useTraceabilityStore((s) => s.seedIfEmpty);

  useEffect(() => {
    if (hasHydrated) {
      seedIfEmpty();
    }
  }, [hasHydrated, seedIfEmpty]);

  return <>{children}</>;
}
