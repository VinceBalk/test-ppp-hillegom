import { NavLink, Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Calendar,
  Hash,
  Map,
  User,
  Sliders,
  Shield,
  BarChart3,
  TrendingUp,
  List,
  FileText
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['speler', 'organisator', 'beheerder'] },
  { name: 'Standen', href: '/standings', icon: TrendingUp, roles: ['speler', 'organisator', 'beheerder'] },
  { name: 'Statistieken', href: '/statistics', icon: BarChart3, roles: ['speler', 'organisator', 'beheerder'] },
  { name: 'Spelers', href: '/players', icon: Users, roles: ['speler', 'organisator', 'beheerder'] },
  { name: 'Toernooien', href: '/tournaments', icon: Trophy, roles: ['speler', 'organisator', 'beheerder'] },
  { name: 'Wedstrijden', href: '/matches', icon: Calendar, roles: ['speler', 'organisator', 'beheerder'] },
  { name: 'Schema', href: '/schedule', icon: List, roles: ['organisator', 'beheerder'] },
  { name: 'Scores', href: '/scores', icon: Hash, roles: ['speler', 'organisator', 'beheerder'] },
  { name: 'Specials', href: '/specials', icon: Hash, roles: ['organisator', 'beheerder'] },
  { name: 'Banen', href: '/courts', icon: Map, roles: ['organisator', 'beheerder'] },
  { name: 'Scoreformulier', href: '/scoreform', icon: FileText, roles: ['organisator', 'beheerder'] },
  { name: 'Profiel', href: '/profile', icon: User, roles: ['speler', 'organisator', 'beheerder'] },
  { name: 'Instellingen', href: '/settings', icon: Sliders, roles: ['organisator', 'beheerder'] },
  { name: 'Gebruikers', href: '/users', icon: Shield, roles: ['beheerder'] },
];

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const { user, profile, adminUser, hasRole, isSuperAdmin } = useAuth();

  const filteredItems = navigationItems.filter(item =>
    isSuperAdmin() || item.roles.some(role => hasRole(role))
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle className="flex items-center justify-center">
            <Link to="/" onClick={() => onOpenChange(false)} className="cursor-pointer">
              <img src="/PPP_logo.svg" alt="PPP Hillegom logo" className="h-10 w-auto object-contain max-w-[160px]" />
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="px-4 py-6 space-y-2">
          {filteredItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => onOpenChange(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 mobile-menu-item',
                  isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-content-center">
              <span className="text-sm font-medium text-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {adminUser?.is_super_admin ? 'Super Admin' : (profile?.role || 'Speler')}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
