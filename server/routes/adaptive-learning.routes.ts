/**
 * Adaptive Learning Routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as adaptiveLearningController from '../controllers/adaptive-learning.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/adaptive-learning/dashboard - Get complete learning dashboard
router.get('/dashboard', adaptiveLearningController.getLearningDashboard);

// GET /api/adaptive-learning/profile - Get learning profile
router.get('/profile', adaptiveLearningController.getLearningProfile);

// GET /api/adaptive-learning/exercises - Get personalized exercises
router.get('/exercises', adaptiveLearningController.getPersonalizedExercises);

// POST /api/adaptive-learning/exercises/:exerciseId/complete - Mark exercise as complete
router.post('/exercises/:exerciseId/complete', adaptiveLearningController.completeExercise);

// GET /api/adaptive-learning/skills - Get skill progress
router.get('/skills', adaptiveLearningController.getSkillProgress);

// GET /api/adaptive-learning/milestones - Get learning milestones
router.get('/milestones', adaptiveLearningController.getLearningMilestones);

// GET /api/adaptive-learning/insights - Get AI-generated insights
router.get('/insights', adaptiveLearningController.getInsights);

export default router;
