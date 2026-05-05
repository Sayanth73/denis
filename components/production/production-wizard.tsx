"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AllocationStep } from "@/components/production/allocation-step";
import { useTraceabilityStore } from "@/lib/store";
import { generateLotNumber } from "@/lib/lot-number";
import { computeBrocheDlc } from "@/lib/dlc";
import { buildFifoDefaults, computeRequiredQty, computeShortfall, getEligibleLots, todayIso } from "@/lib/production";
import { formatDate, TYPE_LABELS } from "@/lib/raw-materials";
import type { FinishedProduct, ProductionOrder } from "@/lib/types";

const step1Schema = z.object({
  recipeId: z.string().min(1, "Sélectionnez une recette"),
  nombreBroches: z
    .string()
    .min(1, "Champ requis")
    .refine((v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n >= 1; },
      "Le nombre de broches doit être d'au moins 1"),
});

type Step1Values = z.infer<typeof step1Schema>;
type AllocationsByIngredient = Record<string, Record<string, number>>;
type ProductionWizardProps = { open: boolean; onOpenChange: (next: boolean) => void };

export function ProductionWizard({ open, onOpenChange }: ProductionWizardProps) {
  const router = useRouter();
  const recipes = useTraceabilityStore((s) => s.recipes);
  const rawMaterials = useTraceabilityStore((s) => s.rawMaterials);
  const finishedProducts = useTraceabilityStore((s) => s.finishedProducts);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [allocations, setAllocations] = React.useState<AllocationsByIngredient>({});
  const [allocationErrors, setAllocationErrors] = React.useState<Record<string, string>>({});

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { recipeId: "", nombreBroches: "1" },
  });

  const recipeId = form.watch("recipeId");
  const nombreBrochesStr = form.watch("nombreBroches");
  const nombreBroches = parseInt(nombreBrochesStr, 10) || 1;
  const selectedRecipe = recipes.find((r) => r.id === recipeId);

  React.useEffect(() => {
    if (!selectedRecipe || !Number.isInteger(nombreBroches) || nombreBroches < 1) return;
    const today = todayIso();
    const defaults: AllocationsByIngredient = {};
    for (const ing of selectedRecipe.composition) {
      const required = computeRequiredQty(ing, selectedRecipe, nombreBroches);
      const eligible = getEligibleLots(rawMaterials, ing.typeMatiere, today);
      defaults[ing.typeMatiere] = buildFifoDefaults(eligible, required);
    }
    setAllocations(defaults);
  }, [recipeId, nombreBroches, rawMaterials, selectedRecipe]);

  function handleStep1Next(values: Step1Values) { void values; setStep(2); }

  function handleStep2Next() {
    if (!selectedRecipe) return;
    const errors: Record<string, string> = {};
    for (const ing of selectedRecipe.composition) {
      const required = computeRequiredQty(ing, selectedRecipe, nombreBroches);
      const shortfall = computeShortfall(allocations[ing.typeMatiere] ?? {}, required);
      if (shortfall > 0) errors[ing.typeMatiere] = `Quantité insuffisante — allouez ${shortfall.toFixed(2)} kg supplémentaires.`;
    }
    if (Object.keys(errors).length > 0) { setAllocationErrors(errors); return; }
    setAllocationErrors({});
    setStep(3);
  }

  function handleConfirm() {
    if (!selectedRecipe) return;
    const store = useTraceabilityStore.getState();
    const today = todayIso();
    const dlcBroche = computeBrocheDlc(today);
    const matieresPremieresUtilisees: { rawMaterialId: string; quantiteUtilisee: number }[] = [];
    for (const ingAllocations of Object.values(allocations)) {
      for (const [rmId, qty] of Object.entries(ingAllocations)) {
        if (qty > 0) matieresPremieresUtilisees.push({ rawMaterialId: rmId, quantiteUtilisee: qty });
      }
    }
    const existingTodayCount = finishedProducts.filter((fp) => fp.dateProduction === today).length;
    const orderId = crypto.randomUUID();
    const brochesProduites: FinishedProduct[] = [];
    for (let i = 0; i < nombreBroches; i++) {
      brochesProduites.push({
        id: crypto.randomUUID(),
        numeroLotInterne: generateLotNumber(new Date(), existingTodayCount + i + 1),
        productionOrderId: orderId,
        poids: selectedRecipe.poidsTotal,
        dateProduction: today,
        dlc: dlcBroche,
        statut: "en_stock",
      });
    }
    const order: ProductionOrder = { id: orderId, date: today, recipeId: selectedRecipe.id, nombreBroches, matieresPremieresUtilisees, brochesProduites };
    for (const { rawMaterialId, quantiteUtilisee } of matieresPremieresUtilisees) {
      const rm = store.rawMaterials.find((r) => r.id === rawMaterialId);
      if (rm) store.updateRawMaterial(rawMaterialId, { quantiteRestante: Math.round((rm.quantiteRestante - quantiteUtilisee) * 100) / 100 });
    }
    store.addProductionOrder(order);
    for (const fp of brochesProduites) store.addFinishedProduct(fp);
    const firstBrocheLot = brochesProduites[0]?.numeroLotInterne ?? "";
    toast.success(`Production confirmée — ${nombreBroches} broches (${selectedRecipe.nom})`, {
      ...(firstBrocheLot
        ? {
            action: {
              label: "Voir la traçabilité",
              onClick: () => router.push(`/tracabilite?lot=${firstBrocheLot}`),
            },
          }
        : {}),
    });
    handleClose();
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => { setStep(1); setAllocations({}); setAllocationErrors({}); form.reset({ recipeId: "", nombreBroches: "1" }); }, 200);
  }

  const stepTitles: Record<1 | 2 | 3, string> = {
    1: "Étape 1 sur 3 — Choisir la recette",
    2: "Étape 2 sur 3 — Allouer les matières premières",
    3: "Étape 3 sur 3 — Récapitulatif",
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <DialogContent className="mx-4 w-[calc(100%-2rem)] sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel ordre de fabrication</DialogTitle>
          <DialogDescription>{stepTitles[step]}</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleStep1Next)} id="step1-form" className="space-y-4">
              <FormField control={form.control} name="recipeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recette *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Sélectionnez une recette" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recipes.map((r) => <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nombreBroches" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de broches *</FormLabel>
                  <FormControl><Input type="number" min="1" step="1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </form>
          </Form>
        )}

        {step === 2 && selectedRecipe && (
          <AllocationStep
            recipe={selectedRecipe}
            nombreBroches={nombreBroches}
            rawMaterials={rawMaterials}
            allocations={allocations}
            onChange={setAllocations}
            errors={allocationErrors}
          />
        )}

        {step === 3 && selectedRecipe && (
          <div className="min-w-0">
            <div className="space-y-1 mb-4">
              {[
                { label: "Recette", value: selectedRecipe.nom },
                { label: "Broches", value: String(nombreBroches) },
                { label: "Date", value: formatDate(todayIso()) },
                { label: "DLC", value: formatDate(computeBrocheDlc(todayIso())), suffix: "(production + 5 jours)" },
              ].map(({ label, value, suffix }) => (
                <div key={label} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
                  <span className="text-sm text-foreground">
                    {value}
                    {suffix ? <span className="text-xs text-muted-foreground ml-2">{suffix}</span> : null}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-foreground mt-4 mb-2">Matières premières consommées</p>
            <div className="border-t border-border mb-3" />
            <div className="space-y-1">
              {Object.entries(allocations).flatMap(([typeMatiere, lotAllocs]) =>
                Object.entries(lotAllocs).filter(([, qty]) => qty > 0).map(([rmId, qty]) => {
                  const rm = rawMaterials.find((r) => r.id === rmId);
                  return (
                    <div key={rmId} className="flex items-center gap-3 text-sm py-1">
                      <span className="text-muted-foreground w-16 shrink-0">
                        {TYPE_LABELS[typeMatiere as keyof typeof TYPE_LABELS] ?? typeMatiere}
                      </span>
                      <span className="font-mono text-foreground">{rm?.numeroLotFournisseur ?? rmId}</span>
                      <span className="tabular-nums text-muted-foreground ml-auto">{qty.toFixed(2)} kg</span>
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
              ← Retour
            </Button>
          )}
          {step === 1 && <Button type="button" variant="outline" onClick={handleClose}>Annuler</Button>}
          {step === 1 && <Button type="submit" form="step1-form">Suivant →</Button>}
          {step === 2 && <Button type="button" onClick={handleStep2Next}>Suivant →</Button>}
          {step === 3 && <Button type="button" onClick={handleConfirm}>Confirmer la production</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
