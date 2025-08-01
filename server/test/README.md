# Testing with Clerk Authentication

This document outlines the improved testing setup for the HSA Songbook application, implementing Clerk's official testing recommendations.

## Overview

The testing setup uses proper Clerk testing patterns instead of basic mocking, providing:

- **Realistic auth simulation** with proper user roles and permissions
- **Fixed OTP codes** for email/phone testing (avoiding real messages)
- **Session token management** for authenticated API testing
- **Role-based testing** for admin, leader, and member users

## Key Files

- `server/test/clerk-helpers.ts` - Clerk testing utilities and mock generators
- `server/test/setup.ts` - Global test setup with Clerk mocks
- `server/routes/__tests__/songs.test.ts` - Example implementation

## Test Users

The system includes predefined test users with fixed OTP codes:

```typescript
const TEST_USERS = {
  REGULAR_USER: {
    email: 'test+clerk_test@example.com', // Fixed OTP: 424242
    phone: '+15555550100', // Fixed OTP: 424242
  },
  ADMIN_USER: {
    email: 'admin+clerk_test@example.com',
    phone: '+15555550101',
  },
  LEADER_USER: {
    email: 'leader+clerk_test@example.com', 
    phone: '+15555550102',
  }
}
```

## Usage Patterns

### 1. Testing Unauthenticated Endpoints

```typescript
it('returns public content for unauthenticated users', async () => {
  const response = await request(app)
    .get('/api/songs')
    .expect(200);
    
  // Only public songs should be returned
});
```

### 2. Testing Authenticated Endpoints

```typescript
import { createAuthHeader } from '../test/clerk-helpers.js';

it('allows authenticated users to access content', async () => {
  const response = await request(app)
    .get('/api/songs/private-song')
    .set(createAuthHeader('REGULAR_USER'))
    .expect(200);
});
```

### 3. Testing Role-Based Authorization

```typescript
it('restricts admin-only endpoints', async () => {
  // Regular user should be denied
  await request(app)
    .post('/api/admin/users')
    .set(createAuthHeader('REGULAR_USER'))
    .expect(403);

  // Admin user should succeed  
  await request(app)
    .post('/api/admin/users')
    .set(createAuthHeader('ADMIN_USER'))
    .expect(201);
});
```

### 4. Testing User Ownership

```typescript
it('allows users to access their own content', async () => {
  const privateSong = await Song.create({
    title: 'My Private Song',
    metadata: { 
      isPublic: false,
      createdBy: MOCK_USER_IDS.REGULAR_USER 
    }
  });

  // Owner can access
  await request(app)
    .get(`/api/songs/${privateSong.slug}`)
    .set(createAuthHeader('REGULAR_USER'))
    .expect(200);

  // Others cannot
  await request(app)
    .get(`/api/songs/${privateSong.slug}`)
    .set(createAuthHeader('LEADER_USER'))
    .expect(404);
});
```

## Advanced Features

### Dynamic Auth State Changes

For tests that need to change authentication state:

```typescript
import { clerkMocks } from '../test/setup.js';

it('handles auth state changes', async () => {
  // Start unauthenticated
  clerkMocks.clearAuth();
  await request(app).get('/api/protected').expect(401);
  
  // Switch to authenticated
  clerkMocks.setAuthState('REGULAR_USER');
  await request(app).get('/api/protected').expect(200);
});
```

### Testing Session Tokens

The system provides realistic session token simulation:

```typescript
// Session tokens are automatically managed
const headers = createAuthHeader('ADMIN_USER');
// Includes: Authorization: Bearer sess_test_admin_user_token_456
```

## Environment Setup

Test environment variables are configured in `.env.test`:

```env
NODE_ENV=test
CLERK_PUBLISHABLE_KEY=pk_test_mock_key_for_testing
CLERK_SECRET_KEY=sk_test_mock_secret_key_for_testing
MONGODB_URI=mongodb://localhost:27017/hsa-songbook-test
```

## Benefits Over Basic Mocking

1. **Realistic Behavior**: Matches production auth flow patterns
2. **Role Testing**: Proper simulation of admin/leader/member roles
3. **Session Management**: Includes token expiration and refresh patterns  
4. **Fixed OTP Codes**: No real emails/SMS sent during testing
5. **Bot Detection Bypass**: Ready for testing token integration
6. **Ownership Testing**: Proper user-content relationship validation

## Future Enhancements

### Testing Tokens (For E2E Tests)

When implementing E2E tests, add Testing Token support:

```typescript
// Future implementation for bot detection bypass
const testingToken = await getTestingToken();
const url = `/api/endpoint?__clerk_testing_token=${testingToken}`;
```

### Integration with Playwright/Cypress

The current setup is ready for integration with Clerk's official Playwright and Cypress plugins when E2E testing is added.

## Running Tests

```bash
# Run all tests
npm test

# Run server tests only  
npm test server/

# Run with coverage
npm run test:coverage
```

This testing approach ensures robust authentication testing while maintaining fast test execution and avoiding external service dependencies.