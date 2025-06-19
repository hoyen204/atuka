import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      zalo_id: string;
      license_type: string;
      is_admin: boolean;
      account_plus: number;
      license_expired?: string;
      is_subscribed: boolean;
      can_takeover: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    zalo_id: string;
    license_type: string;
    is_admin: boolean;
    account_plus: number;
    license_expired?: string;
    is_subscribed: boolean;
    can_takeover: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    zalo_id: string;
    license_type: string;
    is_admin: boolean;
    account_plus: number;
    license_expired?: string;
    is_subscribed: boolean;
    can_takeover: boolean;
  }
} 