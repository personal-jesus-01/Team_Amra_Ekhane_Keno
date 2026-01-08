/**
 * Collaboration Routes - NEW FEATURE
 * Real-time collaboration endpoints
 */

import { Router } from 'express';
import { requireAuth } from '../auth';
import * as collaborationController from '../controllers/collaboration.controller';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

/**
 * @swagger
 * /api/collaboration/overview:
 *   get:
 *     summary: Get user's collaboration overview
 *     tags:
 *       - Collaboration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Collaboration overview
 */
router.get('/overview', collaborationController.getCollaborationOverview);

/**
 * @swagger
 * /api/collaboration/stats:
 *   get:
 *     summary: Get collaboration statistics
 *     tags:
 *       - Collaboration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Collaboration statistics
 */
router.get('/stats', collaborationController.getCollaborationStats);

/**
 * @swagger
 * /api/collaboration/recent:
 *   get:
 *     summary: Get recent collaborations
 *     tags:
 *       - Collaboration
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of collaborations to return
 *     responses:
 *       200:
 *         description: Recent collaborations
 */
router.get('/recent', collaborationController.getRecentCollaborations);

/**
 * @swagger
 * /api/collaboration/suggestions:
 *   get:
 *     summary: Get collaboration suggestions
 *     tags:
 *       - Collaboration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Collaboration suggestions
 */
router.get('/suggestions', collaborationController.getCollaborationSuggestions);

/**
 * @swagger
 * /api/collaboration/presentations/{id}/active:
 *   get:
 *     summary: Get active collaborators for a presentation
 *     tags:
 *       - Collaboration
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Active collaborators
 */
router.get('/presentations/:id/active', collaborationController.getActiveCollaborators);

/**
 * @swagger
 * /api/collaboration/presentations/{id}/timeline:
 *   get:
 *     summary: Get collaboration timeline for a presentation
 *     tags:
 *       - Collaboration
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: hours
 *         schema:
 *           type: number
 *         description: Hours to look back (default 24)
 *     responses:
 *       200:
 *         description: Collaboration timeline
 */
router.get('/presentations/:id/timeline', collaborationController.getCollaborationTimeline);

/**
 * @swagger
 * /api/collaboration/presentations/{id}/access:
 *   get:
 *     summary: Check access to a presentation
 *     tags:
 *       - Collaboration
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Access information
 */
router.get('/presentations/:id/access', collaborationController.checkAccess);

/**
 * @swagger
 * /api/collaboration/presence:
 *   post:
 *     summary: Update user presence
 *     tags:
 *       - Collaboration
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               presentationId:
 *                 type: number
 *               isOnline:
 *                 type: boolean
 *               cursorPosition:
 *                 type: object
 *     responses:
 *       200:
 *         description: Presence updated
 */
router.post('/presence', collaborationController.updatePresence);

export default router;
