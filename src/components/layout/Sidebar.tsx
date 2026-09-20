import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  FileAudio,
  Users,
  Bell,
  History,
  FolderSearch,
  FileText,
  Settings,
  HelpCircle,
  Shield,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, signOut, isSupabaseConnected } = useAuth();
  const { unreadAlertsCount, openInvestigationsCount, backendConfig } = useData();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Detection', to: '/live-detection', icon: Radio, live: true },
    { label: 'Audio Analysis', to: '/audio-analysis', icon: FileAudio },
    { label: 'Speaker Profiles', to: '/speaker-profiles', icon: Users },
    { label: 'Security Alerts', to: '/alerts', icon: Bell, badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined, badgeColor: 'bg-rose-500' },
    { label: 'Detection History', to: '/history', icon: History },
    { label: 'Investigations', to: '/investigations', icon: FolderSearch, badge: openInvestigationsCount > 0 ? openInvestigationsCount : undefined, badgeColor: 'bg-amber-500' },
    { label: 'Security Reports', to: '/reports', icon: FileText },
  ];

  const bottomNavItems = [
    { label: 'System Settings', to: '/settings', icon: Settings },
    { label: 'Documentation & Specs', to: '/help', icon: HelpCircle },
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800/80 bg-[#0b0f19] text-slate-300">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 px-4">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white">VoiceShield</span>
              <span className="rounded-full bg-blue-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Voice Security & Anti-Spoof</p>
          </div>
        </NavLink>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900/70 hover:text-slate-200 border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.live && (
                  <span className="flex h-2 w-2 relative">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                )}
                {item.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.2 text-[10px] font-semibold text-white ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Management
        </div>
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900/70 hover:text-slate-200 border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Backend & Environment Status */}
      <div className="border-t border-slate-800/80 p-3">
        <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/80 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Database</span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                isSupabaseConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {isSupabaseConnected ? 'Connected' : 'Local Storage'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">AI Model</span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                backendConfig.demoMode
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {backendConfig.demoMode ? 'Simulation Engine' : 'Live Inference'}
            </span>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 font-semibold text-xs text-blue-400 border border-blue-500/30">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate text-left">
              <p className="truncate text-xs font-medium text-slate-200">{user?.full_name || 'Security Analyst'}</p>
              <p className="truncate text-[11px] text-slate-400 capitalize">{user?.role?.replace('_', ' ') || 'Analyst'}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
