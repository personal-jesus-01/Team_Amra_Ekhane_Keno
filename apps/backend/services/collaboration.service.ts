/**
 * Collaboration Service - NEW FEATURE
 *
 * Manages real-time collaboration features for presentations.
 * Handles WebSocket connections, active user tracking, and collaboration events.
 */

import { CollaborationRepository, ActiveUser, CollaborationEvent, PresentationCollaborators } from '../repositories/collaboration.repository';
import type { db } from '../../../server/db';
import type { WebSocket } from 'ws';

type Database = typeof db;

interface WebSocketConnection {
  ws: WebSocket;
  userId: number;
  username: string;
  presentationId: number;
  role: 'viewer' | 'editor' | 'owner';
  currentSlide?: number;
  lastActivity: Date;
}

export class CollaborationService {
  private collaborationRepo: CollaborationRepository;
  private activeConnections: Map<string, WebSocketConnection> = new Map();
  private presentationRooms: Map<number, Set<string>> = new Map();

  constructor(db: Database) {
    this.collaborationRepo = new CollaborationRepository(db);
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(userId: number, presentationId: number): string {
    return `${userId}-${presentationId}-${Date.now()}`;
  }

  /**
   * Handle user joining a presentation
   */
  async handleUserJoin(
    ws: WebSocket,
    userId: number,
    username: string,
    presentationId: number
  ): Promise<void> {
    try {
      // Check if user has access
      const hasAccess = await this.collaborationRepo.hasAccess(presentationId, userId);
      if (!hasAccess) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Access denied to this presentation'
        }));
        ws.close();
        return;
      }

      // Get user role
      const role = await this.collaborationRepo.getUserRole(presentationId, userId);
      if (!role) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unable to determine user role'
        }));
        ws.close();
        return;
      }

      // Create connection
      const connectionId = this.generateConnectionId(userId, presentationId);
      const connection: WebSocketConnection = {
        ws,
        userId,
        username,
        presentationId,
        role,
        lastActivity: new Date()
      };

      this.activeConnections.set(connectionId, connection);

      // Add to presentation room
      if (!this.presentationRooms.has(presentationId)) {
        this.presentationRooms.set(presentationId, new Set());
      }
      this.presentationRooms.get(presentationId)!.add(connectionId);

      // Send confirmation to user
      ws.send(JSON.stringify({
        type: 'joined',
        connectionId,
        presentationId,
        role,
        activeUsers: this.getActiveUsers(presentationId)
      }));

      // Broadcast join event to others in the room
      this.broadcastToRoom(presentationId, {
        type: 'user_joined',
        userId,
        username,
        role,
        timestamp: new Date().toISOString()
      }, connectionId);

      // Setup heartbeat
      this.setupHeartbeat(connectionId);

    } catch (error) {
      console.error('Error handling user join:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to join presentation'
      }));
    }
  }

  /**
   * Handle user leaving a presentation
   */
  handleUserLeave(connectionId: string): void {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    const { presentationId, userId, username } = connection;

    // Remove from room
    const room = this.presentationRooms.get(presentationId);
    if (room) {
      room.delete(connectionId);
      if (room.size === 0) {
        this.presentationRooms.delete(presentationId);
      }
    }

    // Remove connection
    this.activeConnections.delete(connectionId);

    // Broadcast leave event
    this.broadcastToRoom(presentationId, {
      type: 'user_left',
      userId,
      username,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle slide change event
   */
  handleSlideChange(connectionId: string, slideNumber: number): void {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    connection.currentSlide = slideNumber;
    connection.lastActivity = new Date();

    // Broadcast slide change to others
    this.broadcastToRoom(connection.presentationId, {
      type: 'slide_changed',
      userId: connection.userId,
      username: connection.username,
      slideNumber,
      timestamp: new Date().toISOString()
    }, connectionId);
  }

  /**
   * Handle edit event
   */
  handleEdit(connectionId: string, editData: any): void {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    // Only editors and owners can edit
    if (connection.role === 'viewer') {
      connection.ws.send(JSON.stringify({
        type: 'error',
        message: 'You do not have permission to edit'
      }));
      return;
    }

    connection.lastActivity = new Date();

    // Broadcast edit to others
    this.broadcastToRoom(connection.presentationId, {
      type: 'edit',
      userId: connection.userId,
      username: connection.username,
      editData,
      timestamp: new Date().toISOString()
    }, connectionId);
  }

  /**
   * Get active users for a presentation
   */
  getActiveUsers(presentationId: number): ActiveUser[] {
    const room = this.presentationRooms.get(presentationId);
    if (!room) return [];

    const users: ActiveUser[] = [];
    const now = new Date();

    room.forEach(connectionId => {
      const connection = this.activeConnections.get(connectionId);
      if (connection) {
        const idleTime = now.getTime() - connection.lastActivity.getTime();
        const status = idleTime > 300000 ? 'idle' : 'online'; // 5 minutes idle threshold

        users.push({
          userId: connection.userId,
          username: connection.username,
          name: null, // Can be enhanced with full user data
          avatarUrl: null,
          role: connection.role,
          status,
          lastActivity: connection.lastActivity,
          currentSlide: connection.currentSlide
        });
      }
    });

    return users;
  }

  /**
   * Broadcast message to all users in a presentation room
   */
  private broadcastToRoom(presentationId: number, message: any, excludeConnectionId?: string): void {
    const room = this.presentationRooms.get(presentationId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    room.forEach(connectionId => {
      if (connectionId === excludeConnectionId) return;

      const connection = this.activeConnections.get(connectionId);
      if (connection && connection.ws.readyState === 1) { // OPEN state
        connection.ws.send(messageStr);
      }
    });
  }

  /**
   * Setup heartbeat to track active connections
   */
  private setupHeartbeat(connectionId: string): void {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    const heartbeatInterval = setInterval(() => {
      const conn = this.activeConnections.get(connectionId);
      if (!conn || conn.ws.readyState !== 1) {
        clearInterval(heartbeatInterval);
        this.handleUserLeave(connectionId);
        return;
      }

      conn.ws.send(JSON.stringify({ type: 'ping' }));
    }, 30000); // 30 seconds
  }

  /**
   * Get presentation collaborators with active status
   */
  async getPresentationCollaborators(presentationId: number): Promise<PresentationCollaborators | null> {
    const collaborators = await this.collaborationRepo.getPresentationCollaborators(presentationId);
    if (!collaborators) return null;

    // Update active users with real-time status
    const activeUsers = this.getActiveUsers(presentationId);
    const activeUserIds = new Set(activeUsers.map(u => u.userId));

    collaborators.activeUsers = collaborators.activeUsers.map(user => {
      const activeUser = activeUsers.find(au => au.userId === user.userId);
      return {
        ...user,
        status: activeUserIds.has(user.userId) ? (activeUser?.status || 'online') : 'offline',
        lastActivity: activeUser?.lastActivity || user.lastActivity,
        currentSlide: activeUser?.currentSlide
      };
    });

    return collaborators;
  }

  /**
   * Add collaborator
   */
  async addCollaborator(
    presentationId: number,
    userId: number,
    role: 'viewer' | 'editor' | 'owner'
  ) {
    return this.collaborationRepo.addCollaborator(presentationId, userId, role);
  }

  /**
   * Remove collaborator
   */
  async removeCollaborator(presentationId: number, userId: number) {
    // Disconnect active connections
    this.activeConnections.forEach((connection, connectionId) => {
      if (connection.userId === userId && connection.presentationId === presentationId) {
        connection.ws.close();
        this.handleUserLeave(connectionId);
      }
    });

    return this.collaborationRepo.removeCollaborator(presentationId, userId);
  }

  /**
   * Update collaborator role
   */
  async updateCollaboratorRole(
    presentationId: number,
    userId: number,
    role: 'viewer' | 'editor' | 'owner'
  ) {
    // Update active connections
    this.activeConnections.forEach((connection) => {
      if (connection.userId === userId && connection.presentationId === presentationId) {
        connection.role = role;
        connection.ws.send(JSON.stringify({
          type: 'role_updated',
          role
        }));
      }
    });

    return this.collaborationRepo.updateCollaboratorRole(presentationId, userId, role);
  }

  /**
   * Get user collaborations
   */
  async getUserCollaborations(userId: number) {
    return this.collaborationRepo.getUserCollaborations(userId);
  }

  /**
   * Clean up inactive connections
   */
  cleanupInactiveConnections(): void {
    const now = new Date();
    const timeout = 600000; // 10 minutes

    this.activeConnections.forEach((connection, connectionId) => {
      const inactiveTime = now.getTime() - connection.lastActivity.getTime();
      if (inactiveTime > timeout) {
        connection.ws.close();
        this.handleUserLeave(connectionId);
      }
    });
  }
}
