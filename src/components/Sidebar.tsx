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
  Shield
} from 'lucide-react';

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
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer met e-mailadres of user info */}
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        <div className="text-[13px] font-medium">vincebalk@gmail.com</div>
        <div className="text-[12px]">Beheerder (Super Admin)</div>
      </div>
    </aside>
  );
}

export default Sidebar;
