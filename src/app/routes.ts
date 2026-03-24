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
    label: 'Tổng quan',
    icon: Home,
    nav: true,
    component: lazy(() => import('@/pages/Dashboard')),
  },
  {
    path: '/finance',
    label: 'Tài chính',
    icon: Wallet,
    nav: true,
    component: lazy(() => import('@/pages/Finance')),
  },
  {
    path: '/memories',
    label: 'Kỷ niệm',
    icon: ImageIcon,
    nav: true,
    component: lazy(() => import('@/pages/Memories')),
  },
  {
    path: '/todo',
    label: 'Việc cần làm',
    icon: CheckSquare,
    nav: true,
    component: lazy(() => import('@/pages/Todo')),
  },
  {
    path: '/date-planner',
    label: 'Kế hoạch hẹn hò',
    icon: CalendarHeart,
    nav: true,
    component: lazy(() => import('@/pages/DatePlanner')),
  },
  {
    path: '/trading',
    label: 'Thị trường',
    icon: TrendingUp,
    nav: true,
    component: lazy(() => import('@/pages/TradingHub')),
  },
  {
    path: '/dream-ai',
    label: 'Giấc mơ AI',
    icon: Moon,
    nav: true,
    component: lazy(() => import('@/pages/DreamAI')),
  },
  {
    path: '/emotional-memory',
    label: 'Hộp tâm thư',
    icon: Heart,
    nav: true,
    component: lazy(() => import('@/pages/EmotionalMemory')),
  },
  {
    path: '/travel',
    label: 'Du lịch',
    icon: Plane,
    nav: true,
    component: lazy(() => import('@/pages/TravelSystem')),
  },
  {
    path: '/contract',
    label: 'Hợp đồng bảo mẫu',
    icon: FileSignature,
    nav: true,
    component: lazy(() => import('@/pages/NannyContract')),
  },
];

export const navigationItems = appRoutes.filter((route) => route.nav);
