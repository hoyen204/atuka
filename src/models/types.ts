export type {
  User,
  Account,
  AccountDailyActivity,
  ClanQuestion,
  Clan,
  Config,
  Hh3dMember,
  Mine,
  Proxy,
  WeddingReceived,
  LicenseType,
  MineType,
  MineResourceType,
  WeddingGiftType,
} from '@prisma/client';

// Import LicenseType for the type definition
import type { LicenseType } from '@prisma/client';

// Additional utility types
export type UserCreateInput = {
  name: string;
  zaloId: string;
  licenseType: LicenseType;
  email?: string;
  password?: string;
};

export type AccountCreateInput = {
  id: number;
  name: string;
  cookie: string;
  creatorId: string;
  autoLoginTimeRange: any;
};

// API DTOs
export interface UserDTO {
  zaloId: string;
  name: string;
  email: string | null;
  licenseType: LicenseType;
  licenseExpired: string | null;
  banned: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UsersResponse {
  users: UserDTO[];
  total: number;
}

export interface UpdateUserLicenseRequest {
  licenseType: LicenseType;
  licenseExpired?: string;
}

export interface UpdateUserLicenseResponse {
  success: boolean;
  message?: string;
  user?: UserDTO;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Client types
export interface UserTableRow extends UserDTO {
  id: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Additional types for license status
export interface LicenseStatus {
  type: LicenseType;
  isActive: boolean;
  daysRemaining?: number;
}

// Clan types
export interface ClanDTO {
  id: number;
  name: string;
  level: number;
  leader: string;
  leaderId: number;
  memberCount: number;
  memberLimit: number;
  activeMembers: number;
}

export interface ClansResponse {
  clans: ClanDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 