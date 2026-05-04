/**
 * Domain entity types for TraceKebab — verbatim from PRD §3.
 * French field names, union literals, and optional markers are locked.
 */

/** Matière première reçue (lot entrant). */
export type RawMaterial = {
  id: string;
  type: "boeuf" | "agneau" | "poulet" | "epices" | "marinade" | "autre";
  nom: string;
  fournisseur: string;
  numeroLotFournisseur: string;
  quantiteRecue: number;
  quantiteRestante: number;
  dateReception: string; // ISO date
  dlc: string; // ISO date
  temperatureReception: number; // °C
  certificatSanitaire?: string;
};

/** Recette de broche (lecture seule). */
export type Recipe = {
  id: string;
  nom: string;
  poidsTotal: number;
  composition: { typeMatiere: RawMaterial["type"]; pourcentage: number }[];
};

/** Ordre de production consommant des matières premières et produisant des broches. */
export type ProductionOrder = {
  id: string;
  date: string;
  recipeId: string;
  nombreBroches: number;
  matieresPremieresUtilisees: { rawMaterialId: string; quantiteUtilisee: number }[];
  brochesProduites: FinishedProduct[];
};

/** Broche produite (produit fini avec lot interne et DLC). */
export type FinishedProduct = {
  id: string;
  numeroLotInterne: string;
  productionOrderId: string;
  poids: number;
  dateProduction: string;
  dlc: string;
  statut: "en_stock" | "livree";
  livraisonId?: string;
};

/** Client (restaurant kebab destinataire). */
export type Customer = {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
  email?: string;
};

/** Livraison regroupant une ou plusieurs broches vers un client. */
export type Delivery = {
  id: string;
  date: string;
  customerId: string;
  brochesLivrees: string[];
  statut: "preparee" | "livree";
  notes?: string;
};
