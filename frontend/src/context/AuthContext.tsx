import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, LoginCredentials, RegisterCredentials } from '../types/auth';
import { authApi } from '../services/authApi';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('hydrosmart_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('hydrosmart_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Kiểm tra token khi ứng dụng khởi động
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('hydrosmart_token');
      if (savedToken) {
        try {
          const profile = await authApi.getMe(savedToken);
          setUser(profile);
          localStorage.setItem('hydrosmart_current_user', JSON.stringify(profile));
        } catch {
          // Token hỏng hoặc hết hạn
          localStorage.removeItem('hydrosmart_token');
          localStorage.removeItem('hydrosmart_current_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { user: authUser, token: authToken } = await authApi.login(credentials);
      setUser(authUser);
      setToken(authToken);
      localStorage.setItem('hydrosmart_token', authToken);
      localStorage.setItem('hydrosmart_current_user', JSON.stringify(authUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const { user: authUser, token: authToken } = await authApi.register(credentials);
      setUser(authUser);
      setToken(authToken);
      localStorage.setItem('hydrosmart_token', authToken);
      localStorage.setItem('hydrosmart_current_user', JSON.stringify(authUser));
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<AuthUser>) => {
    if (!token) throw new Error('Chưa đăng nhập');
    const updated = await authApi.updateProfile(token, data);
    setUser(updated);
    localStorage.setItem('hydrosmart_current_user', JSON.stringify(updated));
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    if (!token) throw new Error('Chưa đăng nhập');
    await authApi.changePassword(token, oldPass, newPass);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hydrosmart_token');
    localStorage.removeItem('hydrosmart_current_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
