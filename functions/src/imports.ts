/**
 * This file provides a way to handle imports in the Firebase Functions environment
 * It maps shared types to local copies to avoid path resolution issues
 */

// Re-export schema from the local shared directory
export * from './shared/schema';

// Export Express session types
import session from 'express-session';
export type SessionStore = session.Store;

// Export the UserWithoutPassword type that's used in multiple places
import { User } from './shared/schema';
export type UserWithoutPassword = Omit<User, 'password'>;