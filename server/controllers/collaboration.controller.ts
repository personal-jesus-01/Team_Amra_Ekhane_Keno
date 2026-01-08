/**
 * Collaboration Controller - NEW FEATURE
 *
 * HTTP endpoints for managing presentation collaborators.
 * WebSocket handling is done in the routes file.
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { CollaborationService } from '../../apps/backend/services/collaboration.service';

const collaborationService = new CollaborationService(db);

/**
 * Get all collaborators for a presentation
 * GET /api/collaboration/:presentationId
 */
export async function getCollaborators(req: Request, res: Response) {
  try {
    const presentationId = parseInt(req.params.presentationId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (isNaN(presentationId)) {
      return res.status(400).json({ message: 'Invalid presentation ID' });
    }

    const collaborators = await collaborationService.getPresentationCollaborators(presentationId);

    if (!collaborators) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    res.json({
      success: true,
      data: collaborators
    });
  } catch (error: any) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch collaborators'
    });
  }
}

/**
 * Add a collaborator to a presentation
 * POST /api/collaboration/:presentationId/add
 * Body: { userId: number, role: 'viewer' | 'editor' | 'owner' }
 */
export async function addCollaborator(req: Request, res: Response) {
  try {
    const presentationId = parseInt(req.params.presentationId);
    const currentUserId = req.user?.id;
    const { userId, role } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (isNaN(presentationId)) {
      return res.status(400).json({ message: 'Invalid presentation ID' });
    }

    if (!userId || !role) {
      return res.status(400).json({ message: 'userId and role are required' });
    }

    if (!['viewer', 'editor', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be viewer, editor, or owner' });
    }

    const collaborator = await collaborationService.addCollaborator(
      presentationId,
      userId,
      role
    );

    res.json({
      success: true,
      data: collaborator,
      message: 'Collaborator added successfully'
    });
  } catch (error: any) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add collaborator'
    });
  }
}

/**
 * Remove a collaborator from a presentation
 * DELETE /api/collaboration/:presentationId/:userId
 */
export async function removeCollaborator(req: Request, res: Response) {
  try {
    const presentationId = parseInt(req.params.presentationId);
    const userId = parseInt(req.params.userId);
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (isNaN(presentationId) || isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid presentation ID or user ID' });
    }

    await collaborationService.removeCollaborator(presentationId, userId);

    res.json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove collaborator'
    });
  }
}

/**
 * Update collaborator role
 * PATCH /api/collaboration/:presentationId/:userId
 * Body: { role: 'viewer' | 'editor' | 'owner' }
 */
export async function updateCollaboratorRole(req: Request, res: Response) {
  try {
    const presentationId = parseInt(req.params.presentationId);
    const userId = parseInt(req.params.userId);
    const currentUserId = req.user?.id;
    const { role } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (isNaN(presentationId) || isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid presentation ID or user ID' });
    }

    if (!role || !['viewer', 'editor', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be viewer, editor, or owner' });
    }

    const collaborator = await collaborationService.updateCollaboratorRole(
      presentationId,
      userId,
      role
    );

    if (!collaborator) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }

    res.json({
      success: true,
      data: collaborator,
      message: 'Collaborator role updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating collaborator role:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update collaborator role'
    });
  }
}

/**
 * Get all presentations user collaborates on
 * GET /api/collaboration/my-collaborations
 */
export async function getMyCollaborations(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const collaborations = await collaborationService.getUserCollaborations(userId);

    res.json({
      success: true,
      data: collaborations
    });
  } catch (error: any) {
    console.error('Error fetching user collaborations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch collaborations'
    });
  }
}

/**
 * Get collaboration overview
 * GET /api/collaboration/overview
 */
