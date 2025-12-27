import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  requireRole?: 'PATIENT' | 'DOCTOR';
}

export function DashboardLayout({ children, requireRole }: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        <div className="min-h-screen p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
