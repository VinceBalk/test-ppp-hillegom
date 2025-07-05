
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { Header } from './Header';
import { useSecurityMonitoring } from '../hooks/useSecurityMonitoring';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  console.log('=== LAYOUT COMPONENT RENDERING ===');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loading } = useAuth();
  
  // Initialize security monitoring
  useSecurityMonitoring();

  // Show loading state while authentication is being verified
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="hidden lg:block">
          <div className="w-64 min-h-screen bg-background border-r border-border flex flex-col justify-center">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Bezig met laden...</p>
            </div>
          </div>
        </div>
        <div className="lg:pl-64">
          <header className="bg-white border-b border-border px-4 py-4 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          </header>
          <main className="px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl flex items-center justify-center min-h-[400px]">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Bezig met laden...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Menu */}
      <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      {/* Main Content */}
      <div className="lg:pl-72">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
