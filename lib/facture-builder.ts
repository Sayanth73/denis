import { getRecipeForBroche } from "@/lib/finished-products";
import { generateFactureNumber } from "@/lib/factures";
import type { FinishedProduct, ProductionOrder, Recipe, Facture, FactureLigne } from "@/lib/types";

const PRIX_KG_HT = 25;
const TVA = 0.081;

export function buildFacture(
  deliveryId: string,
  clientId: string,
  brocheIds: string[],
  finishedProducts: FinishedProduct[],
  productionOrders: ProductionOrder[],
  recipes: Recipe[],
  factureCount: number,
): Facture {
  const today = new Date().toISOString().slice(0, 10);
  const lignes: FactureLigne[] = brocheIds.map((fpId) => {
    const fp = finishedProducts.find((p) => p.id === fpId);
    const recipe = fp ? getRecipeForBroche(fp, productionOrders, recipes) : null;
    const poidsKg = fp?.poids ?? 0;
    return {
      brocheId: fpId,
      numeroLot: fp?.numeroLotInterne ?? "",
      recetteNom: recipe?.nom ?? "—",
      poidsKg,
      prixUnitaireHT: PRIX_KG_HT,
      montantHT: poidsKg * PRIX_KG_HT,
    };
  });
  const totalHT = lignes.reduce((sum, l) => sum + l.montantHT, 0);
  return {
    id: crypto.randomUUID(),
    numeroFacture: generateFactureNumber(today, factureCount + 1),
    livraisonId: deliveryId,
    clientId,
    dateFacture: today,
    lignes,
    totalHT,
    tva: TVA,
    totalTTC: totalHT * (1 + TVA),
    paiement: { statut: "en_attente" as const },
  };
}
