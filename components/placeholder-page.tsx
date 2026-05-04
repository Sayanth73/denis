import { Home, Package, Factory, Truck, Users, Search } from "lucide-react";
import type { NavIconName } from "@/lib/nav";

const ICONS: Record<
  NavIconName,
  React.ComponentType<{ className?: string; size?: number | string; "aria-hidden"?: boolean | "true" | "false" }>
> = {
  Home,
  Package,
  Factory,
  Truck,
  Users,
  Search,
};

type PlaceholderPageProps = {
  title: string;
  description: string;
  iconName: NavIconName;
};

export function PlaceholderPage({ title, description, iconName }: PlaceholderPageProps) {
  const Icon = ICONS[iconName];
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <Icon size={48} className="text-muted-foreground" aria-hidden="true" />
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
