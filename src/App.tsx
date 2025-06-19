
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Tournaments from "./pages/Tournaments";
import Matches from "./pages/Matches";
import Schedule from "./pages/Schedule";
import Scores from "./pages/Scores";
import Specials from "./pages/Specials";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="players" element={<Players />} />
              <Route path="tournaments" element={<Tournaments />} />
              <Route path="matches" element={<Matches />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="scores" element={<Scores />} />
              <Route path="specials" element={<Specials />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="users" element={
                <ProtectedRoute requiredRole="beheerder">
                  <Users />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
