/**
 * Presentation Repository
 *
 * Handles all database operations for presentations.
 * Includes queries for user presentations, shared presentations, and analytics.
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { presentations, collaborators, slides } from '../../../shared/schema';
import type { Presentation } from '../../../shared/schema';
import type { db } from '../../../server/db';

type Database = typeof db;

export interface PresentationWithSlides extends Presentation {
  slides?: any[];
  slideCount?: number;
}

export class PresentationRepository extends BaseRepository<
  typeof presentations,
  Presentation,
  typeof presentations.$inferInsert
> {
  constructor(db: Database) {
    super(db, presentations);
  }

  /**
   * Find presentations by owner with pagination
   */
  async findByOwner(
    ownerId: number,
    options: { limit?: number; offset?: number; status?: string } = {}
  ): Promise<Presentation[]> {
    const { limit = 20, offset = 0, status } = options;

    try {
      let query = this.db
        .select()
        .from(presentations)
        .where(eq(presentations.owner_id, ownerId))
        .orderBy(desc(presentations.created_at))
        .limit(limit)
        .offset(offset);

      if (status) {
        query = query.where(
          and(
            eq(presentations.owner_id, ownerId),
            eq(presentations.status, status as any)
          )
        ) as any;
      }

      return await query;
    } catch (error) {
      console.error('Error finding presentations by owner:', error);
      throw new Error('Failed to fetch user presentations');
    }
  }

  /**
   * Find presentations shared with user (via collaborators)
   */
  async findSharedWithUser(userId: number): Promise<Presentation[]> {
    try {
      const result = await this.db
        .select({
          id: presentations.id,
          title: presentations.title,
          description: presentations.description,
          owner_id: presentations.owner_id,
          status: presentations.status,
          thumbnail_url: presentations.thumbnail_url,
          external_url: presentations.external_url,
          google_slides_id: presentations.google_slides_id,
          edit_url: presentations.edit_url,
          view_url: presentations.view_url,
          template_id: presentations.template_id,
          source_type: presentations.source_type,
          slides_count: presentations.slides_count,
          created_at: presentations.created_at,
          updated_at: presentations.updated_at,
          role: collaborators.role
        })
        .from(collaborators)
        .innerJoin(presentations, eq(collaborators.presentation_id, presentations.id))
        .where(eq(collaborators.user_id, userId))
        .orderBy(desc(presentations.updated_at));

      return result as any;
    } catch (error) {
      console.error('Error finding shared presentations:', error);
      throw new Error('Failed to fetch shared presentations');
    }
  }

  /**
   * Find presentation with slides
   */
  async findByIdWithSlides(presentationId: number): Promise<PresentationWithSlides | null> {
    try {
      const presentation = await this.findById(presentationId);
      if (!presentation) return null;

      const presentationSlides = await this.db
        .select()
        .from(slides)
        .where(eq(slides.presentation_id, presentationId))
        .orderBy(slides.slide_number);

      return {
        ...presentation,
        slides: presentationSlides,
        slideCount: presentationSlides.length
      };
    } catch (error) {
      console.error('Error finding presentation with slides:', error);
      throw new Error('Failed to fetch presentation with slides');
    }
  }

  /**
   * Update slides count
   */
  async updateSlidesCount(presentationId: number, count: number): Promise<void> {
    try {
      await this.db
        .update(presentations)
        .set({ slides_count: count })
        .where(eq(presentations.id, presentationId));
    } catch (error) {
      console.error('Error updating slides count:', error);
      throw new Error('Failed to update slides count');
    }
  }

  /**
   * Search presentations by title or description
   */
  async search(
    ownerId: number,
    searchTerm: string,
    limit: number = 20
  ): Promise<Presentation[]> {
    try {
      const result = await this.db
        .select()
        .from(presentations)
        .where(
          and(
            eq(presentations.owner_id, ownerId),
            sql`(
              ${presentations.title} ILIKE ${`%${searchTerm}%`} OR
              ${presentations.description} ILIKE ${`%${searchTerm}%`}
            )`
          )
        )
        .orderBy(desc(presentations.updated_at))
        .limit(limit);

      return result;
    } catch (error) {
      console.error('Error searching presentations:', error);
      throw new Error('Failed to search presentations');
    }
  }

  /**
   * Get presentation statistics for user
   */
  async getUserStats(userId: number): Promise<{
    total: number;
    published: number;
    draft: number;
    totalSlides: number;
  }> {
    try {
      const result = await this.db
        .select({
          total: sql<number>`COUNT(*)`,
          published: sql<number>`COUNT(*) FILTER (WHERE ${presentations.status} = 'published')`,
          draft: sql<number>`COUNT(*) FILTER (WHERE ${presentations.status} = 'draft')`,
          totalSlides: sql<number>`COALESCE(SUM(${presentations.slides_count}), 0)`
        })
        .from(presentations)
        .where(eq(presentations.owner_id, userId));

      return {
        total: Number(result[0]?.total || 0),
        published: Number(result[0]?.published || 0),
        draft: Number(result[0]?.draft || 0),
        totalSlides: Number(result[0]?.totalSlides || 0)
      };
    } catch (error) {
      console.error('Error getting user presentation stats:', error);
      throw new Error('Failed to fetch presentation statistics');
    }
  }

  /**
   * Get recent presentations
   */
  async getRecent(userId: number, limit: number = 5): Promise<Presentation[]> {
    try {
      return await this.db
        .select()
        .from(presentations)
        .where(eq(presentations.owner_id, userId))
        .orderBy(desc(presentations.updated_at))
        .limit(limit);
    } catch (error) {
      console.error('Error getting recent presentations:', error);
      throw new Error('Failed to fetch recent presentations');
    }
  }

  /**
   * Check if user has access to presentation (owner or collaborator)
   */
  async hasAccess(userId: number, presentationId: number): Promise<boolean> {
    try {
      // Check if user is owner
      const presentation = await this.findById(presentationId);
      if (presentation && presentation.owner_id === userId) {
        return true;
      }

      // Check if user is collaborator
      const collaboration = await this.db
        .select()
        .from(collaborators)
        .where(
          and(
            eq(collaborators.presentation_id, presentationId),
            eq(collaborators.user_id, userId)
          )
        )
        .limit(1);

      return collaboration.length > 0;
    } catch (error) {
      console.error('Error checking presentation access:', error);
      return false;
    }
  }

  /**
   * Get presentation collaborators
   */
  async getCollaborators(presentationId: number) {
    try {
      return await this.db
        .select()
        .from(collaborators)
        .where(eq(collaborators.presentation_id, presentationId));
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      throw new Error('Failed to fetch collaborators');
    }
  }
}
