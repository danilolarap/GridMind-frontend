import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext } from './auth';
import { getUserProfile } from '../services/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('gridmind_token'));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('gridmind_email'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('gridmind_name'));

  const login = (newToken: string, email: string, name: string) => {
    if (!newToken || typeof newToken !== 'string') throw new Error('Respuesta de autenticación inválida.');
    name = name || '';
    localStorage.setItem('gridmind_token', newToken);
    localStorage.setItem('gridmind_email', email);
    localStorage.setItem('gridmind_name', name);
    setToken(newToken);
    setUserEmail(email);
    setUserName(name);
  };

  const logout = () => {
    localStorage.removeItem('gridmind_token');
    localStorage.removeItem('gridmind_email');
    localStorage.removeItem('gridmind_name');
    setToken(null);
    setUserEmail(null);
    setUserName(null);
  };

  // 🔄 Autorecuperación del nombre si falta
  useEffect(() => {
    let active = true;
    if (token && !userName) {
      getUserProfile()
        .then(res => {
          const name = res.data.name;
          if (!active || typeof name !== 'string' || !name) return;
          localStorage.setItem('gridmind_name', name);
          setUserName(name);
        })
        .catch(err => console.error("Error recuperando perfil:", err));
    }
    return () => { active = false; };
  }, [token, userName]);

  return (
    <AuthContext.Provider value={{ token, userEmail, userName, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
