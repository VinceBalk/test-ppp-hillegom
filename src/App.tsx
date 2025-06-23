
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Tournaments from '@/pages/Tournaments';
import Players from '@/pages/Players';
import Matches from '@/pages/Matches';
import Schedule from '@/pages/Schedule';
import Courts from '@/pages/Courts';
import Specials from '@/pages/Specials';
import Scores from '@/pages/Scores';
import Users from '@/pages/Users';
import Settings from '@/pages/Settings';
import PlayerDetail from '@/pages/PlayerDetail';
import AssignPlayers from '@/pages/AssignPlayers';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Index />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tournaments"
                element={
                  <ProtectedRoute requiredRole="organisator">
                    <Layout>
                      <Tournaments />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tournaments/:id/assign-players"
                element={
                  <ProtectedRoute requiredRole="organisator">
                    <Layout>
                      <AssignPlayers />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/players"
                element={
                  <ProtectedRoute requiredRole="organisator">
                    <Layout>
                      <Players />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/players/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PlayerDetail />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/matches"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Matches />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedule"
                element={
                  <ProtectedRoute requiredRole="organisator">
                    <Layout>
                      <Schedule />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courts"
                element={
                  <ProtectedRoute requiredRole="organisator">
                    <Layout>
                      <Courts />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/specials"
                element={
                  <ProtectedRoute requiredRole="organisator">
                    <Layout>
                      <Specials />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scores"
                element={
                  <ProtectedRoute requiredRole="organisator">
                    <Layout>
                      <Scores />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRole="beheerder">
                    <Layout>
                      <Users />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredRole="beheerder">
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
