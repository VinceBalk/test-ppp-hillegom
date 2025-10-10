// Removed conflicting globals.css import - using index.css instead
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import GlobalStandings from "./pages/GlobalStandings";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import PlayerDetail from "./pages/PlayerDetail";
import Tournaments from "./pages/Tournaments";
import TournamentStandings from "./pages/TournamentStandings";
import AssignPlayers from "./pages/AssignPlayers";
import Matches from "./pages/Matches";
import Schedule from "./pages/Schedule";
import Scores from "./pages/Scores";
import Specials from "./pages/Specials";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Courts from "./pages/Courts";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  console.log('=== APP COMPONENT RENDERING ===');
  console.log('Current URL:', window.location.href);
  console.log('Pathname:', window.location.pathname);
  console.log('React is working - this should appear first');
  
  return (
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
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="players" element={<Players />} />
                <Route path="players/:id" element={<PlayerDetail />} />
                <Route path="tournaments" element={<Tournaments />} />
                <Route path="tournaments/:id/standings" element={<TournamentStandings />} />
                <Route path="tournaments/:id/assign-players" element={<AssignPlayers />} />
                <Route path="matches" element={<Matches />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="schedule/:tournamentId" element={<Schedule />} />
                <Route path="standings" element={<GlobalStandings />} />
                <Route path="tournament-standings/:tournamentId" element={<TournamentStandings />} />
                <Route path="scores" element={<Scores />} />
                <Route path="scores/:matchId" element={<Scores />} />
                <Route path="specials" element={<Specials />} />
                <Route path="courts" element={<Courts />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="users" element={<Users />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
