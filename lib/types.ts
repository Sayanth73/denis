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
  prixParDefautHT: number; // CHF/kg, default 25
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
  tarifs: { recetteId: string; prixHT: number }[]; // per-recipe price overrides
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

/** Ligne de facture correspondant à une broche livrée. */
export type FactureLigne = {
  brocheId: string;
  numeroLot: string;
  recetteNom: string;
  poidsKg: number;
  prixUnitaireHT: number;
  montantHT: number;
};

/** Facture auto-générée lors de la confirmation d'une livraison. */
export type Facture = {
  id: string;
  numeroFacture: string;
  livraisonId: string;
  clientId: string;
  dateFacture: string;
  lignes: FactureLigne[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  paiement: {
    statut: "en_attente" | "payee_livraison" | "payee_virement";
    datePaiement?: string; // YYYY-MM-DD, set at moment of marking
  };
};

/** Paramètres de l'entreprise (IBAN, créancier QR-bill). */
export type AppSettings = {
  iban: string;
  nomCreancier: string;
  adresseLigne1: string;
  adresseLigne2: string;
  delaiPaiementJours: number; // default 30
};
