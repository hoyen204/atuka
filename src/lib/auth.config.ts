import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { 
          label: 'Email hoặc Zalo ID', 
          type: 'text',
          placeholder: 'email@example.com hoặc zalo_id'
        },
        password: { 
          label: 'Mật khẩu', 
          type: 'password' 
        },
        rememberMe: {
          label: 'Nhớ tôi',
          type: 'checkbox'
        },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Vui lòng nhập đầy đủ thông tin đăng nhập');
        }

        try {
          const isEmail = credentials.identifier.includes('@');
          const whereClause = isEmail 
            ? { email: credentials.identifier }
            : { zalo_id: credentials.identifier };

          const user = await prisma.user.findFirst({
            where: isEmail 
              ? { email: credentials.identifier }
              : { zaloId: credentials.identifier }
          });

          if (!user) {
            throw new Error('Tài khoản không tồn tại');
          }

          if (!user.password) {
            throw new Error('Tài khoản chưa được thiết lập mật khẩu');
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password, 
            user.password
          );

          if (!isValidPassword) {
            throw new Error('Mật khẩu không chính xác');
          }

          if (user.banned) {
            throw new Error('Tài khoản đã bị khóa');
          }

          return {
            id: user.zaloId,
            name: user.name,
            email: user.email,
            zalo_id: user.zaloId,
            license_type: user.licenseType,
            is_admin: user.isAdmin,
            account_plus: user.accountPlus,
            license_expired: user.licenseExpired?.toISOString(),
            is_subscribed: user.isSubscribed,
            can_takeover: user.canTakeover,
            ...(typeof credentials.rememberMe === 'string' ? { rememberMe: credentials.rememberMe === 'true' } : {}),
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.zalo_id = user.zalo_id;
        token.license_type = user.license_type;
        token.is_admin = user.is_admin;
        token.account_plus = user.account_plus;
        token.license_expired = user.license_expired;
        token.is_subscribed = user.is_subscribed;
        token.can_takeover = user.can_takeover;
        if ('rememberMe' in user) {
          token.rememberMe = (user as any).rememberMe;
        }
      }
      if (token.rememberMe === false) {
        token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 1 day
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.zalo_id = token.zalo_id as string;
        session.user.license_type = token.license_type as string;
        session.user.is_admin = token.is_admin as boolean;
        session.user.account_plus = token.account_plus as number;
        session.user.license_expired = token.license_expired as string;
        session.user.is_subscribed = token.is_subscribed as boolean;
        session.user.can_takeover = token.can_takeover as boolean;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days (default, overridden by token.exp if rememberMe is false)
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days (default, overridden by token.exp if rememberMe is false)
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 