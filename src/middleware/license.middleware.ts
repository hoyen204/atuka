import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveLicenseType, getAccountLimit, canAccessFeature, LICENSE_CONFIGS } from '@/lib/license.utils';
import { LicenseType } from '@prisma/client';

export interface LicenseValidationResult {
  isValid: boolean;
  reason?: string;
  redirectTo?: string;
  data?: any;
}

export async function validateLicense(
  request: NextRequest,
  requiredLicense?: LicenseType,
  requiredFeature?: string
): Promise<LicenseValidationResult> {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token?.zaloId) {
      return {
        isValid: false,
        reason: 'Authentication required',
        redirectTo: '/login'
      };
    }

    const user = await prisma.user.findUnique({
      where: { zaloId: token.zaloId as string }
    });

    if (!user) {
      return {
        isValid: false,
        reason: 'User not found',
        redirectTo: '/login'
      };
    }

    const effectiveLicense = getEffectiveLicenseType(user);

    if (requiredLicense) {
      const requiredPriority = LICENSE_CONFIGS[requiredLicense].priority;
      const userPriority = LICENSE_CONFIGS[effectiveLicense].priority;
      
      if (userPriority < requiredPriority) {
        return {
          isValid: false,
          reason: `Required license: ${requiredLicense}, current: ${effectiveLicense}`,
          redirectTo: '/dashboard/payment',
          data: {
            requiredLicense,
            currentLicense: effectiveLicense,
            upgradeRequired: true
          }
        };
      }
    }

    if (requiredFeature && !canAccessFeature(user, requiredFeature)) {
      return {
        isValid: false,
        reason: `Feature not available: ${requiredFeature}`,
        redirectTo: '/dashboard/payment',
        data: {
          requiredFeature,
          currentLicense: effectiveLicense,
          upgradeRequired: true
        }
      };
    }

    return {
      isValid: true,
      data: {
        user,
        effectiveLicense,
        accountLimit: getAccountLimit(user)
      }
    };

  } catch (error) {
    console.error('License validation error:', error);
    return {
      isValid: false,
      reason: 'Internal error during license validation'
    };
  }
}

export function createLicenseMiddleware(
  requiredLicense?: LicenseType,
  requiredFeature?: string
) {
  return async function licenseMiddleware(request: NextRequest) {
    const validation = await validateLicense(request, requiredLicense, requiredFeature);
    
    if (!validation.isValid) {
      if (validation.redirectTo) {
        const url = new URL(validation.redirectTo, request.url);
        if (validation.data?.upgradeRequired) {
          url.searchParams.set('upgrade', 'true');
          url.searchParams.set('reason', validation.reason || '');
        }
        return NextResponse.redirect(url);
      }
      
      return NextResponse.json(
        { 
          error: validation.reason || 'License validation failed',
          ...validation.data 
        }, 
        { status: 403 }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-User-License', validation.data?.effectiveLicense || '');
    response.headers.set('X-Account-Limit', validation.data?.accountLimit?.toString() || '');
    
    return response;
  };
}

export async function checkAccountLimit(userId: string): Promise<{ 
  isWithinLimit: boolean; 
  currentCount: number; 
  limit: number; 
  canAddMore: number;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { zaloId: userId },
      include: {
        accounts: {
          select: { id: true }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentCount = user.accounts.length;
    const limit = getAccountLimit(user);
    const canAddMore = Math.max(0, limit - currentCount);
    const isWithinLimit = currentCount < limit;

    return {
      isWithinLimit,
      currentCount,
      limit,
      canAddMore
    };

  } catch (error) {
    console.error('Account limit check error:', error);
    throw error;
  }
}

export function requireLicense(licenseType: LicenseType) {
  return createLicenseMiddleware(licenseType);
}

export function requireFeature(feature: string) {
  return createLicenseMiddleware(undefined, feature);
}

export function requireBasicLicense() {
  return createLicenseMiddleware(LicenseType.BASIC);
}

export function requireProLicense() {
  return createLicenseMiddleware(LicenseType.PRO);
}
