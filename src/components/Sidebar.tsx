
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Users, 
  Trophy, 
  Calendar, 
  Target, 
  Award, 
  Settings, 
  UserCog 
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: Home, roles: ['speler', 'organisator', 'beheerder'] },
  { name: 'Spelers', href: '/players', icon: Users, roles: ['organisator', 'beheerder'] },
  { name: 'Toernooien', href: '/tournaments', icon: Trophy, roles: ['organisator', 'beheerder'] },
  { name: 'Wedstrijden', href: '/matches', icon: Target, roles: ['organisator', 'beheerder'] },
  { name: 'Schema', href: '/schedule', icon: Calendar, roles: ['speler', 'organisator', 'beheerder'] },
  { name: 'Scores', href: '/scores', icon: Award, roles: ['speler', 'organisator', 'beheerder'] },
  { name: 'Specials', href: '/specials', icon: Award, roles: ['organisator', 'beheerder'] },
  { name: 'Instellingen', href: '/settings', icon: Settings, roles: ['organisator', 'beheerder'] },
  { name: 'Gebruikers', href: '/users', icon: UserCog, roles: ['beheerder'] },
];

export function Sidebar() {
  const { user, hasRole, isSuperAdmin, profile, adminUser } = useAuth();

  console.log('Sidebar render - Auth state:', {
    user: user?.email,
    profile: profile?.role,
    adminUser: adminUser?.is_super_admin,
    isSuperAdmin: isSuperAdmin()
  });

  const filteredItems = navigationItems.filter(item => {
    const isSuper = isSuperAdmin();
    const hasRequiredRole = item.roles.some(role => hasRole(role));
    const shouldShow = isSuper || hasRequiredRole;
    
    console.log(`Navigation item "${item.name}": required roles=[${item.roles.join(', ')}], hasRequiredRole=${hasRequiredRole}, isSuper=${isSuper}, shouldShow=${shouldShow}`);
    
    return shouldShow;
  });

  console.log('Filtered navigation items:', filteredItems.map(item => item.name));

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-border">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            PPP Hillegom
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-accent/50'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {profile?.role || 'Geen rol'}
                {adminUser?.is_super_admin && ' (Super Admin)'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
