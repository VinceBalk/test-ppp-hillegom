
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Mock auth context for now - will be replaced with Supabase Auth
interface User {
  id: string;
  email: string;
  role: 'speler' | 'organisator' | 'beheerder';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    const checkAuth = async () => {
      setLoading(false);
    };
    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock sign in - replace with Supabase
    const mockUser: User = {
      id: '1',
      email: email,
      role: email === 'vincebalk@gmail.com' ? 'beheerder' : 'speler'
    };
    setUser(mockUser);
  };

  const signOut = async () => {
    setUser(null);
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    const roleHierarchy = { speler: 1, organisator: 2, beheerder: 3 };
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0;
    return userLevel >= requiredLevel;
  };

  const isSuperAdmin = () => {
    return user?.email === 'vincebalk@gmail.com';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      hasRole,
      isSuperAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
