"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { useTraceabilityStore } from "@/lib/store";
import { TYPE_LABELS, getSupplierOptions } from "@/lib/raw-materials";
import type { RawMaterial } from "@/lib/types";

type ReceptionDialogProps = { open: boolean; onOpenChange: (next: boolean) => void };

const TYPE_KEYS = ["boeuf", "agneau", "poulet", "epices", "marinade", "autre"] as const;

function todayIso(): string { return new Date().toISOString().slice(0, 10); }

// All fields are strings at the form level (HTML input values are always strings).
// Numbers are parsed in onSubmit after zod validation to avoid Zod-v4 / hookform
// resolver type-parameter conflicts with z.coerce / z.transform outputs.
const schema = z
  .object({
    type: z.enum(TYPE_KEYS, { error: "Sélectionnez un type" }),
    nom: z.string().min(1, "Champ requis").min(3, "Le nom doit contenir au moins 3 caractères"),
    fournisseur: z.string().trim().min(1, "Champ requis"),
    numeroLotFournisseur: z.string().trim().min(1, "Champ requis"),
    // Stored as string; validated as a number after coercion
    quantiteRecue: z
      .string()
      .min(1, "Champ requis")
      .refine((v) => !Number.isNaN(parseFloat(v)), "Champ requis")
      .refine((v) => parseFloat(v) > 0, "La quantité doit être supérieure à zéro"),
    dateReception: z
      .string()
      .min(1, "Champ requis")
      .refine((iso) => iso <= todayIso(), {
        message: "La date de réception ne peut pas être dans le futur",
      }),
    dlc: z.string().min(1, "Champ requis"),
    temperatureReception: z
      .string()
      .min(1, "Champ requis")
      .refine((v) => !Number.isNaN(parseFloat(v)), "Champ requis"),
    certificatSanitaire: z.string().optional(),
  })
  .refine((v) => v.dlc > v.dateReception, {
    path: ["dlc"],
    message: "La DLC doit être postérieure à la date de réception.",
  });

type FormValues = z.infer<typeof schema>;

function freshDefaults(): FormValues {
  return {
    nom: "", fournisseur: "", numeroLotFournisseur: "",
    quantiteRecue: "",
    dateReception: todayIso(), dlc: "",
    temperatureReception: "",
    certificatSanitaire: "",
    type: undefined as unknown as FormValues["type"],
  };
}

export function ReceptionDialog({ open, onOpenChange }: ReceptionDialogProps) {
  const rawMaterials = useTraceabilityStore((s) => s.rawMaterials);
  const supplierOptions = React.useMemo(() => getSupplierOptions(rawMaterials), [rawMaterials]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: freshDefaults(),
  });

  const dateReceptionValue = form.watch("dateReception");

  function resetForm() { form.reset(freshDefaults()); }
  function handleOpenChange(next: boolean) { if (!next) resetForm(); onOpenChange(next); }

  function onSubmit(values: FormValues) {
    const newRm: RawMaterial = {
      id: crypto.randomUUID(),
      type: values.type,
      nom: values.nom.trim(),
      fournisseur: values.fournisseur.trim(),
      numeroLotFournisseur: values.numeroLotFournisseur.trim(),
      quantiteRecue: parseFloat(values.quantiteRecue),
      quantiteRestante: parseFloat(values.quantiteRecue),
      dateReception: values.dateReception,
      dlc: values.dlc,
      temperatureReception: parseFloat(values.temperatureReception),
      certificatSanitaire: values.certificatSanitaire?.trim() || undefined,
    };
    useTraceabilityStore.getState().addRawMaterial(newRm);
    toast.success(`Lot réceptionné — ${newRm.nom} (${newRm.fournisseur})`);
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Réceptionner un lot</DialogTitle>
          <DialogDescription>Renseignez les informations du lot reçu.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez un type" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TYPE_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{TYPE_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="nom" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl><Input placeholder="ex. Épaule de bœuf désossée" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="fournisseur" render={({ field }) => (
              <FormItem>
                <FormLabel>Fournisseur *</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value} onChange={field.onChange} options={supplierOptions}
                    placeholder="Sélectionnez ou saisissez un fournisseur"
                    searchPlaceholder="Rechercher un fournisseur..."
                    emptyMessage="Aucun fournisseur — la valeur saisie sera enregistrée comme nouveau fournisseur."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="numeroLotFournisseur" render={({ field }) => (
              <FormItem>
                <FormLabel>N° lot fournisseur *</FormLabel>
                <FormControl>
                  <Input placeholder="ex. BM-2026-0471" className="font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="quantiteRecue" render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité reçue (kg) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="dateReception" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de réception *</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(iso) => field.onChange(iso ?? "")}
                      disabled={(d) => d > new Date()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="dlc" render={({ field }) => (
                <FormItem>
                  <FormLabel>DLC *</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(iso) => field.onChange(iso ?? "")}
                      disabled={(d) => {
                        if (!dateReceptionValue) return false;
                        const recep = new Date(`${dateReceptionValue}T00:00:00.000Z`);
                        return d.getTime() <= recep.getTime();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="temperatureReception" render={({ field }) => (
              <FormItem>
                <FormLabel>Température de réception (°C) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="certificatSanitaire" render={({ field }) => (
              <FormItem>
                <FormLabel>Certificat sanitaire</FormLabel>
                <FormControl><Input placeholder="ex. CS-2026-0471" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">Réceptionner le lot</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
