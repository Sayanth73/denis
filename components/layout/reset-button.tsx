"use client";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ResetButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toast.info("Disponible en Phase 2")}
      className="gap-2"
    >
      <RotateCcw size={16} aria-hidden="true" />
      <span>Réinitialiser démo</span>
    </Button>
  );
}
