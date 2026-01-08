/**
 * Base Repository Pattern Implementation
 *
 * Provides common CRUD operations for all repositories.
 * Uses Drizzle ORM with NeonDB PostgreSQL.
 *
 * Design Pattern: Repository Pattern
 * Why: Abstracts database access, makes testing easier, allows swapping implementations
 */

import { eq, desc, asc, sql, and } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { db } from '../../../server/db';

type Database = typeof db;

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'asc' | 'desc';
  orderField?: string;
}

export interface FilterOptions {
  [key: string]: any;
}

/**
 * Base Repository with common CRUD operations
 */
export abstract class BaseRepository<TTable extends PgTable, TSelect, TInsert> {
  constructor(
    protected db: Database,
    protected table: TTable
  ) {}

  /**
   * Find entity by ID
   */
  async findById(id: number): Promise<TSelect | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error(`Error finding ${this.table} by id ${id}:`, error);
      throw new Error(`Failed to find record by id`);
    }
  }

  /**
   * Find all entities with pagination
   */
  async findAll(options: PaginationOptions = {}): Promise<TSelect[]> {
    const {
      limit = 20,
      offset = 0,
      orderBy = 'desc',
      orderField = 'created_at'
    } = options;

    try {
      const query = this.db
        .select()
        .from(this.table)
        .limit(limit)
        .offset(offset);

      // Add ordering if field exists
      if (this.table[orderField]) {
        const orderFn = orderBy === 'asc' ? asc : desc;
        query.orderBy(orderFn(this.table[orderField]));
      }

      return await query;
    } catch (error) {
      console.error(`Error finding all ${this.table}:`, error);
      throw new Error(`Failed to fetch records`);
    }
  }

  /**
   * Find entities with custom filter
   */
  async findWhere(
    filters: FilterOptions,
    options: PaginationOptions = {}
  ): Promise<TSelect[]> {
    const {
      limit = 20,
      offset = 0,
      orderBy = 'desc',
      orderField = 'created_at'
    } = options;

    try {
      const conditions = Object.entries(filters).map(([key, value]) =>
        eq(this.table[key], value)
      );

      const query = this.db
        .select()
        .from(this.table)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

      // Add ordering if field exists
      if (this.table[orderField]) {
        const orderFn = orderBy === 'asc' ? asc : desc;
        query.orderBy(orderFn(this.table[orderField]));
      }

      return await query;
    } catch (error) {
      console.error(`Error finding ${this.table} with filters:`, error);
      throw new Error(`Failed to fetch records with filters`);
    }
  }

  /**
   * Find single entity with custom filter
   */
  async findOneWhere(filters: FilterOptions): Promise<TSelect | null> {
    try {
      const conditions = Object.entries(filters).map(([key, value]) =>
        eq(this.table[key], value)
      );

      const result = await this.db
        .select()
        .from(this.table)
        .where(and(...conditions))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error(`Error finding one ${this.table}:`, error);
      throw new Error(`Failed to find record`);
    }
  }

  /**
   * Create new entity
   */
  async create(data: TInsert): Promise<TSelect> {
    try {
      const result = await this.db
        .insert(this.table)
        .values(data as any)
        .returning();

      return result[0];
    } catch (error) {
      console.error(`Error creating ${this.table}:`, error);
      throw new Error(`Failed to create record`);
    }
  }

  /**
   * Create multiple entities
   */
  async createMany(data: TInsert[]): Promise<TSelect[]> {
    try {
      const result = await this.db
        .insert(this.table)
        .values(data as any[])
        .returning();

      return result;
    } catch (error) {
      console.error(`Error creating multiple ${this.table}:`, error);
      throw new Error(`Failed to create records`);
    }
  }

  /**
   * Update entity by ID
   */
  async update(id: number, data: Partial<TInsert>): Promise<TSelect | null> {
    try {
      // Add updated_at timestamp if field exists
      const updateData = {
        ...data,
        ...(this.table['updated_at'] && { updated_at: new Date() })
      };

      const result = await this.db
        .update(this.table)
        .set(updateData as any)
        .where(eq(this.table.id, id))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error(`Error updating ${this.table} ${id}:`, error);
      throw new Error(`Failed to update record`);
    }
  }

  /**
   * Delete entity by ID (soft delete if deleted_at exists)
   */
  async delete(id: number): Promise<boolean> {
    try {
      // Check if table has deleted_at field for soft delete
      if (this.table['deleted_at']) {
        await this.db
          .update(this.table)
          .set({ deleted_at: new Date() } as any)
          .where(eq(this.table.id, id));
      } else {
        // Hard delete
        await this.db
          .delete(this.table)
          .where(eq(this.table.id, id));
      }

      return true;
    } catch (error) {
      console.error(`Error deleting ${this.table} ${id}:`, error);
      throw new Error(`Failed to delete record`);
    }
  }

  /**
   * Count total records
   */
  async count(filters?: FilterOptions): Promise<number> {
    try {
      let query = this.db
        .select({ count: sql<number>`count(*)` })
        .from(this.table);

      if (filters) {
        const conditions = Object.entries(filters).map(([key, value]) =>
          eq(this.table[key], value)
        );
        query = query.where(and(...conditions)) as any;
      }

      const result = await query;
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error(`Error counting ${this.table}:`, error);
      throw new Error(`Failed to count records`);
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: number): Promise<boolean> {
    try {
      const result = await this.db
        .select({ id: this.table.id })
        .from(this.table)
        .where(eq(this.table.id, id))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error(`Error checking existence of ${this.table} ${id}:`, error);
      return false;
    }
  }
}
