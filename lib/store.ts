/**
 * Store Zustand global TraceKebab — l'unique substrat de données auquel
 * toutes les phases 3-9 souscrivent.
 *
 * Persistance : middleware `persist` → `localStorage` sous la clé
 * `tracekebab-store-v1`. Le drapeau `hasHydrated` (non persisté) bascule à
 * `true` après réhydratation côté client ; `<SeedProvider>` (app/providers.tsx)
 * écoute ce drapeau pour déclencher `seedIfEmpty()` après montage.
 */

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  RawMaterial,
  Recipe,
  ProductionOrder,
  FinishedProduct,
  Customer,
  Delivery,
  Facture,
  AppSettings,
} from "./types";
import { buildSeed } from "./seed";

export const STORAGE_KEY = "tracekebab-store-v1";

type TraceabilityState = {
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  productionOrders: ProductionOrder[];
  finishedProducts: FinishedProduct[];
  customers: Customer[];
  deliveries: Delivery[];
  factures: Facture[];
  settings: AppSettings;
  hasHydrated: boolean;
};

type TraceabilityActions = {
  // Raw materials
  addRawMaterial: (rm: RawMaterial) => void;
  updateRawMaterial: (id: string, patch: Partial<RawMaterial>) => void;
  deleteRawMaterial: (id: string) => void;

  // Recipes
  addRecipe: (r: Recipe) => void;
  updateRecipe: (id: string, patch: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;

  // Production orders
  addProductionOrder: (o: ProductionOrder) => void;
  updateProductionOrder: (id: string, patch: Partial<ProductionOrder>) => void;
  deleteProductionOrder: (id: string) => void;

  // Finished products
  addFinishedProduct: (fp: FinishedProduct) => void;
  updateFinishedProduct: (id: string, patch: Partial<FinishedProduct>) => void;
  deleteFinishedProduct: (id: string) => void;

  // Customers
  addCustomer: (c: Customer) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Deliveries
  addDelivery: (d: Delivery) => void;
  updateDelivery: (id: string, patch: Partial<Delivery>) => void;
  deleteDelivery: (id: string) => void;

  // Factures
  addFacture: (f: Facture) => void;
  deleteFacture: (id: string) => void;
  updateFacture: (id: string, patch: Partial<Facture>) => void;

  // Settings
  updateSettings: (patch: Partial<AppSettings>) => void;

  // Lifecycle
  seedIfEmpty: () => void;
  resetToSeed: () => void;
  setHasHydrated: (v: boolean) => void;
};

export type TraceabilityStore = TraceabilityState & TraceabilityActions;

const DEFAULT_SETTINGS: AppSettings = {
  iban: "",
  nomCreancier: "TraceKebab Sàrl",
  adresseLigne1: "",
  adresseLigne2: "",
  delaiPaiementJours: 30,
};

const initialState: TraceabilityState = {
  rawMaterials: [],
  recipes: [],
  productionOrders: [],
  finishedProducts: [],
  customers: [],
  deliveries: [],
  factures: [],
  settings: DEFAULT_SETTINGS,
  hasHydrated: false,
};

export const useTraceabilityStore = create<TraceabilityStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addRawMaterial: (rm) => set((s) => ({ rawMaterials: [...s.rawMaterials, rm] })),
      updateRawMaterial: (id, patch) =>
        set((s) => ({
          rawMaterials: s.rawMaterials.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteRawMaterial: (id) =>
        set((s) => ({ rawMaterials: s.rawMaterials.filter((x) => x.id !== id) })),

      addRecipe: (r) => set((s) => ({ recipes: [...s.recipes, r] })),
      updateRecipe: (id, patch) =>
        set((s) => ({
          recipes: s.recipes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteRecipe: (id) =>
        set((s) => ({ recipes: s.recipes.filter((x) => x.id !== id) })),

      addProductionOrder: (o) =>
        set((s) => ({ productionOrders: [...s.productionOrders, o] })),
      updateProductionOrder: (id, patch) =>
        set((s) => ({
          productionOrders: s.productionOrders.map((x) =>
            x.id === id ? { ...x, ...patch } : x,
          ),
        })),
      deleteProductionOrder: (id) =>
        set((s) => ({ productionOrders: s.productionOrders.filter((x) => x.id !== id) })),

      addFinishedProduct: (fp) =>
        set((s) => ({ finishedProducts: [...s.finishedProducts, fp] })),
      updateFinishedProduct: (id, patch) =>
        set((s) => ({
          finishedProducts: s.finishedProducts.map((x) =>
            x.id === id ? { ...x, ...patch } : x,
          ),
        })),
      deleteFinishedProduct: (id) =>
        set((s) => ({ finishedProducts: s.finishedProducts.filter((x) => x.id !== id) })),

      addCustomer: (c) => set((s) => ({ customers: [...s.customers, c] })),
      updateCustomer: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteCustomer: (id) =>
        set((s) => ({ customers: s.customers.filter((x) => x.id !== id) })),

      addDelivery: (d) => set((s) => ({ deliveries: [...s.deliveries, d] })),
      updateDelivery: (id, patch) =>
        set((s) => ({
          deliveries: s.deliveries.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteDelivery: (id) =>
        set((s) => ({ deliveries: s.deliveries.filter((x) => x.id !== id) })),

      addFacture: (f) => set((s) => ({ factures: [...s.factures, f] })),
      deleteFacture: (id) =>
        set((s) => ({ factures: s.factures.filter((x) => x.id !== id) })),
      updateFacture: (id, patch) =>
        set((s) => ({
          factures: s.factures.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      seedIfEmpty: () => {
        const s = get();
        if (
          s.rawMaterials.length === 0 &&
          s.recipes.length === 0 &&
          s.customers.length === 0
        ) {
          const seed = buildSeed();
          set({
            rawMaterials: seed.rawMaterials,
            recipes: seed.recipes,
            productionOrders: seed.productionOrders,
            finishedProducts: seed.finishedProducts,
            customers: seed.customers,
            deliveries: seed.deliveries,
            factures: seed.factures,
            // settings conservés tels quels (paramètres entreprise)
          });
        }
      },

      resetToSeed: () => {
        // Vide la copie persistée pour qu'un rechargement complet réamorce proprement.
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
        }
        const seed = buildSeed();
        set({
          rawMaterials: seed.rawMaterials,
          recipes: seed.recipes,
          productionOrders: seed.productionOrders,
          finishedProducts: seed.finishedProducts,
          customers: seed.customers,
          deliveries: seed.deliveries,
          factures: seed.factures,
          settings: DEFAULT_SETTINGS,
        });
      },

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: STORAGE_KEY,
      // Version du schéma persisté ; incrémenter à chaque changement de forme
      // d'un type du domaine pour forcer migrate() à s'exécuter.
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        const state = persistedState as Record<string, unknown>;
        if (version === 1) {
          // v1 → v2 : ajout du champ settings
          return { ...state, settings: DEFAULT_SETTINGS } as TraceabilityStore;
        }
        if (version === 2) {
          // v2 → v3 : ajout du champ paiement aux factures existantes + delaiPaiementJours aux settings
          const factures = Array.isArray(state.factures)
            ? (state.factures as Facture[]).map((f) =>
                f.paiement ? f : { ...f, paiement: { statut: "en_attente" as const } }
              )
            : [];
          const settings = {
            ...(state.settings as AppSettings),
            delaiPaiementJours: 30,
          };
          return { ...state, factures, settings } as TraceabilityStore;
        }
        if (version === 3) {
          return persistedState as TraceabilityStore;
        }
        // Version inconnue → renvoyer undefined pour que persist retombe sur
        // l'état initial vide et que seedIfEmpty() réamorce proprement.
        return undefined;
      },
      // Ne persiste que les données — jamais le drapeau de réhydratation.
      partialize: (state) => ({
        rawMaterials: state.rawMaterials,
        recipes: state.recipes,
        productionOrders: state.productionOrders,
        finishedProducts: state.finishedProducts,
        customers: state.customers,
        deliveries: state.deliveries,
        factures: state.factures,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state, error) => {
        // Déclenché après que les données persistées sont remontées dans le store.
        if (error) {
          // Données persistées corrompues — purger la clé pour que le prochain
          // tick retombe dans seedIfEmpty() avec un état initial propre.
          console.warn(
            "[tracekebab] rehydration failed, clearing corrupt persisted state",
            error,
          );
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(STORAGE_KEY);
          }
          // On bascule quand même le drapeau pour débloquer <SeedProvider>.
          useTraceabilityStore.setState({ hasHydrated: true });
          return;
        }
        state?.setHasHydrated(true);
      },
    },
  ),
);
