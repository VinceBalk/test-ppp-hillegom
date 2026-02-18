// Removed conflicting globals.css import - using index.css instead
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Standings from "./pages/Standings";
import Statistics from "./pages/Statistics";
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
import ScoreForm from "./pages/ScoreForm";
import Layout from "./components/Layout";
import { Footer } from './components/Footer';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
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
                
                <Route path="tournaments/:id/assign-players" element={
                  <ProtectedRoute requiredRole="organisator">
                    <AssignPlayers />
                  </ProtectedRoute>
                } />
                <Route path="matches" element={<Matches />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="schedule/:tournamentId" element={<Schedule />} />
                <Route path="standings" element={<Standings />} />
                <Route path="tournaments/:tournamentId/standings" element={<Standings />} />
                <Route path="statistics" element={<Statistics />} />
                
                <Route path="scores" element={<Scores />} />
                <Route path="scores/:matchId" element={<Scores />} />
                <Route path="specials" element={
                  <ProtectedRoute requiredRole="organisator">
                    <Specials />
                  </ProtectedRoute>
                } />
                <Route path="courts" element={
                  <ProtectedRoute requiredRole="organisator">
                    <Courts />
                  </ProtectedRoute>
                } />
                <Route path="settings" element={
                  <ProtectedRoute requiredRole="organisator">
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="scoreform" element={
                  <ProtectedRoute requiredRole="organisator">
                    <ScoreForm />
                  </ProtectedRoute>
                } />
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
};

export default App;
