import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/auth/Login";
import ProjectTracker from "./pages/project-tracker";
import DocumentMonitor from "./pages/document-monitor";
import MeetingEnvironment from "./pages/meeting-environment";
import NotFound from "./pages/NotFound";
import { useAuthStore } from "./stores/authStore";

const queryClient = new QueryClient();

// Initializes Supabase auth state and registers the onAuthStateChange listener
// exactly once for the entire lifetime of the app.
const AuthInitializer = () => {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => {
    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty deps: run once on mount only
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthInitializer />
        <Routes>
          {/* Public route - Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/project-tracker" replace />} />
            <Route path="project-tracker" element={<ProjectTracker />} />
            <Route path="document-monitor" element={<DocumentMonitor />} />
            <Route path="meeting-environment" element={<MeetingEnvironment />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;