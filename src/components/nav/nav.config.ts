import { Home, BookOpen, Trophy, User, Settings, LucideIcon } from 'lucide-react';

export interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    label: 'Home',
    href: '/home',
    icon: Home,
  },
  {
    label: 'Lessons',
    href: '/lessons',
    icon: BookOpen,
  },
  {
    label: 'Leaderboard',
    href: '/leaderboard',
    icon: Trophy,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
