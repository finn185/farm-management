import { z } from 'zod';

export const RoleEnum = z.enum([
  'SUPER_ADMIN',
  'FARM_MANAGER',
  'AGRONOMIST',
  'OPERATOR'
]);

export const RegisterSchema = z.object({
  email: z
    .string({ required_error: 'Vui lòng nhập email' })
    .email('Định dạng email không hợp lệ')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Vui lòng nhập mật khẩu' })
    .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
  fullName: z
    .string({ required_error: 'Vui lòng nhập họ và tên' })
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .trim(),
  phoneNumber: z.string().optional(),
  role: RoleEnum.optional().default('AGRONOMIST')
});

export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Vui lòng nhập email' })
    .email('Định dạng email không hợp lệ')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Vui lòng nhập mật khẩu' })
    .min(1, 'Vui lòng nhập mật khẩu')
});

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự').trim().optional(),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().optional()
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
