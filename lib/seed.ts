/**
 * Données de démonstration TraceKebab (PRD §4).
 *
 * `buildSeed(now?)` produit un jeu de données déterministe (mais avec UUIDs
 * frais à chaque appel) ancré sur `now` pour que les DLCs / dates de réception
 * soient toujours réalistes par rapport à la date courante.
 *
 * Couvre : 5 matières premières / 3 recettes / 8 clients Suisse-romands /
 *          2 ordres de production antérieurs / 6 broches / 1 livraison.
 */

import type {
  RawMaterial,
  Recipe,
  ProductionOrder,
  FinishedProduct,
  Customer,
  Delivery,
  Facture,
} from "./types";
import { computeBrocheDlc } from "./dlc";
import { generateLotNumber } from "./lot-number";

export type SeedData = {
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  productionOrders: ProductionOrder[];
  finishedProducts: FinishedProduct[];
  customers: Customer[];
  deliveries: Delivery[];
  factures: Facture[];
};

export function buildSeed(now: Date = new Date()): SeedData {
  // Ancre tout au midi UTC du jour courant pour des dates ISO stables.
  const today = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);

  const daysAgo = (n: number): string => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const daysFromNow = (n: number): string => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };

  // -------- Raw materials (5 / 3 fournisseurs) --------
  const rmEpauleId = crypto.randomUUID();
  const rmHacheId = crypto.randomUUID();
  const rmGigotId = crypto.randomUUID();
  const rmPouletId = crypto.randomUUID();
  const rmEpicesId = crypto.randomUUID();

  const rawMaterials: RawMaterial[] = [
    {
      id: rmEpauleId,
      type: "boeuf",
      nom: "Épaule de bœuf désossée",
      fournisseur: "Boucherie Müller SA",
      numeroLotFournisseur: "BM-2026-0471",
      quantiteRecue: 80,
      quantiteRestante: 35, // 80 - 45 (consommée par ordre 1)
      dateReception: daysAgo(6),
      dlc: daysFromNow(8),
      temperatureReception: 2,
      certificatSanitaire: "CH-OSAV-2026-114",
    },
    {
      id: rmHacheId,
      type: "boeuf",
      nom: "Bœuf haché 15% MG",
      fournisseur: "Boucherie Müller SA",
      numeroLotFournisseur: "BM-2026-0489",
      quantiteRecue: 50,
      quantiteRestante: 50,
      dateReception: daysAgo(2),
      dlc: daysFromNow(4),
      temperatureReception: 3,
      certificatSanitaire: "CH-OSAV-2026-122",
    },
    {
      id: rmGigotId,
      type: "agneau",
      nom: "Gigot d'agneau désossé",
      fournisseur: "Élevage Romand",
      numeroLotFournisseur: "ER-26-0312",
      quantiteRecue: 40,
      quantiteRestante: 22, // 40 - 18 (consommée par ordre 1)
      dateReception: daysAgo(5),
      dlc: daysFromNow(9),
      temperatureReception: 2,
      certificatSanitaire: "CH-OSAV-2026-118",
    },
    {
      id: rmPouletId,
      type: "poulet",
      nom: "Cuisses de poulet désossées",
      fournisseur: "Élevage Romand",
      numeroLotFournisseur: "ER-26-0319",
      quantiteRecue: 60,
      quantiteRestante: 28, // 60 - 32 (consommée par ordre 2)
      dateReception: daysAgo(1),
      dlc: daysFromNow(6),
      temperatureReception: 2,
    },
    {
      id: rmEpicesId,
      type: "epices",
      nom: "Mélange épices kebab maison",
      fournisseur: "Épicerie Dubois Lausanne",
      numeroLotFournisseur: "EDL-26-077",
      quantiteRecue: 12,
      quantiteRestante: 8, // 12 - 4 (consommée par ordre 1)
      dateReception: daysAgo(7),
      dlc: daysFromNow(150),
      temperatureReception: 18,
    },
  ];

  // -------- Recipes (3, lecture seule) --------
  const recipes: Recipe[] = [
    {
      id: crypto.randomUUID(),
      nom: "Broche standard 25 kg",
      poidsTotal: 25,
      composition: [
        { typeMatiere: "boeuf", pourcentage: 60 },
        { typeMatiere: "agneau", pourcentage: 30 },
        { typeMatiere: "epices", pourcentage: 10 },
      ],
    },
    {
      id: crypto.randomUUID(),
      nom: "Broche poulet 20 kg",
      poidsTotal: 20,
      composition: [
        { typeMatiere: "poulet", pourcentage: 80 },
        { typeMatiere: "marinade", pourcentage: 15 },
        { typeMatiere: "epices", pourcentage: 5 },
      ],
    },
    {
      id: crypto.randomUUID(),
      nom: "Broche premium agneau 15 kg",
      poidsTotal: 15,
      composition: [
        { typeMatiere: "agneau", pourcentage: 85 },
        { typeMatiere: "marinade", pourcentage: 10 },
        { typeMatiere: "epices", pourcentage: 5 },
      ],
    },
  ];

  // -------- Customers (8 Suisse romande) --------
  const customerKebabRoyalId = crypto.randomUUID();
  const customers: Customer[] = [
    { id: customerKebabRoyalId, nom: "Kebab Royal Lausanne", adresse: "Rue de Bourg 14, 1003 Lausanne", telephone: "+41 21 312 44 18", email: "contact@kebabroyal-lausanne.ch" },
    { id: crypto.randomUUID(), nom: "Snack Istanbul Yverdon", adresse: "Rue du Lac 22, 1400 Yverdon-les-Bains", telephone: "+41 24 425 18 92" },
    { id: crypto.randomUUID(), nom: "Anatolia Grill Genève", adresse: "Rue de Carouge 87, 1205 Genève", telephone: "+41 22 320 71 04", email: "bonjour@anatolia-grill.ch" },
    { id: crypto.randomUUID(), nom: "Le Bosphore Fribourg", adresse: "Boulevard de Pérolles 31, 1700 Fribourg", telephone: "+41 26 322 65 40" },
    { id: crypto.randomUUID(), nom: "Kebab du Centre Yverdon", adresse: "Place Pestalozzi 5, 1400 Yverdon-les-Bains", telephone: "+41 24 426 09 73", email: "centre@kebabyverdon.ch" },
    { id: crypto.randomUUID(), nom: "Mésopotamia Sion", adresse: "Avenue de la Gare 18, 1950 Sion", telephone: "+41 27 322 88 51", email: "mesopotamia.sion@gmail.com" },
    { id: crypto.randomUUID(), nom: "Istanbul Express Vevey", adresse: "Rue du Simplon 12, 1800 Vevey", telephone: "+41 21 921 47 36" },
    { id: crypto.randomUUID(), nom: "Le Petit Sultan Neuchâtel", adresse: "Rue du Seyon 24, 2000 Neuchâtel", telephone: "+41 32 724 19 88", email: "sultan@petitsultan.ch" },
  ];

  // -------- Production orders (2) + broches (4 + 2) --------
  // Ordre 1 — broche standard 25 kg, 4 broches, il y a 3 jours.
  const order1Id = crypto.randomUUID();
  const order1Date = daysAgo(3);
  const order1ProductionDate = new Date(`${order1Date}T00:00:00.000Z`);
  const order1Dlc = computeBrocheDlc(order1Date);
  const order1Broches: FinishedProduct[] = [1, 2, 3, 4].map((seq) => ({
    id: crypto.randomUUID(),
    numeroLotInterne: generateLotNumber(order1ProductionDate, seq),
    productionOrderId: order1Id,
    poids: 25,
    dateProduction: order1Date,
    dlc: order1Dlc,
    statut: "en_stock", // 3 seront patchées en "livree" plus bas
  }));

  const order1: ProductionOrder = {
    id: order1Id,
    date: order1Date,
    recipeId: recipes[0].id,
    nombreBroches: 4,
    matieresPremieresUtilisees: [
      { rawMaterialId: rmEpauleId, quantiteUtilisee: 45 },
      { rawMaterialId: rmGigotId, quantiteUtilisee: 18 },
      { rawMaterialId: rmEpicesId, quantiteUtilisee: 4 },
    ],
    brochesProduites: order1Broches,
  };

  // Ordre 2 — broche poulet 20 kg, 2 broches, il y a 1 jour.
  const order2Id = crypto.randomUUID();
  const order2Date = daysAgo(1);
  const order2ProductionDate = new Date(`${order2Date}T00:00:00.000Z`);
  const order2Dlc = computeBrocheDlc(order2Date);
  const order2Broches: FinishedProduct[] = [1, 2].map((seq) => ({
    id: crypto.randomUUID(),
    numeroLotInterne: generateLotNumber(order2ProductionDate, seq),
    productionOrderId: order2Id,
    poids: 20,
    dateProduction: order2Date,
    dlc: order2Dlc,
    statut: "en_stock",
  }));

  const order2: ProductionOrder = {
    id: order2Id,
    date: order2Date,
    recipeId: recipes[1].id,
    nombreBroches: 2,
    matieresPremieresUtilisees: [
      { rawMaterialId: rmPouletId, quantiteUtilisee: 32 },
    ],
    brochesProduites: order2Broches,
  };

  const productionOrders: ProductionOrder[] = [order1, order2];

  // -------- Delivery (1) — Kebab Royal Lausanne, 3 broches d'ordre 1 --------
  const deliveryId = crypto.randomUUID();
  const deliveredBrocheIds = [
    order1Broches[0].id,
    order1Broches[1].id,
    order1Broches[2].id,
  ];

  // Back-patch les broches livrées : statut + livraisonId.
  for (let i = 0; i < 3; i++) {
    order1Broches[i].statut = "livree";
    order1Broches[i].livraisonId = deliveryId;
  }

  const deliveries: Delivery[] = [
    {
      id: deliveryId,
      date: daysAgo(2),
      customerId: customerKebabRoyalId,
      brochesLivrees: deliveredBrocheIds,
      statut: "livree",
      notes: "Livraison régulière — porte arrière, 06h30.",
    },
  ];

  // Tableau plat des produits finis : 4 broches d'ordre 1 + 2 d'ordre 2.
  const finishedProducts: FinishedProduct[] = [...order1Broches, ...order2Broches];

  return {
    rawMaterials,
    recipes,
    productionOrders,
    finishedProducts,
    customers,
    deliveries,
    factures: [] as Facture[],
  };
}
