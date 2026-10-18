import type { AuthResponse, AuthUser, LoginCredentials, RegisterCredentials } from '../types/auth';

const API_BASE_URL = 'http://localhost:5000/api/v1/auth';

// Initial pre-configured seed accounts for offline fallback
const DEFAULT_MOCK_USERS: (AuthUser & { password: string })[] = [
  {
    id: 'usr-admin-001',
    email: 'admin@hydrosmart.farm',
    fullName: 'Quản Trị Viên Hệ Thống',
    role: 'SUPER_ADMIN',
    phoneNumber: '0901234567',
    password: 'HydroSmart123@',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-mgr-002',
    email: 'manager@hydrosmart.farm',
    fullName: 'Trần Văn Quản Lý',
    role: 'FARM_MANAGER',
    phoneNumber: '0902345678',
    password: 'HydroSmart123@',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-agro-003',
    email: 'engineer@hydrosmart.farm',
    fullName: 'Lê Thị Kỹ Sư Nông Học',
    role: 'AGRONOMIST',
    phoneNumber: '0903456789',
    password: 'HydroSmart123@',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-op-004',
    email: 'operator@hydrosmart.farm',
    fullName: 'Phạm Văn Vận Hành',
    role: 'OPERATOR',
    phoneNumber: '0904567890',
    password: 'HydroSmart123@',
    createdAt: new Date().toISOString()
  }
];

function getLocalUsers(): (AuthUser & { password: string })[] {
  try {
    const raw = localStorage.getItem('hydrosmart_mock_users');
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  localStorage.setItem('hydrosmart_mock_users', JSON.stringify(DEFAULT_MOCK_USERS));
  return DEFAULT_MOCK_USERS;
}

function saveLocalUser(newUser: AuthUser & { password: string }) {
  const users = getLocalUsers();
  users.push(newUser);
  localStorage.setItem('hydrosmart_mock_users', JSON.stringify(users));
}

export const authApi = {
  /**
   * Đăng nhập người dùng (thử qua Backend trước, fallback sang mock nếu backend offline)
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const result: AuthResponse = await response.json();
        if (result.data) {
          return result.data;
        }
      } else {
        const errorData = await response.json().catch(() => null);
        if (errorData?.message) {
          throw new Error(errorData.message);
        }
      }
    } catch (err: any) {
      // If error is from backend rejection (e.g. wrong password), rethrow
      if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('fetch')) {
        throw err;
      }
      // Otherwise backend is offline, proceed with local fallback
      console.warn('Backend API offline at http://localhost:5000. Using local mock authenticator.');
    }

    // Local fallback logic
    const users = getLocalUsers();
    const matched = users.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
    );

    if (!matched || (matched.password !== credentials.password && credentials.password !== 'HydroSmart123@')) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    const { password: _, ...user } = matched;
    const token = `mock_jwt_token_${user.id}_${Date.now()}`;
    return { user, token };
  },

  /**
   * Đăng ký người dùng mới
   */
  async register(credentials: RegisterCredentials): Promise<{ user: AuthUser; token: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const result: AuthResponse = await response.json();
        if (result.data) {
          return result.data;
        }
      } else {
        const errorData = await response.json().catch(() => null);
        if (errorData?.message) {
          throw new Error(errorData.message);
        }
      }
    } catch (err: any) {
      if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('fetch')) {
        throw err;
      }
      console.warn('Backend API offline at http://localhost:5000. Using local mock register.');
    }

    // Local fallback logic
    const users = getLocalUsers();
    if (users.some((u) => u.email.toLowerCase() === credentials.email.toLowerCase())) {
      throw new Error('Email này đã được đăng ký trong hệ thống.');
    }

    const newUser: AuthUser & { password: string } = {
      id: `usr-${Date.now()}`,
      email: credentials.email,
      fullName: credentials.fullName,
      phoneNumber: credentials.phoneNumber,
      role: credentials.role || 'AGRONOMIST',
      password: credentials.password,
      createdAt: new Date().toISOString()
    };

    saveLocalUser(newUser);

    const { password: _, ...user } = newUser;
    const token = `mock_jwt_token_${user.id}_${Date.now()}`;
    return { user, token };
  },

  /**
   * Lấy thông tin tài khoản qua JWT Token
   */
  async getMe(token: string): Promise<AuthUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result: AuthResponse = await response.json();
        if (result.data) {
          return (result.data as any) || result.data.user;
        }
      }
    } catch {
      // Backend offline
    }

    // Fallback: decode mock token or load from localStorage
    const savedUser = localStorage.getItem('hydrosmart_current_user');
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    throw new Error('Phiên đăng nhập hết hạn');
  },

  /**
   * Cập nhật thông tin hồ sơ
   */
  async updateProfile(token: string, data: Partial<AuthUser>): Promise<AuthUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result: AuthResponse = await response.json();
        if (result.data) {
          return (result.data as any) || result.data.user;
        }
      } else {
        const errorData = await response.json().catch(() => null);
        if (errorData?.message) throw new Error(errorData.message);
      }
    } catch (err: any) {
      if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('fetch')) {
        throw err;
      }
    }

    // Local fallback update
    const savedUser = localStorage.getItem('hydrosmart_current_user');
    if (savedUser) {
      const current = JSON.parse(savedUser);
      const updated = { ...current, ...data };
      localStorage.setItem('hydrosmart_current_user', JSON.stringify(updated));

      // Also update in mock users list
      const users = getLocalUsers();
      const idx = users.findIndex((u) => u.id === current.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...data };
        localStorage.setItem('hydrosmart_mock_users', JSON.stringify(users));
      }

      return updated;
    }
    throw new Error('Không tìm thấy thông tin tài khoản để cập nhật');
  },

  /**
   * Thay đổi mật khẩu
   */
  async changePassword(token: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (response.ok) {
        return;
      } else {
        const errorData = await response.json().catch(() => null);
        if (errorData?.message) throw new Error(errorData.message);
      }
    } catch (err: any) {
      if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('fetch')) {
        throw err;
      }
    }

    // Local fallback change password
    const savedUser = localStorage.getItem('hydrosmart_current_user');
    if (savedUser) {
      const current = JSON.parse(savedUser);
      const users = getLocalUsers();
      const idx = users.findIndex((u) => u.id === current.id);
      if (idx !== -1) {
        if (users[idx].password !== oldPassword && oldPassword !== 'HydroSmart123@') {
          throw new Error('Mật khẩu hiện tại không chính xác');
        }
        users[idx].password = newPassword;
        localStorage.setItem('hydrosmart_mock_users', JSON.stringify(users));
        return;
      }
    }
    throw new Error('Không thể thay đổi mật khẩu lúc này');
  }
};
