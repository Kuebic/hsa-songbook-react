import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { handleClerkWebhook } from '../clerk';
import { User } from '../../../models/User';
import { Role, ClerkWebhookEvent } from '../../../types/auth';

// Mock dependencies
vi.mock('svix', () => ({
  Webhook: vi.fn()
}));

vi.mock('../../../models/User', () => ({
  User: {
    findOne: vi.fn(),
    prototype: {
      save: vi.fn()
    }
  }
}));

import { Webhook } from 'svix';

describe('Clerk Webhook Handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockWebhook: any;
  let mockUser: any;

  beforeEach(() => {
    mockRequest = {
      body: {},
      headers: {
        'svix-id': 'msg_123',
        'svix-timestamp': '1234567890',
        'svix-signature': 'v1,signature'
      }
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    mockWebhook = {
      verify: vi.fn()
    };
    (Webhook as any).mockImplementation(() => mockWebhook);

    mockUser = {
      save: vi.fn(),
      clerkId: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      role: Role.USER,
      isActive: true
    };

    // Set up environment variable
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test_secret';
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.CLERK_WEBHOOK_SECRET;
  });

  describe('Configuration', () => {
    it('should return 500 when webhook secret is not configured', async () => {
      delete process.env.CLERK_WEBHOOK_SECRET;

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Webhook secret not configured'
      });
    });

    it('should return 400 when webhook verification fails', async () => {
      mockWebhook.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Webhook signature verification failed'
      });
    });
  });

  describe('user.created event', () => {
    const mockUserData = {
      id: 'clerk_user_123',
      email_addresses: [
        {
          email_address: 'test@example.com',
          verification: { status: 'verified' }
        }
      ],
      first_name: 'Test',
      last_name: 'User',
      created_at: 1234567890000
    };

    beforeEach(() => {
      mockWebhook.verify.mockReturnValue({
        type: ClerkWebhookEvent.USER_CREATED,
        data: mockUserData
      });
    });

    it('should create a new user when user.created event is received', async () => {
      (User.findOne as any).mockResolvedValue(null);
      
      const mockNewUser = {
        ...mockUser,
        save: vi.fn().mockResolvedValue(undefined)
      };
      (User as any).mockImplementation(() => mockNewUser);

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(User.findOne).toHaveBeenCalledWith({ clerkId: 'clerk_user_123' });
      expect(mockNewUser.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it('should not create user if user already exists', async () => {
      (User.findOne as any).mockResolvedValue(mockUser);

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(User.findOne).toHaveBeenCalledWith({ clerkId: 'clerk_user_123' });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle user creation with unverified email', async () => {
      const userDataWithUnverifiedEmail = {
        ...mockUserData,
        email_addresses: [
          {
            email_address: 'test@example.com',
            verification: { status: 'unverified' }
          }
        ]
      };

      mockWebhook.verify.mockReturnValue({
        type: ClerkWebhookEvent.USER_CREATED,
        data: userDataWithUnverifiedEmail
      });

      (User.findOne as any).mockResolvedValue(null);
      
      const mockNewUser = {
        ...mockUser,
        save: vi.fn().mockResolvedValue(undefined)
      };
      (User as any).mockImplementation(() => mockNewUser);

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockNewUser.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle user creation with only first name', async () => {
      const userDataWithOnlyFirstName = {
        ...mockUserData,
        first_name: 'Test',
        last_name: undefined
      };

      mockWebhook.verify.mockReturnValue({
        type: ClerkWebhookEvent.USER_CREATED,
        data: userDataWithOnlyFirstName
      });

      (User.findOne as any).mockResolvedValue(null);
      
      const mockNewUser = {
        ...mockUser,
        save: vi.fn().mockResolvedValue(undefined)
      };
      (User as any).mockImplementation(() => mockNewUser);

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockNewUser.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle user creation with username fallback', async () => {
      const userDataWithUsername = {
        ...mockUserData,
        first_name: undefined,
        last_name: undefined,
        username: 'testuser'
      };

      mockWebhook.verify.mockReturnValue({
        type: ClerkWebhookEvent.USER_CREATED,
        data: userDataWithUsername
      });

      (User.findOne as any).mockResolvedValue(null);
      
      const mockNewUser = {
        ...mockUser,
        save: vi.fn().mockResolvedValue(undefined)
      };
      (User as any).mockImplementation(() => mockNewUser);

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockNewUser.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('user.updated event', () => {
    const mockUserData = {
      id: 'clerk_user_123',
      email_addresses: [
        {
          email_address: 'updated@example.com',
          verification: { status: 'verified' }
        }
      ],
      first_name: 'Updated',
      last_name: 'User'
    };

    beforeEach(() => {
      mockWebhook.verify.mockReturnValue({
        type: ClerkWebhookEvent.USER_UPDATED,
        data: mockUserData
      });
    });

    it('should update existing user when user.updated event is received', async () => {
      mockUser.save = vi.fn().mockResolvedValue(undefined);
      (User.findOne as any).mockResolvedValue(mockUser);

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(User.findOne).toHaveBeenCalledWith({ clerkId: 'clerk_user_123' });
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle update when user is not found', async () => {
      (User.findOne as any).mockResolvedValue(null);

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(User.findOne).toHaveBeenCalledWith({ clerkId: 'clerk_user_123' });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('user.deleted event', () => {
    const mockUserData = {
      id: 'clerk_user_123'
    };

    beforeEach(() => {
      mockWebhook.verify.mockReturnValue({
        type: ClerkWebhookEvent.USER_DELETED,
        data: mockUserData
      });
    });

    it('should soft delete user when user.deleted event is received', async () => {
      mockUser.save = vi.fn().mockResolvedValue(undefined);
      (User.findOne as any).mockResolvedValue(mockUser);

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(User.findOne).toHaveBeenCalledWith({ clerkId: 'clerk_user_123' });
      expect(mockUser.isActive).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle deletion when user is not found', async () => {
      (User.findOne as any).mockResolvedValue(null);

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(User.findOne).toHaveBeenCalledWith({ clerkId: 'clerk_user_123' });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('Unhandled events', () => {
    it('should handle unknown webhook events gracefully', async () => {
      mockWebhook.verify.mockReturnValue({
        type: 'unknown.event',
        data: {}
      });

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors during user creation', async () => {
      const mockUserData = {
        id: 'clerk_user_123',
        email_addresses: [
          {
            email_address: 'test@example.com',
            verification: { status: 'verified' }
          }
        ],
        first_name: 'Test',
        last_name: 'User',
        created_at: 1234567890000
      };

      mockWebhook.verify.mockReturnValue({
        type: ClerkWebhookEvent.USER_CREATED,
        data: mockUserData
      });

      (User.findOne as any).mockResolvedValue(null);
      (User as any).mockImplementation(() => ({
        save: vi.fn().mockRejectedValue(new Error('Database error'))
      }));

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle database errors during user update', async () => {
      const mockUserData = {
        id: 'clerk_user_123',
        email_addresses: [
          {
            email_address: 'updated@example.com',
            verification: { status: 'verified' }
          }
        ],
        first_name: 'Updated',
        last_name: 'User'
      };

      mockWebhook.verify.mockReturnValue({
        type: ClerkWebhookEvent.USER_UPDATED,
        data: mockUserData
      });

      mockUser.save = vi.fn().mockRejectedValue(new Error('Database error'));
      (User.findOne as any).mockResolvedValue(mockUser);

      await handleClerkWebhook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });
  });
});