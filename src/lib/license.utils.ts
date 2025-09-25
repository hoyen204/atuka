import { LicenseType } from '@prisma/client';

export interface LicenseConfig {
  type: LicenseType;
  accountLimit: number;
  price: number;
  features: string[];
  priority: number;
}

export const LICENSE_CONFIGS: Record<LicenseType, LicenseConfig> = {
  [LicenseType.FREE]: {
    type: LicenseType.FREE,
    accountLimit: 2,
    price: 0,
    priority: 0,
    features: [
      'Giới hạn 2 tài khoản',
      'Nhận thông báo tiệc cưới',
      'Tự động điểm danh, tế lễ, vấn đáp tông môn',
      'Tự động khoáng mạch (nhận khi đạt tối đa)',
      'Tự động hoang vực (không đổi ngũ hành)',
      'Tự động mở luận võ',
      'Tự động nhận rương phúc lợi',
      'Tự động thí luyện'
    ]
  },
  [LicenseType.BASIC]: {
    type: LicenseType.BASIC,
    accountLimit: 5,
    price: 50000,
    priority: 1,
    features: [
      'Giới hạn 5 tài khoản',
      'Tất cả tính năng của gói Free',
      'Đăng nhập bằng username/password',
      'Tự động đổ thạch thông minh',
      'Khoáng mạch chỉ nhận khi buff >= 100%',
      'Hoang vực tự đổi ngũ hành khi bị khắc',
      'Tự động nhận thưởng khi boss chết',
      'Tự động gửi luận võ cho người bật auto',
      'Tự động nhận mốc phúc lợi'
    ]
  },
  [LicenseType.PRO]: {
    type: LicenseType.PRO,
    accountLimit: 15,
    price: 100000,
    priority: 2,
    features: [
      'Giới hạn 15 tài khoản',
      'Tất cả tính năng gói Basic',
      'Tự động nhận code tân thủ',
      'Tự động chúc phúc & nhận lì xì tiệc cưới',
      'Khoáng mạch tự đoạt lại mỏ khi còn buff',
      'Tự động tối ưu ngũ hành cho hoang vực'
    ]
  }
};

export interface User {
  zaloId: string;
  licenseType: LicenseType;
  licenseExpired: Date | null;
  accountPlus: number;
  accountPlusExpired: Date | null;
}

export function isLicenseExpired(user: User): boolean {
  if (!user.licenseExpired) return false;
  return new Date() > user.licenseExpired;
}

export function isAccountPlusExpired(user: User): boolean {
  if (!user.accountPlusExpired) return false;
  return new Date() > user.accountPlusExpired;
}

export function getEffectiveLicenseType(user: User): LicenseType {
  if (isLicenseExpired(user)) {
    return LicenseType.FREE;
  }
  return user.licenseType;
}

export function getAccountLimit(user: User): number {
  const effectiveLicense = getEffectiveLicenseType(user);
  const baseLimit = LICENSE_CONFIGS[effectiveLicense].accountLimit;
  
  if (isAccountPlusExpired(user)) {
    return baseLimit;
  }
  
  return baseLimit + user.accountPlus;
}

export function canAccessFeature(user: User, feature: string): boolean {
  const effectiveLicense = getEffectiveLicenseType(user);
  const config = LICENSE_CONFIGS[effectiveLicense];
  return config.features.includes(feature);
}

export function hasHigherPriority(licenseA: LicenseType, licenseB: LicenseType): boolean {
  return LICENSE_CONFIGS[licenseA].priority > LICENSE_CONFIGS[licenseB].priority;
}

export function canUsernamePasswordLogin(user: User): boolean {
  const effectiveLicense = getEffectiveLicenseType(user);
  return effectiveLicense === LicenseType.BASIC || effectiveLicense === LicenseType.PRO;
}

export function canAutoSmartStone(user: User): boolean {
  const effectiveLicense = getEffectiveLicenseType(user);
  return effectiveLicense === LicenseType.BASIC || effectiveLicense === LicenseType.PRO;
}

export function canAutoElementChange(user: User): boolean {
  const effectiveLicense = getEffectiveLicenseType(user);
  return effectiveLicense === LicenseType.BASIC || effectiveLicense === LicenseType.PRO;
}

export function canAutoNewbieCode(user: User): boolean {
  const effectiveLicense = getEffectiveLicenseType(user);
  return effectiveLicense === LicenseType.PRO;
}

export function canAutoWeddingBless(user: User): boolean {
  const effectiveLicense = getEffectiveLicenseType(user);
  return effectiveLicense === LicenseType.PRO;
}

export function canAutoOptimizeElement(user: User): boolean {
  const effectiveLicense = getEffectiveLicenseType(user);
  return effectiveLicense === LicenseType.PRO;
}

export function getLicenseDescription(licenseType: LicenseType): string {
  const config = LICENSE_CONFIGS[licenseType];
  return `Gói ${licenseType} - ${config.accountLimit} tài khoản - ${config.price.toLocaleString('vi-VN')} VNĐ/tháng`;
}

export function formatLicenseExpiry(date: Date | null): string {
  if (!date) return 'Không giới hạn';
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getDaysUntilExpiry(date: Date | null): number {
  if (!date) return Infinity;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function shouldShowUpgradeNotification(user: User): boolean {
  const daysUntilExpiry = getDaysUntilExpiry(user.licenseExpired);
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
}

export function calculateAccountPlusDiscount(accountPlus: number): { freeAccounts: number; paidAccounts: number; totalPrice: number } {
  const freeAccounts = Math.floor(accountPlus / 10) * 2;
  const paidAccounts = accountPlus - freeAccounts;
  const totalPrice = paidAccounts * 10000;
  
  return {
    freeAccounts,
    paidAccounts,
    totalPrice
  };
}
