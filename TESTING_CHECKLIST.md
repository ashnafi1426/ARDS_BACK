# Authentication Testing Checklist

## System Status

### Backend
- ✅ Running on port 5004
- ✅ Supabase connected
- ✅ Authentication endpoints available
- ✅ nodemon watching for changes

### Frontend
- ✅ Running on port 3000
- ✅ API URL configured for port 5004
- ✅ useAuth hook ready
- ✅ Login page ready

## Test Cases

### 1. Backend API Tests

#### Test 1.1: Health Check
- [ ] GET `http://localhost:5004/`
- [ ] Expected: "Academic Risk Detection System Backend is running..."
- [ ] Status: 200 OK

#### Test 1.2: User Registration
- [ ] POST `http://localhost:5004/api/auth/register`
- [ ] Body:
  ```json
  {
    "email": "newuser@test.edu",
    "password": "TestPass123",
    "first_name": "Test",
    "last_name": "User",
    "role": "student"
  }
  ```
- [ ] Expected: 201 Created with user and token
- [ ] Verify: Token is JWT format

#### Test 1.3: User Login
- [ ] POST `http://localhost:5004/api/auth/login`
- [ ] Body:
  ```json
  {
    "email": "newuser@test.edu",
    "password": "TestPass123"
  }
  ```
- [ ] Expected: 200 OK with user and token
- [ ] Verify: Token matches registration token

#### Test 1.4: Invalid Login
- [ ] POST `http://localhost:5004/api/auth/login`
- [ ] Body:
  ```json
  {
    "email": "newuser@test.edu",
    "password": "WrongPassword"
  }
  ```
- [ ] Expected: 401 Unauthorized
- [ ] Message: "Invalid email or password"

#### Test 1.5: Duplicate Registration
- [ ] POST `http://localhost:5004/api/auth/register` (same email as Test 1.2)
- [ ] Expected: 400 Bad Request
- [ ] Message: "User already exists"

### 2. Frontend Authentication Tests

#### Test 2.1: Login Page Load
- [ ] Navigate to `http://localhost:3000/login`
- [ ] Expected: Login form displays
- [ ] Elements visible:
  - [ ] Email input
  - [ ] Password input
  - [ ] Sign In button
  - [ ] Forgot password link

#### Test 2.2: Successful Login
- [ ] Enter email: `newuser@test.edu`
- [ ] Enter password: `TestPass123`
- [ ] Click "Sign In"
- [ ] Expected: Redirect to `/redirect`
- [ ] Verify: Token stored in localStorage
- [ ] Verify: User data stored in localStorage

#### Test 2.3: Failed Login
- [ ] Enter email: `newuser@test.edu`
- [ ] Enter password: `WrongPassword`
- [ ] Click "Sign In"
- [ ] Expected: Error message displays
- [ ] Message: "Invalid email or password"
- [ ] Verify: No redirect occurs

#### Test 2.4: Empty Fields
- [ ] Leave email empty
- [ ] Click "Sign In"
- [ ] Expected: Browser validation error
- [ ] Verify: Request not sent to backend

#### Test 2.5: Registration Page
- [ ] Navigate to `http://localhost:3000/register`
- [ ] Expected: Registration form displays
- [ ] Fill in all fields
- [ ] Click "Register"
- [ ] Expected: Redirect to `/redirect` or login

### 3. Token Management Tests

#### Test 3.1: Token Storage
- [ ] Login successfully
- [ ] Open browser DevTools (F12)
- [ ] Go to Application → Local Storage
- [ ] Expected: `user` key contains user data
- [ ] Expected: `token` key contains JWT

#### Test 3.2: Token in Requests
- [ ] Login successfully
- [ ] Open DevTools → Network tab
- [ ] Make any API request
- [ ] Check request headers
- [ ] Expected: `Authorization: Bearer <token>`

#### Test 3.3: Token Expiration
- [ ] Login successfully
- [ ] Wait 1 hour (or modify JWT_SECRET to test)
- [ ] Try to access protected route
- [ ] Expected: Redirect to login
- [ ] Verify: Token cleared from localStorage

### 4. Protected Routes Tests

#### Test 4.1: Student Dashboard Access
- [ ] Login as student
- [ ] Navigate to `/student/dashboard`
- [ ] Expected: Dashboard loads
- [ ] Verify: User data displays

#### Test 4.2: Advisor Dashboard Access
- [ ] Login as advisor
- [ ] Navigate to `/advisor/dashboard`
- [ ] Expected: Dashboard loads
- [ ] Verify: Advisor-specific content displays

#### Test 4.3: Admin Dashboard Access
- [ ] Login as admin
- [ ] Navigate to `/admin/dashboard`
- [ ] Expected: Dashboard loads
- [ ] Verify: Admin-specific content displays

#### Test 4.4: Unauthorized Access
- [ ] Logout
- [ ] Try to access `/student/dashboard`
- [ ] Expected: Redirect to `/login`
- [ ] Verify: No data exposed

#### Test 4.5: Role-Based Access
- [ ] Login as student
- [ ] Try to access `/admin/dashboard`
- [ ] Expected: Redirect to `/unauthorized` or login
- [ ] Verify: Access denied

### 5. Error Handling Tests

#### Test 5.1: Network Error
- [ ] Stop backend server
- [ ] Try to login
- [ ] Expected: Error message displays
- [ ] Message: Connection error

#### Test 5.2: Invalid JSON
- [ ] Send malformed JSON to `/api/auth/login`
- [ ] Expected: 400 Bad Request

#### Test 5.3: Missing Fields
- [ ] POST to `/api/auth/login` without password
- [ ] Expected: Error response

### 6. Security Tests

#### Test 6.1: Password Hashing
- [ ] Check database directly
- [ ] Verify: Passwords are hashed (not plain text)
- [ ] Verify: Different users have different hashes

#### Test 6.2: CORS
- [ ] Frontend can communicate with backend
- [ ] Expected: No CORS errors in console

#### Test 6.3: JWT Validation
- [ ] Modify token in localStorage
- [ ] Try to use modified token
- [ ] Expected: Request fails or redirects to login

## Test Results

### Backend Tests
- [ ] All API endpoints responding
- [ ] Supabase connection working
- [ ] Error handling working

### Frontend Tests
- [ ] Login page functional
- [ ] Registration working
- [ ] Token management working
- [ ] Protected routes working
- [ ] Error messages displaying

### Security Tests
- [ ] Passwords hashed
- [ ] CORS enabled
- [ ] JWT validation working
- [ ] Unauthorized access blocked

## Issues Found

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| | | | |

## Sign-Off

- [ ] All tests passed
- [ ] No critical issues
- [ ] Ready for production
- [ ] Date: ___________
- [ ] Tester: ___________

---

**Last Updated**: January 26, 2026
**Version**: 1.0.0
