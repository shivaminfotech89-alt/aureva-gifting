import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';

export default function ProtectedRoute({ requiredRole }: { requiredRole?: 'admin' | 'customer' }) {
  const { user, profile, isLoading } = useAuthStore();
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        setShowRetry(true);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    if (showRetry) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-4">
          <span className="text-muted-foreground mb-4">Taking longer than usual to load...</span>
          <Button onClick={() => window.location.reload()} className="bg-[#0F172A] text-white">
            Retry Connection
          </Button>
        </div>
      );
    }
    return <div className="h-screen flex items-center justify-center p-4"><span className="text-muted-foreground animate-pulse">Loading...</span></div>;
  }

  if (!user) {
    return <Navigate to="/account/login" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    // If Admin tries to access customer route or vice versa
    if (profile?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
