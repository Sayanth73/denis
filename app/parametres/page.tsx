"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTraceabilityStore } from "@/lib/store";

const settingsSchema = z.object({
  iban: z.string().max(34, "IBAN trop long").optional().or(z.literal("")),
  nomCreancier: z.string().max(70, "Maximum 70 caractères"),
  adresseLigne1: z.string().max(70, "Maximum 70 caractères").optional().or(z.literal("")),
  adresseLigne2: z.string().max(70, "Maximum 70 caractères (NPA + ville)").optional().or(z.literal("")),
  delaiPaiementJours: z.number()
    .int("Doit être un entier")
    .min(1, "Minimum 1 jour")
    .max(365, "Maximum 365 jours"),
});

type FormValues = {
  iban?: string;
  nomCreancier: string;
  adresseLigne1?: string;
  adresseLigne2?: string;
  delaiPaiementJours: number;
};

export default function ParametresPage() {
  const settings = useTraceabilityStore((s) => s.settings);
  const updateSettings = useTraceabilityStore((s) => s.updateSettings);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

  const form = useForm<FormValues>({
    resolver: zodResolver(settingsSchema),
    mode: "onBlur",
    values: {
      iban: settings.iban,
      nomCreancier: settings.nomCreancier,
      adresseLigne1: settings.adresseLigne1,
      adresseLigne2: settings.adresseLigne2,
      delaiPaiementJours: settings.delaiPaiementJours,
    },
  });

  function onSubmit(values: FormValues) {
    updateSettings({
      iban: values.iban ?? "",
      nomCreancier: values.nomCreancier,
      adresseLigne1: values.adresseLigne1 ?? "",
      adresseLigne2: values.adresseLigne2 ?? "",
      delaiPaiementJours: values.delaiPaiementJours,
    });
    toast.success("Paramètres enregistrés");
  }

  if (!hasHydrated) return <div className="h-9" />;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-base font-semibold">Paramètres de l&apos;entreprise</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ces informations apparaissent sur les factures et dans le QR-bill de paiement.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          <FormField
            control={form.control}
            name="nomCreancier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de l&apos;entreprise *</FormLabel>
                <FormControl>
                  <Input placeholder="TraceKebab Sàrl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="iban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IBAN</FormLabel>
                <FormControl>
                  <Input
                    placeholder="CH56 0483 5012 3456 7800 9"
                    className="font-mono"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Utilisé pour générer le QR-bill sur chaque facture.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="delaiPaiementJours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Délai de paiement (jours)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    placeholder="30"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      field.onChange(isNaN(val) ? 0 : val);
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormDescription>
                  Nombre de jours après la date de facture avant qu&apos;elle soit considérée en retard.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="adresseLigne1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rue et numéro</FormLabel>
                <FormControl>
                  <Input placeholder="Route de la Viande 12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="adresseLigne2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NPA et ville</FormLabel>
                <FormControl>
                  <Input placeholder="1234 Lausanne" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Enregistrer</Button>
        </form>
      </Form>
    </div>
  );
}
