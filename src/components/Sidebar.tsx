import { NavLink } from 'react-router-dom';
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
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/players', label: 'Spelers', icon: Users },
  { to: '/tournaments', label: 'Toernooien', icon: Trophy },
  { to: '/matches', label: 'Wedstrijden', icon: Calendar },
  { to: '/schedule', label: 'Schema', icon: List },
  { to: '/scores', label: 'Scores', icon: Hash },
  { to: '/specials', label: 'Specials', icon: Hash },
  { to: '/courts', label: 'Banen', icon: Map },
  { to: '/profile', label: 'Profiel', icon: User },
  { to: '/settings', label: 'Instellingen', icon: Sliders },
  { to: '/users', label: 'Gebruikers', icon: Shield }
];

export function Sidebar() {
  const { user, profile, adminUser, loading } = useAuth();

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
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-border px-4">
        <img
          src="/PPP_logo.svg"
          alt="PPP Hillegom logo"
          className="h-8 object-contain"
        />
      </div>

      {/* Navigatie */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map(({ to, label, icon: Icon }) => (
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
