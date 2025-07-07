import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Show loading state in header
  if (loading) {
    return (
      <header className="bg-white border-b border-border px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="lg:hidden flex items-center">
              <img
                src="/PPP_logo.svg"
                alt="PPP Hillegom logo"
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Laden...</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-border px-4 py-4 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="lg:hidden flex items-center">
            <img
              src="/PPP_logo.svg"
              alt="PPP Hillegom logo"
              className="h-8 w-auto object-contain max-w-[120px]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.email || 'Gebruiker'}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Uitloggen
          </Button>
        </div>
      </div>
    </header>
  );
}
