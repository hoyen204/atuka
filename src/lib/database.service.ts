import { prisma } from './prisma';
import { LicenseType, MineType, WeddingGiftType } from '../generated/prisma';

export class DatabaseService {
  static async initialize() {
    try {
      await prisma.$connect();
      console.log('Database connection established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  static async createUser(userData: {
    name: string;
    zaloId: string;
    licenseType: LicenseType;
    email?: string;
    password?: string;
  }) {
    try {
      const user = await prisma.user.create({
        data: {
          ...userData,
          isAdmin: false,
          isSubscribed: false,
          accountPlus: 0,
          canTakeover: false,
          banned: false,
        }
      });
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async createAccount(accountData: {
    id: number;
    name: string;
    cookie: string;
    creatorId: string;
    autoLoginTimeRange: any;
  }) {
    try {
      const account = await prisma.account.create({
        data: {
          ...accountData,
          toggle: true,
          availableBuffAmount: 100,
        }
      });
      return account;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  static async getUserWithAccounts(zaloId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { zaloId },
        include: {
          accounts: {
            include: {
              dailyActivities: {
                take: 10,
                orderBy: { createdAt: 'desc' }
              },
              weddingReceived: {
                take: 50,
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          proxies: true
        }
      });
      return user;
    } catch (error) {
      console.error('Error fetching user with accounts:', error);
      throw error;
    }
  }

  static async getAccountsByCreator(creatorId: string) {
    try {
      const accounts = await prisma.account.findMany({
        where: { creatorId },
        include: {
          dailyActivities: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      return accounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  static async updateAccountCultivation(accountId: number, cultivation: number) {
    try {
      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: { cultivation }
      });
      return !!updatedAccount;
    } catch (error) {
      console.error('Error updating account cultivation:', error);
      throw error;
    }
  }

  static async getActiveProxies(creatorId: string) {
    try {
      const proxies = await prisma.proxy.findMany({
        where: { 
          creatorId,
          enabled: true 
        }
      });
      return proxies;
    } catch (error) {
      console.error('Error fetching active proxies:', error);
      throw error;
    }
  }

  static async createDailyActivity(activityData: {
    accountId: number;
    progress?: number;
    totalCultivation?: number;
    totalGem?: number;
    detail?: any;
  }) {
    try {
      const activity = await prisma.accountDailyActivity.create({
        data: activityData
      });
      return activity;
    } catch (error) {
      console.error('Error creating daily activity:', error);
      throw error;
    }
  }

  static async getWeddingGifts(accountId: number, limit: number = 50) {
    try {
      const gifts = await prisma.weddingReceived.findMany({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      return gifts;
    } catch (error) {
      console.error('Error fetching wedding gifts:', error);
      throw error;
    }
  }

  static async getUserByEmail(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      return user;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  static async getUserByZaloId(zaloId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { zaloId }
      });
      return user;
    } catch (error) {
      console.error('Error fetching user by zalo ID:', error);
      throw error;
    }
  }

  static async updateUserLicense(zaloId: string, licenseType: LicenseType, licenseExpired?: Date) {
    try {
      const user = await prisma.user.update({
        where: { zaloId },
        data: {
          licenseType,
          licenseExpired
        }
      });
      return user;
    } catch (error) {
      console.error('Error updating user license:', error);
      throw error;
    }
  }

  static async getClanQuestions() {
    try {
      const questions = await prisma.clanQuestion.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return questions;
    } catch (error) {
      console.error('Error fetching clan questions:', error);
      throw error;
    }
  }

  static async getMines() {
    try {
      const mines = await prisma.mine.findMany({
        orderBy: { name: 'asc' }
      });
      return mines;
    } catch (error) {
      console.error('Error fetching mines:', error);
      throw error;
    }
  }

  static async getConfigs() {
    try {
      const configs = await prisma.config.findMany();
      return configs.reduce((acc, config) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, string>);
    } catch (error) {
      console.error('Error fetching configs:', error);
      throw error;
    }
  }

  static async setConfig(key: string, value: string) {
    try {
      const config = await prisma.config.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
      return config;
    } catch (error) {
      console.error('Error setting config:', error);
      throw error;
    }
  }

  static async close() {
    try {
      await prisma.$disconnect();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }

  static async getAllUsers({ skip = 0, take = 10, search = '' } = {}) {
    try {
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined;
      const users = await prisma.user.findMany({ skip, take, where });
      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  static async countUsers({ search = '' } = {}) {
    try {
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined;
      return await prisma.user.count({ where });
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }

  static async updateUserBanStatus(zaloId: string, banned: boolean) {
    try {
      const user = await prisma.user.update({
        where: { zaloId },
        data: { banned }
      });
      return user;
    } catch (error) {
      console.error('Error updating user ban status:', error);
      throw error;
    }
  }
} 