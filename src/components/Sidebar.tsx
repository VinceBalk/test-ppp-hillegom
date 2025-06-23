
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar,
  Users,
  Trophy,
  BarChart3,
  Settings,
  LogOut,
  User,
  FileText,
  Target,
  UserCheck,
  Layout
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3, roles: ['beheerder', 'organisator', 'speler'] },
  { name: 'Toernooien', href: '/tournaments', icon: Trophy, roles: ['beheerder', 'organisator'] },
  { name: 'Spelers', href: '/players', icon: Users, roles: ['beheerder', 'organisator'] },
  { name: 'Wedstrijden', href: '/matches', icon: Calendar, roles: ['beheerder', 'organisator', 'speler'] },
  { name: 'Schema', href: '/schedule', icon: Layout, roles: ['beheerder', 'organisator'] },
  { name: 'Banen', href: '/courts', icon: Target, roles: ['beheerder', 'organisator'] },
  { name: 'Specials', href: '/specials', icon: FileText, roles: ['beheerder', 'organisator'] },
  { name: 'Scores', href: '/scores', icon: BarChart3, roles: ['beheerder', 'organisator'] },
  { name: 'Gebruikers', href: '/users', icon: UserCheck, roles: ['beheerder'] },
  { name: 'Instellingen', href: '/settings', icon: Settings, roles: ['beheerder'] },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Succesvol uitgelogd",
        description: "Je bent succesvol uitgelogd.",
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Fout bij uitloggen",
        description: "Er is een fout opgetreden bij het uitloggen.",
        variant: "destructive",
      });
    }
  };

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    return item.roles.some(role => hasRole(role));
  });

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Trophy className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-gray-900">PPP Hillegom</span>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center w-full">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-3 flex-shrink-0 p-1 text-gray-400 hover:text-gray-500"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
