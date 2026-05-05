// Navigation data — single source of truth for the sidebar.
// Pure data module: no React imports, so server components can consume it
// without dragging lucide-react. Renderers resolve the icon by name.
// Order locked by UI-SPEC §Layout "Sidebar — six entries".

export type NavIconName =
  | "Home"
  | "Package"
  | "Factory"
  | "Truck"
  | "Users"
  | "Search"
  | "Boxes"
  | "Receipt"
  | "Settings";

export type NavItem = {
  label: string;
  route: string;
  iconName: NavIconName;
};

export const NAV_ITEMS = [
  { label: "Tableau de bord", route: "/", iconName: "Home" },
  { label: "Matières premières", route: "/matieres-premieres", iconName: "Package" },
  { label: "Stock broches", route: "/stock-broches", iconName: "Boxes" },
  { label: "Production", route: "/production", iconName: "Factory" },
  { label: "Livraisons", route: "/livraisons", iconName: "Truck" },
  { label: "Factures", route: "/factures", iconName: "Receipt" },
  { label: "Clients", route: "/clients", iconName: "Users" },
  { label: "Traçabilité", route: "/tracabilite", iconName: "Search" },
  { label: "Paramètres", route: "/parametres", iconName: "Settings" },
] as const satisfies readonly NavItem[];

export const NAV_LABELS: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.route, item.label]),
);

// Exact match for "/" (otherwise every path would match as prefix);
// prefix match for the others (so /clients/123 still resolves to "Clients").
export function getActiveLabel(pathname: string): string {
  if (pathname === "/") return NAV_LABELS["/"];
  const match = NAV_ITEMS.find(
    (item) =>
      item.route !== "/" &&
      (pathname === item.route || pathname.startsWith(item.route + "/")),
  );
  return match?.label ?? "TraceKebab";
}

export function isActiveRoute(pathname: string, route: string): boolean {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(route + "/");
}
