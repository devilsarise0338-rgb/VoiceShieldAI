import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSkeleton } from './EmptyState';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#070a12]">
        <div className="max-w-md w-full p-6 text-center space-y-4">
          <div className="h-10 w-10 mx-auto rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="font-mono text-xs text-slate-400 uppercase tracking-widest">
            AUTHENTICATING VOICESHIELD AI DEFENSE SESSION...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
