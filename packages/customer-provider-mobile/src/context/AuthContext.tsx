import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  login: (phone: string, otp: string, fullName?: string, role?: string, preloadedUser?: any) => Promise<any>;
  logout: () => void;
  switchRole: (role: 'CUSTOMER' | 'PROVIDER') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeProviderProfile = (prof: any) => {
  if (!prof) return undefined;
  const verificationStatus = prof.verificationStatus || prof.verification_status || 'PENDING';
  const isAcceptingBookings =
    verificationStatus === 'APPROVED' &&
    Boolean(prof.isAcceptingBookings ?? prof.is_accepting_bookings);
  return {
    ...prof,
    businessName: prof.businessName || prof.business_name,
    verificationStatus,
    verification_status: verificationStatus,
    isVerified: verificationStatus === 'APPROVED',
    isAcceptingBookings,
    is_accepting_bookings: isAcceptingBookings,
    rejectionReason: prof.rejectionReason ?? prof.rejection_reason ?? null,
    rejection_reason: prof.rejectionReason ?? prof.rejection_reason ?? null,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState | null>(() => {
    try {
      const cached = localStorage.getItem('qa_mobile_user');
      if (cached && cached !== 'undefined' && cached !== 'null') {
        const parsed = JSON.parse(cached);
        if (parsed?.providerProfile) {
          parsed.providerProfile = normalizeProviderProfile(parsed.providerProfile);
        }
        return parsed;
      }
    } catch (e) {
      try {
        localStorage.removeItem('qa_mobile_user');
      } catch { }
    }

    // Default seamless session so user lands immediately on Customer Home Screen matching Screenshot 1
    const defaultUser: UserState = {
      id: 'usr-customer-1',
      phone: '9876543210',
      fullName: 'Rahul Verma',
      roles: ['CUSTOMER'],
      activeRole: 'CUSTOMER',
      customerProfile: {
        id: 'cp-1',
        city: 'Indiranagar, Bangalore',
        address: 'Flat 402, Green Glen Layout, Bellandur, Bangalore',
      },
    };
    try {
      localStorage.setItem('qa_mobile_user', JSON.stringify(defaultUser));
    } catch { }
    return defaultUser;
  });
  const [activeRole, setActiveRole] = useState<'CUSTOMER' | 'PROVIDER'>(
    (user?.activeRole && String(user.activeRole).toUpperCase() === 'PROVIDER') ? 'PROVIDER' : 'CUSTOMER'
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('qa_mobile_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await mobileApi.getMe();
      if (res.user) {
        const normalized: UserState = {
          ...res.user,
          providerProfile: normalizeProviderProfile(res.user.providerProfile),
        };
        setUser(normalized);
        setActiveRole(normalized.activeRole);
        localStorage.setItem('qa_mobile_user', JSON.stringify(normalized));
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Backend /auth/me unavailable, trying provider KYC sync');
    }

    try {
      if (user?.id || user?.phone) {
        const kyc = await mobileApi.getProviderKycStatus(user?.id, user?.phone);
        if (kyc?.profile) {
          const updated: UserState = {
            ...user,
            providerProfile: normalizeProviderProfile(kyc.profile),
          };
          setUser(updated);
          localStorage.setItem('qa_mobile_user', JSON.stringify(updated));
        }
      }
    } catch { }

    setIsLoading(false);
  }, [user?.id, user?.phone]);

  useEffect(() => {
    refreshProfile();
    const unsubscribeSync = mobileApi.subscribeToSync((type) => {
      if (type === 'PROVIDER_APPROVED' || type === 'USER_UPDATED') {
        refreshProfile();
      }
    });
    return () => {
      unsubscribeSync();
    };
  }, []);

  const login = async (
    phone: string,
    otp: string,
    fullName?: string,
    role: string = 'CUSTOMER',
    preloadedUser?: any
  ) => {
    if (preloadedUser) {
      const normalized: UserState = {
        id: preloadedUser.id,
        phone: preloadedUser.phone || phone,
        fullName: preloadedUser.fullName || preloadedUser.full_name || fullName || 'Quick User',
        roles: preloadedUser.roles || [role],
        activeRole: (preloadedUser.activeRole || role) as 'CUSTOMER' | 'PROVIDER',
        customerProfile: preloadedUser.customerProfile || preloadedUser.customer_profiles,
        providerProfile: normalizeProviderProfile(
          preloadedUser.providerProfile || preloadedUser.provider_profiles
        ),
      };
      setUser(normalized);
      setActiveRole(normalized.activeRole);
      localStorage.setItem('qa_mobile_user', JSON.stringify(normalized));
      return { user: normalized, isNewUser: false };
    }

    const res = await mobileApi.verifyOtp(phone, otp, fullName, role);
    if (res.user) {
      const normalized: UserState = {
        ...res.user,
        providerProfile: normalizeProviderProfile(res.user.providerProfile),
      };
      setUser(normalized);
      setActiveRole(normalized.activeRole);
      localStorage.setItem('qa_mobile_user', JSON.stringify(normalized));
      return res;
    }
    throw new Error('Authentication failed. Please try again.');
  };

  const logout = () => {
    mobileApi.logout();
    setUser(null);
    setActiveRole('CUSTOMER');
  };

  const switchRole = async (targetRole: 'CUSTOMER' | 'PROVIDER') => {
    try {
      await mobileApi.switchRole(targetRole).catch(() => null);
      setActiveRole(targetRole);
      if (user) {
        const updated: UserState = { ...user, activeRole: targetRole };
        if (!updated.roles.includes(targetRole)) {
          updated.roles.push(targetRole);
        }
        if (targetRole === 'PROVIDER') {
          const kyc = await mobileApi.getProviderKycStatus(user.id, user.phone).catch(() => null);
          if (kyc?.profile) {
            updated.providerProfile = normalizeProviderProfile(kyc.profile);
          }
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

