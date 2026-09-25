import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans selection:bg-accent/30 selection:text-accent">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-56 flex-col bg-card border-r border-border shadow-2xl">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 right-3 rounded-sm p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Close Menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Simple topbar for mobile only */}
        <header className="lg:hidden flex h-14 items-center gap-4 border-b border-border bg-card px-4 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-sm p-2 text-muted-foreground hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm">VoiceShield</span>
        </header>
        <main className="flex-1 overflow-y-auto bg-background text-foreground">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
