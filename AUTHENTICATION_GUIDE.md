# Backend Authentication Guide

## Overview

The ARDS backend uses JWT (JSON Web Token) based authentication with Supabase as the database. This guide explains how authentication works and how to test it.

## Architecture

### Components

1. **Supabase** - Database and user storage
2. **Express.js** - REST API server
3. **JWT** - Token-based authentication
4. **bcrypt** - Password hashing

### Authentication Flow

```
1. User submits email/password
   ↓
2. Backend validates credentials
   ↓
3. Password verified with bcrypt
   ↓
4. JWT token generated
   ↓
5. Token returned to frontend
   ↓
6. Frontend stores token in localStorage
   ↓
7. Token included in all API requests
```

## API Endpoints

### 1. User Registration
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@university.edu",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400):**
```json
{
  "message": "User already exists"
}
```

### 2. User Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@university.edu",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "message": "Invalid email or password"
}
```

## Testing Authentication

### Using cURL

#### Test Registration
```bash
curl -X POST http://localhost:5004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@university.edu",
    "password": "TestPassword123",
    "first_name": "Test",
    "last_name": "User",
    "role": "student"
  }'
```

#### Test Login
```bash
curl -X POST http://localhost:5004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@university.edu",
    "password": "TestPassword123"
  }'
```

### Using Postman

1. **Create new request**
   - Method: POST
   - URL: `http://localhost:5004/api/auth/login`

2. **Set Headers**
   - Content-Type: application/json

3. **Set Body (raw JSON)**
   ```json
   {
     "email": "test@university.edu",
     "password": "TestPassword123"
   }
   ```

4. **Send request**

### Using Frontend

1. Open `http://localhost:3000/`
2. Click "Login"
3. Enter credentials:
   - Email: `test@university.edu`
   - Password: `TestPassword123`
4. Click "Sign In"

## JWT Token Structure

The JWT token contains:
- **Header**: Algorithm (HS256)
- **Payload**: 
  - `id`: User ID
  - `email`: User email
  - `role`: User role (student, advisor, admin)
  - `iat`: Issued at timestamp
  - `exp`: Expiration timestamp (1 hour)
- **Signature**: Signed with JWT_SECRET

### Token Expiration
- **Duration**: 1 hour
- **After expiration**: User must login again

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

Required in `.env`:

```env
PORT=5004
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-key
```

## Security Features

1. **Password Hashing**: bcrypt with salt rounds = 10
2. **JWT Signing**: HS256 algorithm
3. **CORS**: Enabled for frontend communication
4. **Error Messages**: Generic messages to prevent user enumeration
5. **Token Expiration**: 1 hour validity

## Troubleshooting

### Issue: "Invalid email or password"
- **Cause**: User doesn't exist or password is wrong
- **Solution**: Check credentials, register if needed

### Issue: "User already exists"
- **Cause**: Email already registered
- **Solution**: Use different email or login instead

### Issue: Backend not responding
- **Cause**: Server not running
- **Solution**: Run `npm run dev` in ARDS_BACK directory

### Issue: CORS error
- **Cause**: Frontend and backend on different origins
- **Solution**: Ensure CORS is enabled (it is by default)

### Issue: Supabase connection failed
- **Cause**: Invalid credentials or network issue
- **Solution**: Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

## Test Credentials

Use these credentials to test:

```
Email: test@university.edu
Password: TestPassword123
Role: student
```

Or register new test users through the registration endpoint.

## Next Steps

1. ✅ Backend running on port 5004
2. ✅ Frontend configured for port 5004
3. ✅ Authentication endpoints working
4. Test login flow from frontend
5. Verify token is stored in localStorage
6. Test protected routes

---

**Last Updated**: January 26, 2026
**Status**: ✅ READY FOR TESTING
