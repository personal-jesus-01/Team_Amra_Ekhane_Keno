/**
 * User Repository
 *
 * Handles all database operations for users.
 * Extends BaseRepository with user-specific queries.
 */

import { eq, or } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { users } from '../../../shared/schema';
import type { User } from '../../../shared/schema';
import type { db } from '../../../server/db';

type Database = typeof db;

export class UserRepository extends BaseRepository<
  typeof users,
  User,
  typeof users.$inferInsert
> {
  constructor(db: Database) {
    super(db, users);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user by email');
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw new Error('Failed to find user by username');
    }
  }

  /**
   * Find user by Firebase UID
   */
  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.firebase_uid, firebaseUid))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by Firebase UID:', error);
      throw new Error('Failed to find user by Firebase UID');
    }
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(
          or(
            eq(users.email, identifier),
            eq(users.username, identifier)
          )
        )
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by email or username:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Update user credits
   */
  async updateCredits(userId: number, credits: number): Promise<User | null> {
    try {
      const result = await this.db
        .update(users)
        .set({ credits })
        .where(eq(users.id, userId))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error('Error updating user credits:', error);
      throw new Error('Failed to update credits');
    }
  }

  /**
   * Increment user credits
   */
  async incrementCredits(userId: number, amount: number): Promise<User | null> {
    try {
      const user = await this.findById(userId);
      if (!user) return null;

      const newCredits = (user.credits || 0) + amount;
      return await this.updateCredits(userId, newCredits);
    } catch (error) {
      console.error('Error incrementing user credits:', error);
      throw new Error('Failed to increment credits');
    }
  }

  /**
   * Decrement user credits
   */
  async decrementCredits(userId: number, amount: number): Promise<User | null> {
    try {
      const user = await this.findById(userId);
      if (!user) return null;

      const currentCredits = user.credits || 0;
      if (currentCredits < amount) {
        throw new Error('Insufficient credits');
      }

      const newCredits = currentCredits - amount;
      return await this.updateCredits(userId, newCredits);
    } catch (error) {
      console.error('Error decrementing user credits:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    userId: number,
    subscriptionType: 'free' | 'pro' | 'single_purchase',
    expiryDate?: Date
  ): Promise<User | null> {
    try {
      const result = await this.db
        .update(users)
        .set({
          subscription_type: subscriptionType,
          subscription_expiry: expiryDate || null
        })
        .where(eq(users.id, userId))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string, excludeUserId?: number): Promise<boolean> {
    try {
      const result = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (result.length === 0) return true;
      if (excludeUserId && result[0].id === excludeUserId) return true;

      return false;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  /**
   * Check if email is available
   */
  async isEmailAvailable(email: string, excludeUserId?: number): Promise<boolean> {
    try {
      const result = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (result.length === 0) return true;
      if (excludeUserId && result[0].id === excludeUserId) return true;

      return false;
    } catch (error) {
      console.error('Error checking email availability:', error);
      return false;
    }
  }
}
