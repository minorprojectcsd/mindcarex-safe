import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  requireRole?: 'PATIENT' | 'DOCTOR';
}

export function DashboardLayout({ children, requireRole }: DashboardLayoutProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Main content: adds top padding on mobile for header, left padding on desktop for sidebar */}
      <main className="pt-14 md:pt-0 md:pl-64">
        <div className="min-h-screen p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
