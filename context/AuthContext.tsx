import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'manager' | 'support' | 'customer';

interface User {
  email: string;
  role: UserRole;
  name?: string;
}

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  allUsers: any[];
  login: (email: string, password?: string) => Promise<AuthResult>;
  register: (email: string, password: string, name: string) => Promise<AuthResult>;
  adminUpdateUserRole: (email: string, newRole: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = '/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('chelky_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('chelky_token'));
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user) localStorage.setItem('chelky_user', JSON.stringify(user));
    else localStorage.removeItem('chelky_user');
    
    if (token) localStorage.setItem('chelky_token', token);
    else localStorage.removeItem('chelky_token');
  }, [user, token]);

  const refreshUsers = async () => {
    if (!token || !user || !['admin', 'manager'].includes(user.role)) return;
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAllUsers(data);
    } catch (e) {
      console.error("Failed to fetch users");
    }
  };

  const login = async (email: string, password?: string): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || 'Login failed' };
    }
  };

  const register = async (email: string, password: string, name: string): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || 'Registration failed' };
    }
  };

  const adminUpdateUserRole = async (email: string, newRole: UserRole): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users/${email}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        await refreshUsers();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      allUsers,
      login, 
      register, 
      adminUpdateUserRole,
      logout, 
      isAuthenticated: !!user,
      refreshUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};