# HydroSmart Backend Service
> Node.js (TypeScript) + Express + Prisma ORM + PostgreSQL (Docker)

## 📌 Tổng Quan
Module Backend quản lý xác thực người dùng (Authentication & Authorization) và nghiệp vụ trang trại thủy canh thông minh:
- **Ngôn ngữ & Runtime**: Node.js v24+, TypeScript
- **Web Framework**: Express.js
- **ORM**: Prisma Client v5
- **Cơ sở dữ liệu**: PostgreSQL 16 (chạy qua Docker Container)
- **Bảo mật**: Mã hóa mật khẩu bcrypt (salt rounds = 10), JSON Web Token (JWT)

---

## 🚀 Hướng Dẫn Khởi Chạy Từng Bước

### Bước 1: Khởi động PostgreSQL qua Docker
Mở Docker Desktop trên máy hoặc chạy lệnh sau từ thư mục `backend/`:
```bash
# Khởi động PostgreSQL 16 container ở chế độ chạy ngầm (-d)
docker-compose up -d
```
> **Lưu ý**: Đảm bảo Docker Desktop đã được bật. Container PostgreSQL sẽ chạy trên cổng `5432` với:
> - User: `postgres`
> - Password: `postgrespassword`
> - Database: `hydrosmart`

### Bước 2: Đồng bộ cấu trúc Database (Prisma Migration / Push)
Khi PostgreSQL đã sẵn sàng nhận kết nối tại cổng 5432:
```bash
# Đẩy schema Prisma vào PostgreSQL
npm run prisma:push

# (Tùy chọn) Sinh lại types Prisma Client nếu có thay đổi schema
npm run prisma:generate
```

### Bước 3: Khởi chạy Backend Server
```bash
# Chế độ phát triển (Hot-reload với TSX)
npm run dev

# Hoặc đóng gói & chạy production
npm run build
npm start
```
Server sẽ lắng nghe tại cổng `http://localhost:5000`.

---

## 📡 Danh Sách API Xác Thực (Auth Endpoints)

| Phương thức | Đường dẫn (URL) | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/health` | Public | Kiểm tra trạng thái hoạt động của server |
| `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản người dùng mới |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập hệ thống & nhận JWT Token |
| `GET` | `/api/v1/auth/me` | Bearer Token | Lấy thông tin tài khoản đang đăng nhập |

### Chi tiết Request / Response:

#### 1. Đăng ký (`POST /api/v1/auth/register`)
**Request Body**:
```json
{
  "email": "engineer@hydrosmart.farm",
  "password": "Password123@",
  "fullName": "Nguyễn Văn Kỹ Sư",
  "phoneNumber": "0987654321",
  "role": "AGRONOMIST"
}
```
*Các vai trò hỗ trợ (`role`): `SUPER_ADMIN`, `FARM_MANAGER`, `AGRONOMIST`, `OPERATOR`*

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "user": {
      "id": "uuid-v4-string",
      "email": "engineer@hydrosmart.farm",
      "fullName": "Nguyễn Văn Kỹ Sư",
      "phoneNumber": "0987654321",
      "role": "AGRONOMIST",
      "isActive": true,
      "createdAt": "2026-10-18T...",
      "updatedAt": "2026-10-18T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Đăng nhập (`POST /api/v1/auth/login`)
**Request Body**:
```json
{
  "email": "engineer@hydrosmart.farm",
  "password": "Password123@"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "uuid-v4-string",
      "email": "engineer@hydrosmart.farm",
      "fullName": "Nguyễn Văn Kỹ Sư",
      "role": "AGRONOMIST",
      "isActive": true,
      "lastLoginAt": "2026-10-18T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Thông tin cá nhân (`GET /api/v1/auth/me`)
**Header**:
```text
Authorization: Bearer <your_jwt_token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Lấy thông tin tài khoản thành công",
  "data": {
    "id": "uuid-v4-string",
    "email": "engineer@hydrosmart.farm",
    "fullName": "Nguyễn Văn Kỹ Sư",
    "phoneNumber": "0987654321",
    "role": "AGRONOMIST",
    "isActive": true,
    "lastLoginAt": "2026-10-18T...",
    "createdAt": "2026-10-18T..."
  }
}
```
