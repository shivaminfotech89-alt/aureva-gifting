import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ requiredRole }: { requiredRole?: 'admin' | 'customer' }) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) {
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
