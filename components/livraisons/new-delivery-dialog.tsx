"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { DlcBadge } from "@/components/dlc-badge";
import { useTraceabilityStore } from "@/lib/store";
import { getInStockBroches } from "@/lib/deliveries";
import { getRecipeForBroche } from "@/lib/finished-products";
import { buildFacture } from "@/lib/facture-builder";
import type { Delivery } from "@/lib/types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const deliverySchema = z.object({
  customerId: z.string().min(1, "Champ requis"),
  dateLivraison: z.string().min(1, "Champ requis"),
  brochesLivrees: z.array(z.string()).min(1, "Sélectionnez au moins une broche."),
  notes: z.string().max(500, "Maximum 500 caractères.").optional(),
});

type FormValues = z.infer<typeof deliverySchema>;

function freshDefaults(): FormValues {
  return {
    customerId: "",
    dateLivraison: todayIso(),
    brochesLivrees: [],
    notes: "",
  };
}

type NewDeliveryDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
};

export function NewDeliveryDialog({ open, onOpenChange }: NewDeliveryDialogProps) {
  const finishedProducts = useTraceabilityStore((s) => s.finishedProducts);
  const customers = useTraceabilityStore((s) => s.customers);
  const productionOrders = useTraceabilityStore((s) => s.productionOrders);
  const recipes = useTraceabilityStore((s) => s.recipes);

  const inStockBroches = React.useMemo(
    () => getInStockBroches(finishedProducts),
    [finishedProducts],
  );

  const customerNames = React.useMemo(() => customers.map((c) => c.nom), [customers]);

  const form = useForm<FormValues>({
    resolver: zodResolver(deliverySchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: freshDefaults(),
  });

  function handleOpenChange(next: boolean) {
    if (!next) form.reset(freshDefaults());
    onOpenChange(next);
  }

  function onSubmit(values: FormValues) {
    const delivery: Delivery = {
      id: crypto.randomUUID(),
      date: values.dateLivraison,
      customerId: values.customerId,
      brochesLivrees: values.brochesLivrees,
      statut: "preparee",
      notes: values.notes?.trim() || undefined,
    };

    const store = useTraceabilityStore.getState();
    store.addDelivery(delivery);

    const customer = store.customers.find((c) => c.id === delivery.customerId);
    if (!customer) {
      toast.error("Client introuvable — impossible de générer la facture.");
      return;
    }
    // Read factures.length after addDelivery so any concurrent mutation is reflected
    const factureCount = useTraceabilityStore.getState().factures.length;
    const facture = buildFacture(
      delivery.id,
      delivery.customerId,
      values.brochesLivrees,
      finishedProducts,
      productionOrders,
      recipes,
      customer,
      factureCount,
    );
    store.addFacture(facture);

    toast.success(`Livraison préparée — Facture ${facture.numeroFacture} générée`);
    form.reset(freshDefaults());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="mx-4 w-[calc(100%-2rem)] sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle livraison</DialogTitle>
          <DialogDescription>
            Sélectionnez les broches à livrer et confirmez.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Client */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => {
                const selectedName = customers.find((c) => c.id === field.value)?.nom ?? "";
                return (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <FormControl>
                      <Combobox
                        value={selectedName}
                        onChange={(name) => {
                          const found = customers.find((c) => c.nom === name);
                          field.onChange(found?.id ?? "");
                        }}
                        options={customerNames}
                        placeholder="Rechercher un client..."
                        searchPlaceholder="Rechercher..."
                        emptyMessage="Aucun client."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Date de livraison */}
            <FormField
              control={form.control}
              name="dateLivraison"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de livraison *</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value || undefined}
                      onChange={(iso) => field.onChange(iso ?? "")}
                      disabled={(d) => {
                        const max = new Date();
                        max.setDate(max.getDate() + 30);
                        return d > max;
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Broches en stock */}
            <FormField
              control={form.control}
              name="brochesLivrees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Broches en stock *</FormLabel>
                  <FormControl>
                    <div className="rounded-md border border-input bg-background">
                      <ScrollArea className="max-h-[200px]">
                        {inStockBroches.length === 0 ? (
                          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                            Aucune broche en stock.
                          </p>
                        ) : (
                          inStockBroches.map((fp, idx) => {
                            const checked = field.value.includes(fp.id);
                            const recipe = getRecipeForBroche(fp, productionOrders, recipes);
                            return (
                              <div
                                key={fp.id}
                                className={`flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 cursor-pointer${idx < inStockBroches.length - 1 ? " border-b border-border" : ""}`}
                                onClick={() => {
                                  const next = checked
                                    ? field.value.filter((id) => id !== fp.id)
                                    : [...field.value, fp.id];
                                  field.onChange(next);
                                }}
                              >
                                <Checkbox
                                  id={fp.id}
                                  checked={checked}
                                  onCheckedChange={(c) => {
                                    const next = c
                                      ? [...field.value, fp.id]
                                      : field.value.filter((id) => id !== fp.id);
                                    field.onChange(next);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <label
                                  htmlFor={fp.id}
                                  className="flex-1 flex items-center gap-3 cursor-pointer"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <span className="font-mono text-sm">
                                    {fp.numeroLotInterne}
                                  </span>
                                  {recipe && (
                                    <span className="text-sm text-muted-foreground">
                                      {recipe.nom}
                                    </span>
                                  )}
                                  <span className="text-sm text-muted-foreground tabular-nums">
                                    {fp.poids} kg
                                  </span>
                                  <DlcBadge value={fp.dlc} />
                                </label>
                              </div>
                            );
                          })
                        )}
                      </ScrollArea>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Remarques sur cette livraison..."
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Préparer la livraison</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
