/**
 * Analytics Routes - NEW FEATURE
 *
 * Defines API endpoints for the Analytics Dashboard feature.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getDashboard,
  getPresentationAnalytics,
  getPracticeTrends,
  getImprovementInsights,
  getRecommendations,
  exportAnalytics
} from '../controllers/analytics.controller';

const router = Router();

// All analytics routes require authentication
router.use(requireAuth);

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', getDashboard);

/**
 * GET /api/analytics/presentation/:id
 * Get analytics for specific presentation
 */
router.get('/presentation/:id', getPresentationAnalytics);

/**
 * GET /api/analytics/trends?days=30
 * Get practice trends over time
 */
router.get('/trends', getPracticeTrends);

/**
 * GET /api/analytics/improvement
 * Get improvement insights
 */
router.get('/improvement', getImprovementInsights);

/**
 * GET /api/analytics/recommendations
 * Get personalized recommendations
 */
router.get('/recommendations', getRecommendations);

/**
 * GET /api/analytics/export
 * Export all analytics data as JSON
 */
router.get('/export', exportAnalytics);

export default router;
