"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: string | undefined; // ISO YYYY-MM-DD
  onChange: (iso: string | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
};

function isoToDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function dateToIso(d: Date): string {
  // Always emit UTC date — matches lib/dlc.ts conventions
  return d.toISOString().slice(0, 10);
}

function formatJjMmAaaa(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "JJ.MM.AAAA",
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = isoToDate(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start font-normal h-9", className)}
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value ? formatJjMmAaaa(value) : placeholder}
          </span>
          <CalendarIcon size={16} className="ml-auto" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="p-0">
        <Calendar
          mode="single"
          locale={fr}
          selected={selected}
          onSelect={(d) => {
            if (!d) return;
            onChange(dateToIso(d));
            setOpen(false);
          }}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
