
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { Header } from './Header';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
