/**
 * Collaboration Repository - NEW FEATURE
 *
 * Manages real-time collaboration tracking for presentations.
 * Tracks active users, their status, and collaboration events.
 */

import { eq, and, desc, inArray } from 'drizzle-orm';
import { collaborators, users, presentations } from '../../../shared/schema';
import { BaseRepository } from './base.repository';
import type { db } from '../../../server/db';

type Database = typeof db;

export interface ActiveUser {
  userId: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'viewer' | 'editor' | 'owner';
  status: 'online' | 'idle' | 'offline';
  lastActivity: Date;
  currentSlide?: number;
}

export interface CollaborationEvent {
  type: 'join' | 'leave' | 'edit' | 'view' | 'slide_change';
  userId: number;
  username: string;
  presentationId: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PresentationCollaborators {
  presentationId: number;
  title: string;
  activeUsers: ActiveUser[];
  totalCollaborators: number;
}

export class CollaborationRepository extends BaseRepository<
  typeof collaborators,
  typeof collaborators.$inferSelect,
  typeof collaborators.$inferInsert
> {
  constructor(db: Database) {
    super(db, collaborators);
  }

  /**
   * Get all collaborators for a presentation with user details
   */
  async getPresentationCollaborators(presentationId: number): Promise<PresentationCollaborators | null> {
    try {
      // Get presentation info
      const presentation = await this.db
        .select({
          id: presentations.id,
          title: presentations.title
        })
        .from(presentations)
        .where(eq(presentations.id, presentationId))
        .limit(1);

      if (!presentation.length) return null;

      // Get all collaborators with user details
      const collaboratorData = await this.db
        .select({
          userId: users.id,
          username: users.username,
          name: users.name,
          avatarUrl: users.avatar_url,
          role: collaborators.role
        })
        .from(collaborators)
        .innerJoin(users, eq(collaborators.user_id, users.id))
        .where(eq(collaborators.presentation_id, presentationId));

      return {
        presentationId: presentation[0].id,
        title: presentation[0].title,
        activeUsers: collaboratorData.map(c => ({
          userId: c.userId,
          username: c.username,
          name: c.name,
          avatarUrl: c.avatarUrl,
          role: c.role,
          status: 'offline' as const, // Default, will be updated by WebSocket
          lastActivity: new Date()
        })),
        totalCollaborators: collaboratorData.length
      };
    } catch (error) {
      console.error('Error fetching presentation collaborators:', error);
      throw new Error('Failed to fetch presentation collaborators');
    }
  }

  /**
   * Add a collaborator to a presentation
   */
  async addCollaborator(
    presentationId: number,
    userId: number,
    role: 'viewer' | 'editor' | 'owner'
  ): Promise<typeof collaborators.$inferSelect> {
    try {
      // Check if already exists
      const existing = await this.db
        .select()
        .from(collaborators)
        .where(
          and(
            eq(collaborators.presentation_id, presentationId),
            eq(collaborators.user_id, userId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update role if exists
        const updated = await this.db
          .update(collaborators)
          .set({ role })
          .where(eq(collaborators.id, existing[0].id))
          .returning();
        return updated[0];
      }

      // Create new collaborator
      const result = await this.db
        .insert(collaborators)
        .values({
          presentation_id: presentationId,
          user_id: userId,
          role
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw new Error('Failed to add collaborator');
    }
  }

  /**
   * Remove a collaborator from a presentation
   */
  async removeCollaborator(presentationId: number, userId: number): Promise<boolean> {
    try {
      await this.db
        .delete(collaborators)
        .where(
          and(
            eq(collaborators.presentation_id, presentationId),
            eq(collaborators.user_id, userId)
          )
        );
      return true;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw new Error('Failed to remove collaborator');
    }
  }

  /**
   * Update collaborator role
   */
  async updateCollaboratorRole(
    presentationId: number,
    userId: number,
    role: 'viewer' | 'editor' | 'owner'
  ): Promise<typeof collaborators.$inferSelect | null> {
    try {
      const result = await this.db
        .update(collaborators)
        .set({ role })
        .where(
          and(
            eq(collaborators.presentation_id, presentationId),
            eq(collaborators.user_id, userId)
          )
        )
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error('Error updating collaborator role:', error);
      throw new Error('Failed to update collaborator role');
    }
  }

  /**
   * Check if user has access to presentation
   */
  async hasAccess(presentationId: number, userId: number): Promise<boolean> {
    try {
      const result = await this.db
        .select()
        .from(collaborators)
        .where(
          and(
            eq(collaborators.presentation_id, presentationId),
            eq(collaborators.user_id, userId)
          )
        )
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }

  /**
   * Get user's role for a presentation
   */
  async getUserRole(presentationId: number, userId: number): Promise<'viewer' | 'editor' | 'owner' | null> {
    try {
      const result = await this.db
        .select({ role: collaborators.role })
        .from(collaborators)
        .where(
          and(
            eq(collaborators.presentation_id, presentationId),
            eq(collaborators.user_id, userId)
          )
        )
        .limit(1);

      return result[0]?.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  /**
   * Get all presentations a user collaborates on
   */
  async getUserCollaborations(userId: number): Promise<Array<{
    presentationId: number;
    title: string;
    role: 'viewer' | 'editor' | 'owner';
    ownerId: number;
    createdAt: Date;
  }>> {
    try {
      const result = await this.db
        .select({
          presentationId: presentations.id,
          title: presentations.title,
          role: collaborators.role,
          ownerId: presentations.owner_id,
          createdAt: collaborators.created_at
        })
        .from(collaborators)
        .innerJoin(presentations, eq(collaborators.presentation_id, presentations.id))
        .where(eq(collaborators.user_id, userId))
        .orderBy(desc(collaborators.created_at));

      return result.map(r => ({
        presentationId: r.presentationId,
        title: r.title,
        role: r.role,
        ownerId: r.ownerId,
        createdAt: r.createdAt!
      }));
    } catch (error) {
      console.error('Error fetching user collaborations:', error);
      throw new Error('Failed to fetch user collaborations');
    }
  }
}
