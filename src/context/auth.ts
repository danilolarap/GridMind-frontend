import { createContext, useContext } from 'react';

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  userName: string | null;
  login: (token: string, email: string, name: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
