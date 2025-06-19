import bcrypt from 'bcrypt';

export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  static async hash(plainPassword: string): Promise<string> {
    try {
      return await bcrypt.hash(plainPassword, this.SALT_ROUNDS);
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Failed to hash password');
    }
  }

  static async verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      throw new Error('Failed to verify password');
    }
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!password) {
      errors.push('Mật khẩu không được để trống');
    }

    if (password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }

    if (password.length > 128) {
      errors.push('Mật khẩu không được quá 128 ký tự');
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một chữ cái');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một số');
    }

    const commonPasswords = [
      '123456', 'password', '12345678', 'qwerty', '123456789',
      'letmein', '1234567', 'football', 'iloveyou', 'admin',
      'welcome', 'monkey', 'login', 'abc123', 'starwars',
      '123123', 'dragon', 'passw0rd', 'master', 'hello'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Mật khẩu này quá phổ biến và không an toàn');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static generateStrongPassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  static getPasswordStrength(password: string): {
    score: number;
    level: 'weak' | 'fair' | 'good' | 'strong';
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Tăng độ dài lên ít nhất 8 ký tự');
    }

    if (password.length >= 12) {
      score += 1;
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Thêm chữ cái thường');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Thêm chữ cái hoa');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Thêm số');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Thêm ký tự đặc biệt');
    }

    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Tránh lặp lại ký tự');
    }

    const level = score <= 2 ? 'weak' : 
                 score <= 3 ? 'fair' : 
                 score <= 4 ? 'good' : 'strong';

    return { score, level, feedback };
  }
}

export const createTestUser = async (userData: {
  name: string;
  email?: string;
  zalo_id?: string;
  plainPassword: string;
}) => {
  const hashedPassword = await PasswordUtils.hash(userData.plainPassword);
  
  return {
    name: userData.name,
    email: userData.email,
    zalo_id: userData.zalo_id || `test_${Date.now()}`,
    password: hashedPassword,
    license_type: 'FREE' as const,
    is_admin: false,
    is_subscribed: false,
    account_plus: 0,
    can_takeover: false,
    banned: false,
  };
}; 