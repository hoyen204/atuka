import { signIn, signOut, getSession } from 'next-auth/react';
import { calculateDaysRemaining, isDateExpired } from './date.utils';

export interface AuthUser {
  id: string;
  zalo_id: string;
  name: string;
  email?: string;
  license_type: 'FREE' | 'BASIC' | 'PRO';
  is_admin: boolean;
  account_plus: number;
  license_expired?: string;
  is_subscribed: boolean;
  can_takeover: boolean;
}

export interface LoginCredentials {
  email?: string;
  zaloId?: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  message?: string;
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const identifier = credentials.email || credentials.zaloId;
      
      if (!identifier) {
        return {
          success: false,
          message: 'Vui lòng nhập email hoặc Zalo ID',
        };
      }

      const result = await signIn('credentials', {
        identifier,
        password: credentials.password,
        redirect: false,
        rememberMe: credentials.rememberMe,
      });

      if (result?.error) {
        return {
          success: false,
          message: result.error,
        };
      }

      if (result?.ok) {
        const session = await getSession();
        return {
          success: true,
          user: session?.user as AuthUser,
          message: 'Đăng nhập thành công',
        };
      }

      return {
        success: false,
        message: 'Đăng nhập thất bại',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Lỗi kết nối. Vui lòng thử lại.',
      };
    }
  }

  static async logout(): Promise<void> {
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const session = await getSession();
      return session?.user as AuthUser || null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async register(userData: {
    name: string;
    email?: string;
    zalo_id?: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          user: data.user,
          message: data.message,
        };
      } else {
        return {
          success: false,
          message: data.error,
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Lỗi kết nối. Vui lòng thử lại.',
      };
    }
  }

  static hasActiveLicense(user: AuthUser | null): boolean {
    if (!user) return false;

    if (user.license_type === 'FREE') return true;

    if (user.license_expired) {
      return !isDateExpired(user.license_expired);
    }

    return false;
  }

  static getLicenseStatus(user: AuthUser | null): {
    type: string;
    isActive: boolean;
    daysRemaining?: number;
  } {
    if (!user) {
      return { type: 'NONE', isActive: false };
    }

    const isActive = this.hasActiveLicense(user);
    const daysRemaining = user.license_type !== 'FREE' 
      ? calculateDaysRemaining(user.license_expired)
      : undefined;

    return {
      type: user.license_type,
      isActive,
      daysRemaining,
    };
  }
} 