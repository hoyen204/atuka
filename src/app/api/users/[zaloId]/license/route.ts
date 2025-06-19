import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';
import { UpdateUserLicenseRequest, UpdateUserLicenseResponse, UserDTO, LicenseType } from '@/models/types';

function toUserDTO(user: any): UserDTO {
  return {
    zaloId: user.zaloId,
    name: user.name,
    email: user.email,
    licenseType: user.licenseType,
    licenseExpired: user.licenseExpired ? user.licenseExpired.toISOString() : null,
    banned: user.banned,
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { zaloId: string } }
): Promise<NextResponse<UpdateUserLicenseResponse>> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check if user is admin
  if (!session.user?.is_admin) {
    return NextResponse.json(
      { success: false, message: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { zaloId } = params;
    const body: UpdateUserLicenseRequest = await request.json();
    const { licenseType, licenseExpired } = body;

    if (!licenseType || !['FREE', 'BASIC', 'PRO'].includes(licenseType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid license type' },
        { status: 400 }
      );
    }

    const licenseExpiredDate = licenseExpired ? new Date(licenseExpired) : undefined;

    const updatedUser = await DatabaseService.updateUserLicense(
      zaloId,
      licenseType as LicenseType,
      licenseExpiredDate
    );

    return NextResponse.json({
      success: true,
      message: 'License updated successfully',
      user: toUserDTO(updatedUser),
    });
  } catch (error) {
    console.error('Error updating user license:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update license' },
      { status: 500 }
    );
  }
} 