export async function getCollaborationOverview(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    res.json({
      success: true,
      data: {
        totalCollaborations: 3,
        stats: {
          totalPresentationsShared: 5,
          activeCollaborators: 8,
          pendingInvites: 2,
          recentActivity: new Date()
        },
        recentCollaborations: [
          { id: 1, presentationId: 1, collaboratorName: 'John Doe', role: 'editor', lastActivity: new Date() },
          { id: 2, presentationId: 2, collaboratorName: 'Jane Smith', role: 'viewer', lastActivity: new Date() }
        ]
      }
    });
  } catch (error: any) {
    console.error('Error fetching collaboration overview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch overview'
    });
  }
}

/**
 * Get collaboration statistics
 * GET /api/collaboration/stats
 */
export async function getCollaborationStats(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    res.json({
      success: true,
      data: {
        totalPresentationsShared: 5,
        totalActiveCollaborators: 8,
        pendingInvitations: 2,
        collaborationsThisMonth: 3,
        averageResponseTime: '2 hours'
      }
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics'
    });
  }
}

/**
 * Get recent collaborations
 * GET /api/collaboration/recent
 */
export async function getRecentCollaborations(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Return mock recent collaborations data
    const recent = [
      { id: 1, presentationId: 1, title: 'Product Launch Q1', collaborators: ['John Doe', 'Jane Smith'], lastModified: new Date() },
      { id: 2, presentationId: 2, title: 'Sales Strategy', collaborators: ['Mike Johnson'], lastModified: new Date(Date.now() - 86400000) },
      { id: 3, presentationId: 3, title: 'Marketing Plan', collaborators: ['Sarah Williams', 'Tom Brown'], lastModified: new Date(Date.now() - 172800000) }
    ];

    res.json({
      success: true,
      data: recent.slice(0, limit)
    });
  } catch (error: any) {
    console.error('Error fetching recent collaborations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch recent collaborations'
    });
  }
}

/**
 * Get collaboration suggestions
 * GET /api/collaboration/suggestions
 */
export async function getCollaborationSuggestions(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // For now, return empty suggestions
    // In production, this would use ML or frequency analysis
    res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch suggestions'
    });
  }
}

/**
 * Get active collaborators for a presentation
 * GET /api/collaboration/presentations/:id/active
 */
export async function getActiveCollaborators(req: Request, res: Response) {
  try {
    const presentationId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (isNaN(presentationId)) {
      return res.status(400).json({ message: 'Invalid presentation ID' });
    }

    const collaborators = await collaborationService.getPresentationCollaborators(presentationId);

    res.json({
      success: true,
      data: collaborators
    });
  } catch (error: any) {
    console.error('Error fetching active collaborators:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch active collaborators'
    });
  }
}

/**
 * Get collaboration timeline for a presentation
 * GET /api/collaboration/presentations/:id/timeline
 */
export async function getCollaborationTimeline(req: Request, res: Response) {
  try {
    const presentationId = parseInt(req.params.id);
    const userId = req.user?.id;
    const hours = parseInt(req.query.hours as string) || 24;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (isNaN(presentationId)) {
      return res.status(400).json({ message: 'Invalid presentation ID' });
    }

    // Return empty timeline for now
    res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch timeline'
    });
  }
}

/**
 * Check access to a presentation
 * GET /api/collaboration/presentations/:id/access
 */
export async function checkAccess(req: Request, res: Response) {
  try {
    const presentationId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (isNaN(presentationId)) {
      return res.status(400).json({ message: 'Invalid presentation ID' });
    }

    // Check if user has access
    const collaborators = await collaborationService.getPresentationCollaborators(presentationId);
    const hasAccess = collaborators.some(c => c.id === userId);

    res.json({
      success: true,
      data: {
        hasAccess,
        role: hasAccess ? 'collaborator' : 'none'
      }
    });
  } catch (error: any) {
    console.error('Error checking access:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check access'
    });
  }
}

/**
 * Update user presence
 * POST /api/collaboration/presence
 */
export async function updatePresence(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { presentationId, isOnline, cursorPosition } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Update presence (simplified)
    res.json({
      success: true,
      data: {
        userId,
        presentationId,
        isOnline,
        updatedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('Error updating presence:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update presence'
    });
  }
}

// Export the service for WebSocket usage
export { collaborationService };
