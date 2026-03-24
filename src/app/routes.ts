import { lazy, type LazyExoticComponent, type ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarHeart,
  CheckSquare,
  FileSignature,
  Heart,
  Home,
  Image as ImageIcon,
  Moon,
  Plane,
  TrendingUp,
  Wallet,
} from 'lucide-react';

export interface AppRoute {
  path: string;
  label: string;
  icon?: LucideIcon;
  component: LazyExoticComponent<ComponentType>;
  nav?: boolean;
}

export const appRoutes: AppRoute[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: Home,
    nav: true,
    component: lazy(() => import('@/pages/Dashboard')),
  },
  {
    path: '/finance',
    label: 'Finance',
    icon: Wallet,
    nav: true,
    component: lazy(() => import('@/pages/Finance')),
  },
  {
    path: '/memories',
    label: 'Memories',
    icon: ImageIcon,
    nav: true,
    component: lazy(() => import('@/pages/Memories')),
  },
  {
    path: '/todo',
    label: 'To-Do',
    icon: CheckSquare,
    nav: true,
    component: lazy(() => import('@/pages/Todo')),
  },
  {
    path: '/date-planner',
    label: 'Date Planner',
    icon: CalendarHeart,
    nav: true,
    component: lazy(() => import('@/pages/DatePlanner')),
  },
  {
    path: '/trading',
    label: 'Trading Hub',
    icon: TrendingUp,
    nav: true,
    component: lazy(() => import('@/pages/TradingHub')),
  },
  {
    path: '/dream-ai',
    label: 'Dream AI',
    icon: Moon,
    nav: true,
    component: lazy(() => import('@/pages/DreamAI')),
  },
  {
    path: '/emotional-memory',
    label: 'Emotional Memory',
    icon: Heart,
    nav: true,
    component: lazy(() => import('@/pages/EmotionalMemory')),
  },
  {
    path: '/travel',
    label: 'Travel System',
    icon: Plane,
    nav: true,
    component: lazy(() => import('@/pages/TravelSystem')),
  },
  {
    path: '/contract',
    label: 'Nanny Contract',
    icon: FileSignature,
    nav: true,
    component: lazy(() => import('@/pages/NannyContract')),
  },
];

export const navigationItems = appRoutes.filter((route) => route.nav);
