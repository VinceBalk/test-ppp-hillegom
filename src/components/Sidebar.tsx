import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Calendar,
  List,
  Hash,
  Map,
  User,
  Sliders,
  Shield,
  BarChart3,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['speler', 'organisator', 'beheerder'] },
  { to: '/standings', label: 'Standen', icon: TrendingUp, roles: ['speler', 'organisator', 'beheerder'] },
  { to: '/statistics', label: 'Statistieken', icon: BarChart3, roles: ['speler', 'organisator', 'beheerder'] },
  { to: '/players', label: 'Spelers', icon: Users, roles: ['speler', 'organisator', 'beheerder'] },
  { to: '/tournaments', label: 'Toernooien', icon: Trophy, roles: ['speler', 'organisator', 'beheerder'] },
  { to: '/matches', label: 'Wedstrijden', icon: Calendar, roles: ['speler', 'organisator', 'beheerder'] },
  { to: '/schedule', label: 'Schema', icon: List, roles: ['speler', 'organisator', 'beheerder'] },
  { to: '/scores', label: 'Scores', icon: Hash, roles: ['speler', 'organisator', 'beheerder'] },
  { to: '/specials', label: 'Specials', icon: Hash, roles: ['organisator', 'beheerder'] },
  { to: '/courts', label: 'Banen', icon: Map, roles: ['organisator', 'beheerder'] },
  { to: '/scoreform', label: 'Scoreformulier', icon: FileText, roles: ['organisator', 'beheerder'] },
  { to: '/profile', label: 'Profiel', icon: User, roles: ['speler', 'organisator', 'beheerder'] },
  { to: '/settings', label: 'Instellingen', icon: Sliders, roles: ['organisator', 'beheerder'] },
  { to: '/users', label: 'Gebruikers', icon: Shield, roles: ['beheerder'] }
];
export function Sidebar() {
  const { user, profile, adminUser, loading, hasRole, isSuperAdmin } = useAuth();
  // Filter menu items based on user role
  const getVisibleNavItems = () => {
    // Super admin can see everything
    if (isSuperAdmin()) return navItems;
    
    // Filter based on user's role
    return navItems.filter(item => 
      item.roles.some(role => hasRole(role))
    );
  };
  const visibleNavItems = getVisibleNavItems();
  // Show loading state
  if (loading) {
    return (
      <aside className="w-64 min-h-screen bg-background border-r border-border flex flex-col justify-center">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Bezig met laden...</p>
        </div>
      </aside>
    );
  }
  return (
    <aside className="w-64 min-h-screen bg-background border-r border-border flex flex-col justify-between">
      {/* Logo - klikbaar naar dashboard */}
      <div className="h-16 flex items-center justify-center border-b border-border px-4">
        <Link to="/" className="cursor-pointer">
          <img
            src="/PPP_logo.svg"
            alt="PPP Hillegom logo"
            className="h-8 object-contain"
          />
        </Link>
      </div>
      {/* Navigatie */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {visibleNavItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {/* Footer met e-mailadres of user info */}
      <div className="border-t border-border p-4 text-muted-foreground">
        <div className="text-sm font-medium">{user?.email || 'Gebruiker'}</div>
        <div className="text-sm">
          {adminUser?.is_super_admin ? 'Super Admin' : (profile?.role || 'Speler')}
        </div>
      </div>
    </aside>
  );
}
export default Sidebar;
