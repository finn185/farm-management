import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma';
import { config } from '../../config/env';
import { RegisterInput, LoginInput } from './auth.dto';

export class AuthService {
  /**
   * Tạo JWT token cho người dùng
   */
  private generateToken(user: { id: string; email: string; role: string; fullName: string }): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );
  }

  /**
   * Loại bỏ trường nhạy cảm passwordHash khỏi object trả về
   */
  private sanitizeUser(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Đăng ký tài khoản người dùng mới
   */
  async register(input: RegisterInput, ipAddress?: string) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existing) {
      const error: any = new Error('Email này đã được sử dụng. Vui lòng chọn email khác.');
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        role: input.role as any,
        isActive: true,
        auditLogs: {
          create: {
            action: 'USER_REGISTER',
            details: `Đăng ký tài khoản vai trò ${input.role}`,
            ipAddress
          }
        }
      }
    });

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Đăng nhập người dùng bằng email và mật khẩu
   */
  async login(input: LoginInput, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      const error: any = new Error('Tài khoản hoặc mật khẩu không chính xác');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error: any = new Error('Tài khoản đã bị tạm khóa. Vui lòng liên hệ Quản trị viên');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Tài khoản hoặc mật khẩu không chính xác');
      error.statusCode = 401;
      throw error;
    }

    // Cập nhật thời điểm đăng nhập gần nhất & ghi log
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        auditLogs: {
          create: {
            action: 'USER_LOGIN',
            details: 'Đăng nhập hệ thống thành công',
            ipAddress
          }
        }
      }
    });

    const token = this.generateToken(updatedUser);

    return {
      user: this.sanitizeUser(updatedUser),
      token
    };
  }

  /**
   * Lấy thông tin tài khoản hiện tại
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      const error: any = new Error('Không tìm thấy thông tin tài khoản');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * Cập nhật thông tin hồ sơ người dùng
   */
  async updateProfile(userId: string, input: { fullName?: string; phoneNumber?: string; avatarUrl?: string }, ipAddress?: string) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.fullName ? { fullName: input.fullName } : {}),
        ...(input.phoneNumber !== undefined ? { phoneNumber: input.phoneNumber } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        auditLogs: {
          create: {
            action: 'UPDATE_PROFILE',
            details: 'Cập nhật thông tin cá nhân',
            ipAddress
          }
        }
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return updated;
  }

  /**
   * Thay đổi mật khẩu người dùng
   */
  async changePassword(userId: string, oldPass: string, newPass: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      const error: any = new Error('Tài khoản không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Mật khẩu hiện tại không chính xác');
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPass, salt);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        auditLogs: {
          create: {
            action: 'CHANGE_PASSWORD',
            details: 'Thay đổi mật khẩu thành công',
            ipAddress
          }
        }
      }
    });

    return { message: 'Đổi mật khẩu thành công' };
  }
}

export const authService = new AuthService();
