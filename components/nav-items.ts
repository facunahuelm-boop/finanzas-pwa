import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Repeat,
  Target,
  FileBarChart,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gastos', label: 'Gastos', icon: ArrowDownCircle },
  { href: '/ingresos', label: 'Ingresos', icon: ArrowUpCircle },
  { href: '/deudas', label: 'Deudas', icon: CreditCard },
  { href: '/gastos-fijos', label: 'Gastos fijos', icon: Repeat },
  { href: '/objetivos', label: 'Objetivos', icon: Target },
  { href: '/reportes', label: 'Reportes', icon: FileBarChart },
];
