import { Home, Package, Factory, Truck, Users, Search, Boxes, Receipt, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import type { NavIconName } from "@/lib/nav";

export const NAV_ICONS: Record<NavIconName, ComponentType<LucideProps>> = {
  Home,
  Package,
  Factory,
  Truck,
  Users,
  Search,
  Boxes,
  Receipt,
};
