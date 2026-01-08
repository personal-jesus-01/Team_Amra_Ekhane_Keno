/**
 * Adaptive Learning Controller
 *
 * HTTP endpoints for the adaptive learning system
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { AdaptiveLearningService } from '../../apps/backend/services/adaptive-learning.service';

const adaptiveLearningService = new AdaptiveLearningService(db);

/**
 * Get learning dashboard for user
 * GET /api/adaptive-learning/dashboard
 */
export async function getLearningDashboard(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const dashboard = await adaptiveLearningService.getLearningDashboard(userId);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    console.error('Error fetching learning dashboard:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard'
    });
  }
}

/**
 * Get personalized exercises
 * GET /api/adaptive-learning/exercises
 */
export async function getPersonalizedExercises(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const includeCompleted = req.query.includeCompleted === 'true';

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const dashboard = await adaptiveLearningService.getLearningDashboard(userId);

    res.json({
      success: true,
      data: dashboard.exercises
    });
  } catch (error: any) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch exercises'
    });
  }
}

/**
 * Get learning milestones
 * GET /api/adaptive-learning/milestones
 */
export async function getLearningMilestones(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const dashboard = await adaptiveLearningService.getLearningDashboard(userId);

    res.json({
      success: true,
      data: dashboard.milestones
    });
  } catch (error: any) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch milestones'
    });
  }
}

/**
 * Get skill progress
 * GET /api/adaptive-learning/skills
 */
export async function getSkillProgress(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const dashboard = await adaptiveLearningService.getLearningDashboard(userId);

    res.json({
      success: true,
      data: {
        skillProgress: dashboard.skillProgress,
        learningVelocity: dashboard.learningVelocity,
        insights: dashboard.insights
      }
    });
  } catch (error: any) {
    console.error('Error fetching skill progress:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch skill progress'
    });
  }
}

/**
 * Complete an exercise
 * POST /api/adaptive-learning/exercises/:exerciseId/complete
 */
export async function completeExercise(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const exerciseId = parseInt(req.params.exerciseId);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (isNaN(exerciseId)) {
      return res.status(400).json({ message: 'Invalid exercise ID' });
    }

    // Mark exercise as completed (implementation in repository)
    // For now, return success
    res.json({
      success: true,
      message: 'Exercise marked as completed'
    });
  } catch (error: any) {
    console.error('Error completing exercise:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete exercise'
    });
  }
}

/**
 * Get learning profile
 * GET /api/adaptive-learning/profile
 */
export async function getLearningProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const dashboard = await adaptiveLearningService.getLearningDashboard(userId);

    res.json({
      success: true,
      data: dashboard.profile
    });
  } catch (error: any) {
    console.error('Error fetching learning profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile'
    });
  }
}

/**
 * Get adaptive learning insights
 * GET /api/adaptive-learning/insights
 */
export async function getInsights(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const dashboard = await adaptiveLearningService.getLearningDashboard(userId);

    res.json({
      success: true,
      data: {
        insights: dashboard.insights,
        learningVelocity: dashboard.learningVelocity,
        currentLevel: dashboard.profile.currentLevel,
        adaptiveDifficulty: dashboard.profile.adaptiveDifficulty
      }
    });
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch insights'
    });
  }
}
