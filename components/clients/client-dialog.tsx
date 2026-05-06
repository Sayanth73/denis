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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTraceabilityStore } from "@/lib/store";
import type { Customer } from "@/lib/types";

const clientSchema = z.object({
  nom:       z.string().min(2, "Minimum 2 caractères."),
  adresse:   z.string().min(5, "Minimum 5 caractères."),
  telephone: z.string().min(1, "Champ requis"),
  email:     z.string().email("Email invalide.").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof clientSchema>;

type ClientDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  mode: "create" | "edit";
  client?: Customer;
};

export function ClientDialog({
  open,
  onOpenChange,
  mode,
  client,
}: ClientDialogProps): JSX.Element {
  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { nom: "", adresse: "", telephone: "", email: "" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset(
        mode === "edit" && client
          ? {
              nom: client.nom,
              adresse: client.adresse,
              telephone: client.telephone,
              email: client.email ?? "",
            }
          : { nom: "", adresse: "", telephone: "", email: "" },
      );
    }
  }, [open, mode, client, form]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset({ nom: "", adresse: "", telephone: "", email: "" });
    }
    onOpenChange(next);
  }

  function onSubmit(values: FormValues) {
    const store = useTraceabilityStore.getState();

    if (mode === "create") {
      const c: Customer = {
        id: crypto.randomUUID(),
        nom: values.nom.trim(),
        adresse: values.adresse.trim(),
        telephone: values.telephone.trim(),
        email: values.email?.trim() || undefined,
        tarifs: [],
      };
      store.addCustomer(c);
      toast.success("Client ajouté — " + values.nom.trim());
    } else {
      const patch = {
        nom: values.nom.trim(),
        adresse: values.adresse.trim(),
        telephone: values.telephone.trim(),
        email: values.email?.trim() || undefined,
      };
      store.updateCustomer(client!.id, patch);
      toast.success("Client mis à jour — " + values.nom.trim());
    }

    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nouveau client" : "Modifier le client"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Renseignez les informations du client."
              : "Mettez à jour les informations du client."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nom du client"
                      maxLength={120}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adresse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Adresse complète"
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+41 XX XXX XX XX"
                      maxLength={30}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@exemple.ch"
                      maxLength={120}
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
              <Button type="submit" variant="default">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
