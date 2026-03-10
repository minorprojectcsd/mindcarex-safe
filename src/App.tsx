import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// Patient Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import BookAppointment from "./pages/patient/BookAppointment";
import MyAppointments from "./pages/patient/MyAppointments";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Shared Pages
import VideoSession from "./pages/VideoSession";
import ChatSession from "./pages/ChatSession";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

// Analysis & Notification Pages
import ChatAnalysis from "./pages/analysis/ChatAnalysis";
import EmotionAnalysis from "./pages/analysis/EmotionAnalysis";
import VoiceAnalysis from "./pages/analysis/VoiceAnalysis";
import SessionSummaryPage from "./pages/analysis/SessionSummaryPage";
import Notifications from "./pages/notifications/Notifications";

const queryClient = new QueryClient();

function RoleBasedRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'DOCTOR':
      return <Navigate to="/doctor/dashboard" replace />;
    case 'PATIENT':
    default:
      return <Navigate to="/patient/dashboard" replace />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Legacy redirect for /dashboard */}
              <Route path="/dashboard" element={<RoleBasedRedirect />} />

              {/* Patient Routes */}
              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/book-appointment"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/appointments"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <MyAppointments />
                  </ProtectedRoute>
                }
              />

              {/* Doctor Routes */}
              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/appointments"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorAppointments />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Shared Protected Routes */}
              <Route
                path="/video/:sessionId"
                element={
                  <ProtectedRoute>
                    <VideoSession />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat-session/:sessionId"
                element={
                  <ProtectedRoute>
                    <ChatSession />
                  </ProtectedRoute>
                }
              />

              {/* Analysis Routes */}
              <Route
                path="/analysis/chat/:sessionId?"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR', 'PATIENT']}>
                    <ChatAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analysis/emotion/:sessionId?"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR', 'PATIENT']}>
                    <EmotionAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analysis/voice/:sessionId?"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR', 'PATIENT']}>
                    <VoiceAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analysis/summary/:sessionId?"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <SessionSummaryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
