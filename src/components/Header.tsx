
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();

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
          <div className="lg:hidden">
            <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
              PPP Hillegom
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={signOut}>
            Uitloggen
          </Button>
        </div>
      </div>
    </header>
  );
}
