import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { User } from '../../models/User';
import { Role, ClerkWebhookEvent, ClerkWebhookPayload, ClerkUserData } from '../../types/auth';

/**
 * Clerk webhook handler for user synchronization
 * Handles user.created, user.updated, and user.deleted events
 */
export async function handleClerkWebhook(req: Request, res: Response) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    const payload = wh.verify(
      JSON.stringify(req.body),
      req.headers as Record<string, string>
    ) as ClerkWebhookPayload;

    const { type, data } = payload;

    switch (type) {
      case ClerkWebhookEvent.USER_CREATED:
        await handleUserCreated(data);
        break;
      
      case ClerkWebhookEvent.USER_UPDATED:
        await handleUserUpdated(data);
        break;
      
      case ClerkWebhookEvent.USER_DELETED:
        await handleUserDeleted(data);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
}

/**
 * Handle user creation from Clerk
 */
async function handleUserCreated(userData: ClerkUserData) {
  try {
    const primaryEmail = userData.email_addresses.find(
      email => email.verification.status === 'verified'
    )?.email_address || userData.email_addresses[0]?.email_address;

    if (!primaryEmail) {
      console.error('No email found for user:', userData.id);
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: userData.id });
    if (existingUser) {
      console.log('User already exists:', userData.id);
      return;
    }

    // Create new user
    const newUser = new User({
      clerkId: userData.id,
      email: primaryEmail,
      name: getDisplayName(userData),
      role: Role.USER,
      preferences: {
        theme: 'light',
        fontSize: 16
      },
      profile: {
        bio: '',
        website: '',
        location: ''
      },
      stats: {
        songsCreated: 0,
        arrangementsCreated: 0,
        setlistsCreated: 0
      },
      isActive: true,
      lastLoginAt: new Date(userData.created_at)
    });

    await newUser.save();
    console.log('User created successfully:', userData.id);
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

/**
 * Handle user updates from Clerk
 */
async function handleUserUpdated(userData: ClerkUserData) {
  try {
    const user = await User.findOne({ clerkId: userData.id });
    if (!user) {
      console.error('User not found for update:', userData.id);
      return;
    }

    const primaryEmail = userData.email_addresses.find(
      email => email.verification.status === 'verified'
    )?.email_address || userData.email_addresses[0]?.email_address;

    if (primaryEmail) {
      user.email = primaryEmail;
    }

    user.name = getDisplayName(userData);
    user.lastLoginAt = new Date();

    await user.save();
    console.log('User updated successfully:', userData.id);
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

/**
 * Handle user deletion from Clerk
 */
async function handleUserDeleted(userData: ClerkUserData) {
  try {
    const user = await User.findOne({ clerkId: userData.id });
    if (!user) {
      console.log('User not found for deletion:', userData.id);
      return;
    }

    // Soft delete - mark as inactive instead of removing
    user.isActive = false;
    await user.save();
    
    console.log('User marked as inactive:', userData.id);
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

/**
 * Extract display name from Clerk user data
 */
function getDisplayName(userData: ClerkUserData): string {
  if (userData.first_name && userData.last_name) {
    return `${userData.first_name} ${userData.last_name}`.trim();
  }
  
  if (userData.first_name) {
    return userData.first_name;
  }
  
  if (userData.username) {
    return userData.username;
  }
  
  // Fallback to email prefix
  const primaryEmail = userData.email_addresses[0]?.email_address;
  if (primaryEmail) {
    return primaryEmail.split('@')[0];
  }
  
  return 'Anonymous User';
}