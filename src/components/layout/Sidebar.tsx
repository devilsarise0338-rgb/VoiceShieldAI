import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const consoleItems = [
    { label: 'Analyze', to: '/analyze' },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'History', to: '/history' },
    { label: 'Agents', to: '/agents' },
  ];

  const systemItems = [
    { label: 'API keys', to: '/api-keys' },
    { label: 'Model limitations', to: '/limitations' },
    { label: 'Settings', to: '/settings' },
  ];

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card text-foreground">
      {/* Brand Header */}
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-border">
        <NavLink to="/analyze" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent"></div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight leading-tight">VoiceShield</span>
            <span className="text-xs text-muted-foreground font-mono leading-tight mt-0.5">v0.3 prototype</span>
          </div>
        </NavLink>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-6 mb-2">
          <span className="text-xs font-semibold text-muted-foreground">Console</span>
        </div>
        <div className="space-y-0.5 px-3 mb-6">
          {consoleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E6F3F0] text-accent'
                    : 'text-foreground hover:bg-muted'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="px-6 mb-2">
          <span className="text-xs font-semibold text-muted-foreground">System</span>
        </div>
        <div className="space-y-0.5 px-3">
          {systemItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E6F3F0] text-accent'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
};
