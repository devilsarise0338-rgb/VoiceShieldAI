import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const consoleItems = [
    { label: 'Analyze', to: '/analyze' },
    { label: 'Live Detection', to: '/live-detection' },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'History', to: '/history' },
    { label: 'Speakers', to: '/speaker-profiles' },
    { label: 'Alerts', to: '/alerts' },
    { label: 'Investigations', to: '/investigations' },
    { label: 'Reports', to: '/reports' },
    { label: 'Agents', to: '/agents' },
  ];

  const systemItems = [
    { label: 'Model limitations', to: '/limitations' },
    { label: 'Documentation', to: '/help' },
    { label: 'Settings', to: '/settings' },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center rounded px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#E6F3F0] text-accent'
        : 'text-foreground hover:bg-muted'
    }`;

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card text-foreground">
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-border">
        <NavLink to="/analyze" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight leading-tight">VoiceShield</span>
            <span className="text-xs text-muted-foreground font-mono leading-tight mt-0.5">AASIST CPU</span>
          </div>
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-6 mb-2 text-xs font-semibold text-muted-foreground">Console</div>
        <div className="space-y-0.5 px-3 mb-6">
          {consoleItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={onCloseMobile} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="px-6 mb-2 text-xs font-semibold text-muted-foreground">System</div>
        <div className="space-y-0.5 px-3">
          {systemItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={onCloseMobile} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
};
