'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useState, useEffect } from 'react';
import { AuthService, AuthUser, LoginCredentials, AuthResponse } from '../lib/auth';

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasActiveLicense: boolean;
  licenseStatus: {
    type: string;
    isActive: boolean;
    daysRemaining?: number;
  };
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  register: (userData: {
    name: string;
    email?: string;
    zalo_id?: string;
    password: string;
  }) => Promise<AuthResponse>;
  isMounted: boolean;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status, update } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [hasActiveLicense, setHasActiveLicense] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState({ type: 'NONE', isActive: false });
  
  const user = session?.user as AuthUser || null;
  const isLoading = status === 'loading';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setHasActiveLicense(AuthService.hasActiveLicense(user));
      setLicenseStatus(AuthService.getLicenseStatus(user));
    }
  }, [isMounted, user]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return await AuthService.login(credentials);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await AuthService.logout();
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    await update();
  }, [update]);

  const register = useCallback(async (userData: {
    name: string;
    email?: string;
    zalo_id?: string;
    password: string;
  }): Promise<AuthResponse> => {
    return await AuthService.register(userData);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: isMounted ? !!user : false,
    isAdmin: isMounted ? (user?.is_admin || false) : false,
    hasActiveLicense,
    licenseStatus,
    login,
    logout,
    refreshUser,
    register,
    isMounted,
  };
} 