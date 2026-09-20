import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Radio,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface TopbarProps {
  onToggleMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileMenu }) => {
  const { user } = useAuth();
  const { alerts, unreadAlertsCount, backendConfig } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Operations Dashboard';
      case '/live-detection':
        return 'Live Voice Stream Intercept';
      case '/audio-analysis':
        return 'Forensic Audio File Analysis';
      case '/speaker-profiles':
        return 'Speaker Biometric Profiles';
      case '/alerts':
        return 'Security Alerts & Incidents';
      case '/history':
        return 'Audit & Verification History';
      case '/investigations':
        return 'Incident Investigation Workspace';
      case '/reports':
        return 'Forensic Security Reports';
      case '/settings':
        return 'Settings & Configuration';
      case '/help':
        return 'Platform Documentation & Specs';
      default:
        return 'VoiceShield AI';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 bg-[#0b0f19]/90 px-4 backdrop-blur-md lg:px-8">
      {/* Left title & Mobile menu button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="rounded-lg border border-slate-850 p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-400">
              VoiceShield
            </span>
            <span className="text-slate-600">/</span>
            <h1 className="text-sm font-semibold text-slate-100">{getPageTitle()}</h1>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Demo Mode Badge */}
        {backendConfig.demoMode && (
          <div className="hidden md:flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Demo Mode</span>
          </div>
        )}

        {/* Live Detection Primary CTA */}
        {location.pathname !== '/live-detection' && (
          <button
            onClick={() => navigate('/live-detection')}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm shadow-blue-900/30 hover:bg-blue-500 transition-all"
          >
            <Radio className="h-3.5 w-3.5 text-blue-200" />
            <span className="hidden sm:inline">Start Live Detection</span>
            <span className="sm:hidden">Live</span>
          </button>
        )}

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800/80 bg-slate-950 p-3 shadow-xl backdrop-blur-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                <span className="text-xs font-semibold text-slate-200">
                  Notifications
                </span>
                <span className="text-[11px] text-blue-400 font-medium">{alerts.length} total</span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {alerts.slice(0, 4).map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/alerts');
                    }}
                    className="cursor-pointer rounded-lg border border-slate-850 bg-slate-900/50 p-2.5 transition hover:border-slate-700 hover:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-medium capitalize px-2 py-0.5 rounded-full ${
                          alt.severity === 'critical'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {alt.severity}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-slate-200 line-clamp-1">{alt.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{alt.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 border-t border-slate-800/80 pt-2 text-center">
                <NavLink
                  to="/alerts"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  View all alerts →
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* User Mini Profile */}
        <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-400">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="text-left text-xs">
            <p className="font-medium text-slate-200 truncate max-w-[120px]">{user?.full_name || 'Analyst'}</p>
            <p className="text-[11px] text-slate-400 capitalize">{user?.role?.replace('_', ' ') || 'Security Team'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
