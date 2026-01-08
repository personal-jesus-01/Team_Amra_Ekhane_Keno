/**
 * Analytics Controller - NEW FEATURE
 *
 * Handles HTTP requests for analytics dashboard.
 * Integrates with new AnalyticsService.
 */

import type { Request, Response } from 'express';
import { db } from '../db';
import { AnalyticsService } from '../../apps/backend/services/analytics.service';

const analyticsService = new AnalyticsService(db);

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard data for current user
 */
export async function getDashboard(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Return mock dashboard data for now
    const dashboardData = {
      userStats: {
        totalPresentations: 5,
        totalPracticeSessions: 12,
        averageScore: 78.5,
        totalSlides: 42,
        improvementRate: 5.2,
        lastPracticeDate: new Date()
      },
      recentTrends: [
        { date: '2026-01-08', avgContentScore: 78, avgFluencyScore: 75, avgConfidenceScore: 82, sessionCount: 2 },
        { date: '2026-01-07', avgContentScore: 75, avgFluencyScore: 73, avgConfidenceScore: 79, sessionCount: 1 },
        { date: '2026-01-06', avgContentScore: 80, avgFluencyScore: 78, avgConfidenceScore: 85, sessionCount: 2 },
      ],
      topPresentations: [
        { id: 1, title: 'Product Launch', practiceCount: 5, averageScore: 85 },
        { id: 2, title: 'Q1 Quarterly Report', practiceCount: 3, averageScore: 78 },
      ],
      languagePerformance: [
        { language: 'English', averageScore: 78.5, sessionCount: 10 },
      ]
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch dashboard analytics'
    });
  }
}

/**
 * GET /api/analytics/presentation/:id
 * Get analytics for specific presentation
 */
export async function getPresentationAnalytics(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const presentationId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (isNaN(presentationId)) {
      return res.status(400).json({ message: 'Invalid presentation ID' });
    }

    // Return mock analytics data for now
    const analytics = {
      presentationId,
      title: 'Sample Presentation',
      practiceCount: 5,
      averageContentScore: 78,
      averageFluencyScore: 75,
      averageConfidenceScore: 82,
      lastPracticeDate: new Date(),
      scoreBreakdown: {
        content: 78,
        delivery: 75,
        pace: 82
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Error fetching presentation analytics:', error);

    if (error.message === 'Access denied to presentation') {
      return res.status(403).json({ message: error.message });
    }

    if (error.message === 'Presentation not found') {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({
      message: error.message || 'Failed to fetch presentation analytics'
    });
  }
}

/**
 * GET /api/analytics/trends
 * Get practice trends over time
 */
export async function getPracticeTrends(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const days = parseInt(req.query.days as string) || 30;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const trends = await analyticsService.getPracticeTrends(userId, days);

    res.json({
      success: true,
      data: trends
    });
  } catch (error: any) {
    console.error('Error fetching practice trends:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch practice trends'
    });
  }
}

/**
 * GET /api/analytics/improvement
 * Get improvement insights and progress
 */
export async function getImprovementInsights(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const insights = await analyticsService.getImprovementInsights(userId);

    res.json({
      success: true,
      data: insights
    });
  } catch (error: any) {
    console.error('Error fetching improvement insights:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch improvement insights'
    });
  }
}

/**
 * GET /api/analytics/recommendations
 * Get personalized recommendations
 */
export async function getRecommendations(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const recommendations = await analyticsService.getRecommendations(userId);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate recommendations'
    });
  }
}

/**
 * GET /api/analytics/export
 * Export all analytics data as JSON
 */
export async function exportAnalytics(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const exportData = await analyticsService.exportAnalyticsData(userId);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="slidebanai-analytics-${userId}-${Date.now()}.json"`
    );

    res.json(exportData);
  } catch (error: any) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      message: error.message || 'Failed to export analytics data'
    });
  }
}
