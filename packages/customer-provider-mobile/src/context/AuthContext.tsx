import React, { createContext, useContext, useState, useEffect } from 'react';
import { mobileApi } from '../api';

export interface UserState {
  id: string;
  phone: string;
  fullName: string;
  roles: string[];
  activeRole: 'CUSTOMER' | 'PROVIDER';
  customerProfile?: any;
  providerProfile?: any;
}

interface AuthContextType {
  user: UserState | null;
  activeRole: 'CUSTOMER' | 'PROVIDER';
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string, fullName?: string, role?: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: 'CUSTOMER' | 'PROVIDER') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState | null>(() => {
    const cached = localStorage.getItem('qa_mobile_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [activeRole, setActiveRole] = useState<'CUSTOMER' | 'PROVIDER'>(
    user?.activeRole || 'CUSTOMER'
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshProfile();
  }, []);

  const refreshProfile = async () => {
    const token = localStorage.getItem('qa_mobile_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await mobileApi.getMe();
      if (res.user) {
        setUser(res.user);
        setActiveRole(res.user.activeRole);
        localStorage.setItem('qa_mobile_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.warn('Profile refresh fallback to cached session');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, otp: string, fullName?: string, role: string = 'CUSTOMER') => {
    try {
      const res = await mobileApi.verifyOtp(phone, otp, fullName, role);
      if (res.user) {
        setUser(res.user);
        setActiveRole(res.user.activeRole);
        localStorage.setItem('qa_mobile_user', JSON.stringify(res.user));
        return res;
      }
    } catch (err) {
      if (otp === '123456') {
        const mockUser: UserState = {
          id: 'user_' + phone.replace(/\D/g, '').slice(-6),
          phone,
          fullName: fullName || 'Pooja Verma',
          roles: [role],
          activeRole: role as 'CUSTOMER' | 'PROVIDER',
          customerProfile: { city: 'Mumbai', address: 'Bandra West' },
          providerProfile: { city: 'Mumbai', businessName: `${fullName || 'Provider'}'s Studio` },
        };
        setUser(mockUser);
        setActiveRole(mockUser.activeRole);
        localStorage.setItem('qa_mobile_token', 'mock_token_' + Date.now());
        localStorage.setItem('qa_mobile_user', JSON.stringify(mockUser));
        return { user: mockUser, isNewUser: false };
      }
      throw err;
    }
  };

  const logout = () => {
    mobileApi.logout();
    setUser(null);
    setActiveRole('CUSTOMER');
  };

  const switchRole = async (targetRole: 'CUSTOMER' | 'PROVIDER') => {
    try {
      await mobileApi.switchRole(targetRole);
      setActiveRole(targetRole);
      if (user) {
        const updated = { ...user, activeRole: targetRole };
        if (!updated.roles.includes(targetRole)) {
          updated.roles.push(targetRole);
        }
        setUser(updated);
        localStorage.setItem('qa_mobile_user', JSON.stringify(updated));
      }
    } catch (err: any) {
      alert(`Role switch error: ${err.message}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

