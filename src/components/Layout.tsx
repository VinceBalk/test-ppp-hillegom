import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { Header } from './Header';
import { useSecurityMonitoring } from '../hooks/useSecurityMonitoring';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize security monitoring
  useSecurityMonitoring();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 fixed inset-y-0 z-10 bg-background border-r">
        <Sidebar />
      </div>

      {/* Content wrapper */}
      <div className="flex-1 w-full lg:ml-72 flex flex-col">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Menu */}
      <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </div>
  );
}
