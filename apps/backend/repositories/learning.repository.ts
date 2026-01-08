/**
 * Learning Repository - ADAPTIVE LEARNING FEATURE
 *
 * Manages all data access for the adaptive learning system.
 * Tracks user learning profiles, skill assessments, personalized exercises, and milestones.
 */

import { eq, and, desc, asc, sql, gte, between } from 'drizzle-orm';
import {
  learningProfiles,
  skillAssessments,
  personalizedExercises,
  learningMilestones,
  adaptiveFeedbackHistory,
  performanceScores,
  coachSessions
} from '../../../shared/schema';
import type { db } from '../../../server/db';

type Database = typeof db;

export interface UserLearningProfile {
  userId: number;
  currentLevel: string;
  learningPace: string;
  strongAreas: string[];
  weakAreas: string[];
  preferredLanguage: string;
  totalPracticeTime: number;
  streakDays: number;
  lastPracticeDate: Date | null;
  adaptiveDifficulty: number;
}

export interface SkillProgress {
  skillCategory: string;
  currentLevel: number;
  trend: 'improving' | 'stable' | 'declining';
  recentScores: number[];
  averageScore: number;
}

export interface AdaptiveRecommendation {
  recommendationType: 'exercise' | 'difficulty_adjustment' | 'focus_area';
  title: string;
  description: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

export class LearningRepository {
  constructor(private db: Database) {}

  /**
   * Get or create learning profile for a user
   */
  async getOrCreateLearningProfile(userId: number): Promise<UserLearningProfile> {
    try {
      // Try to get existing profile
      const existing = await this.db
        .select()
        .from(learningProfiles)
        .where(eq(learningProfiles.user_id, userId))
        .limit(1);

      if (existing.length > 0) {
        const profile = existing[0];
        return {
          userId: profile.user_id,
          currentLevel: profile.current_level || 'beginner',
          learningPace: profile.learning_pace || 'moderate',
          strongAreas: profile.strong_areas ? JSON.parse(profile.strong_areas) : [],
          weakAreas: profile.weak_areas ? JSON.parse(profile.weak_areas) : [],
          preferredLanguage: profile.preferred_language || 'english',
          totalPracticeTime: profile.total_practice_time || 0,
          streakDays: profile.streak_days || 0,
          lastPracticeDate: profile.last_practice_date,
          adaptiveDifficulty: profile.adaptive_difficulty || 50
        };
      }

      // Create new profile
      const newProfile = await this.db
        .insert(learningProfiles)
        .values({
          user_id: userId,
          current_level: 'beginner',
          learning_pace: 'moderate',
          strong_areas: JSON.stringify([]),
          weak_areas: JSON.stringify([]),
          preferred_language: 'english',
          total_practice_time: 0,
          streak_days: 0,
          adaptive_difficulty: 50
        })
        .returning();

      return {
        userId: newProfile[0].user_id,
        currentLevel: newProfile[0].current_level || 'beginner',
        learningPace: newProfile[0].learning_pace || 'moderate',
        strongAreas: [],
        weakAreas: [],
        preferredLanguage: newProfile[0].preferred_language || 'english',
        totalPracticeTime: 0,
        streakDays: 0,
        lastPracticeDate: null,
        adaptiveDifficulty: 50
      };
    } catch (error) {
      console.error('Error getting/creating learning profile:', error);
      throw new Error('Failed to get learning profile');
    }
  }

  /**
   * Update learning profile with new data
   */
  async updateLearningProfile(
    userId: number,
    updates: Partial<UserLearningProfile>
  ): Promise<void> {
    try {
      const updateData: any = { updated_at: new Date() };

      if (updates.currentLevel) updateData.current_level = updates.currentLevel;
      if (updates.learningPace) updateData.learning_pace = updates.learningPace;
      if (updates.strongAreas) updateData.strong_areas = JSON.stringify(updates.strongAreas);
      if (updates.weakAreas) updateData.weak_areas = JSON.stringify(updates.weakAreas);
      if (updates.preferredLanguage) updateData.preferred_language = updates.preferredLanguage;
      if (updates.totalPracticeTime !== undefined) updateData.total_practice_time = updates.totalPracticeTime;
      if (updates.streakDays !== undefined) updateData.streak_days = updates.streakDays;
      if (updates.lastPracticeDate) updateData.last_practice_date = updates.lastPracticeDate;
      if (updates.adaptiveDifficulty !== undefined) updateData.adaptive_difficulty = updates.adaptiveDifficulty;

      await this.db
        .update(learningProfiles)
        .set(updateData)
        .where(eq(learningProfiles.user_id, userId));
    } catch (error) {
      console.error('Error updating learning profile:', error);
      throw new Error('Failed to update learning profile');
    }
  }

  /**
   * Record skill assessment for a session
   */
  async recordSkillAssessment(
    userId: number,
    sessionId: number,
    skillCategory: string,
    proficiencyLevel: number,
    trend?: string
  ): Promise<void> {
    try {
      await this.db.insert(skillAssessments).values({
        user_id: userId,
        session_id: sessionId,
        skill_category: skillCategory,
        proficiency_level: proficiencyLevel,
        trend: trend || null
      });
    } catch (error) {
      console.error('Error recording skill assessment:', error);
      throw new Error('Failed to record skill assessment');
    }
  }

  /**
   * Get skill progress for a user across all categories
   */
  async getSkillProgress(userId: number, daysBack: number = 30): Promise<SkillProgress[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - daysBack);

      const assessments = await this.db
        .select()
        .from(skillAssessments)
        .where(
          and(
            eq(skillAssessments.user_id, userId),
            gte(skillAssessments.assessment_date, since)
          )
        )
        .orderBy(desc(skillAssessments.assessment_date));

      // Group by skill category
      const skillMap = new Map<string, number[]>();
      assessments.forEach(assessment => {
        const category = assessment.skill_category;
        if (!skillMap.has(category)) {
          skillMap.set(category, []);
        }
        skillMap.get(category)!.push(assessment.proficiency_level);
      });

      const skillProgress: SkillProgress[] = [];
      skillMap.forEach((scores, category) => {
        const currentLevel = scores[0] || 0;
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

        // Determine trend
        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (scores.length >= 3) {
          const recent = scores.slice(0, 3);
          const older = scores.slice(3, 6);
          if (older.length > 0) {
            const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
            const olderAvg = older.reduce((sum, s) => sum + s, 0) / older.length;
            if (recentAvg > olderAvg + 5) trend = 'improving';
            else if (recentAvg < olderAvg - 5) trend = 'declining';
          }
        }

        skillProgress.push({
          skillCategory: category,
          currentLevel,
          trend,
          recentScores: scores.slice(0, 10),
          averageScore: Math.round(avgScore)
        });
      });

      return skillProgress;
    } catch (error) {
      console.error('Error getting skill progress:', error);
      throw new Error('Failed to get skill progress');
    }
  }

  /**
   * Create personalized exercise for user
   */
  async createPersonalizedExercise(
    userId: number,
    exerciseType: string,
    difficultyLevel: number,
    title: string,
    description: string,
    instructions: string[],
    targetSkills: string[],
    estimatedDuration: number
  ): Promise<number> {
    try {
      const result = await this.db
        .insert(personalizedExercises)
        .values({
          user_id: userId,
          exercise_type: exerciseType,
          difficulty_level: difficultyLevel,
          title,
          description,
          instructions: JSON.stringify(instructions),
          target_skills: JSON.stringify(targetSkills),
          estimated_duration: estimatedDuration,
          ai_generated: 1
        })
        .returning();

      return result[0].id;
    } catch (error) {
      console.error('Error creating personalized exercise:', error);
      throw new Error('Failed to create exercise');
    }
  }

  /**
   * Get personalized exercises for user
   */
  async getPersonalizedExercises(userId: number, includeCompleted: boolean = false) {
    try {
      const query = this.db
        .select()
        .from(personalizedExercises)
        .where(eq(personalizedExercises.user_id, userId));

      if (!includeCompleted) {
        query.where(eq(personalizedExercises.is_completed, 0));
      }

      const exercises = await query.orderBy(desc(personalizedExercises.created_at));

      return exercises.map(ex => ({
        ...ex,
        instructions: JSON.parse(ex.instructions),
        target_skills: ex.target_skills ? JSON.parse(ex.target_skills) : []
      }));
    } catch (error) {
      console.error('Error getting personalized exercises:', error);
      throw new Error('Failed to get exercises');
    }
  }

  /**
   * Mark exercise as completed
   */
  async completeExercise(exerciseId: number): Promise<void> {
    try {
      await this.db
        .update(personalizedExercises)
        .set({
          is_completed: 1,
          completion_date: new Date()
        })
        .where(eq(personalizedExercises.id, exerciseId));
    } catch (error) {
      console.error('Error completing exercise:', error);
      throw new Error('Failed to complete exercise');
    }
  }

  /**
   * Record learning milestone
   */
  async recordMilestone(
    userId: number,
    milestoneType: string,
    title: string,
    description: string,
    pointsEarned: number = 0
  ): Promise<void> {
    try {
      await this.db.insert(learningMilestones).values({
        user_id: userId,
        milestone_type: milestoneType,
        title,
        description,
        points_earned: pointsEarned
      });
    } catch (error) {
      console.error('Error recording milestone:', error);
      throw new Error('Failed to record milestone');
    }
  }

  /**
   * Get user milestones
   */
  async getUserMilestones(userId: number, limit: number = 10) {
    try {
      return await this.db
        .select()
        .from(learningMilestones)
        .where(eq(learningMilestones.user_id, userId))
        .orderBy(desc(learningMilestones.achieved_at))
        .limit(limit);
    } catch (error) {
      console.error('Error getting milestones:', error);
      throw new Error('Failed to get milestones');
    }
  }

  /**
   * Record adaptive feedback decision
   */
  async recordAdaptiveFeedback(
    userId: number,
    sessionId: number,
    feedbackStrategy: string,
    difficultyAdjustment: string | null,
    newDifficultyLevel: number | null,
    aiRationale: string
  ): Promise<void> {
    try {
      await this.db.insert(adaptiveFeedbackHistory).values({
        user_id: userId,
        session_id: sessionId,
        feedback_strategy: feedbackStrategy,
        difficulty_adjustment: difficultyAdjustment,
        new_difficulty_level: newDifficultyLevel,
        ai_rationale: aiRationale
      });
    } catch (error) {
      console.error('Error recording adaptive feedback:', error);
      throw new Error('Failed to record feedback');
    }
  }

  /**
   * Get performance trend for a user
   */
  async getPerformanceTrend(userId: number, daysBack: number = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - daysBack);

      const sessions = await this.db
        .select({
          sessionId: coachSessions.id,
          createdAt: coachSessions.created_at,
          metric: performanceScores.metric,
          score: performanceScores.score
        })
        .from(coachSessions)
        .leftJoin(performanceScores, eq(performanceScores.session_id, coachSessions.id))
        .where(
          and(
            eq(coachSessions.user_id, userId),
            gte(coachSessions.created_at, since)
          )
        )
        .orderBy(desc(coachSessions.created_at));

      return sessions;
    } catch (error) {
      console.error('Error getting performance trend:', error);
      throw new Error('Failed to get performance trend');
    }
  }

  /**
   * Calculate learning velocity (rate of improvement)
   */
  async calculateLearningVelocity(userId: number): Promise<number> {
    try {
      const recent = await this.db
        .select({
          score: performanceScores.score,
          createdAt: performanceScores.created_at
        })
        .from(performanceScores)
        .innerJoin(coachSessions, eq(performanceScores.session_id, coachSessions.id))
        .where(eq(coachSessions.user_id, userId))
        .orderBy(desc(performanceScores.created_at))
        .limit(10);

      if (recent.length < 2) return 0;

      // Calculate slope of improvement
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));

      const firstAvg = firstHalf.reduce((sum, r) => sum + r.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, r) => sum + r.score, 0) / secondHalf.length;

      const velocity = firstAvg - secondAvg; // Positive = improving, Negative = declining
      return Math.round(velocity * 10) / 10;
    } catch (error) {
      console.error('Error calculating learning velocity:', error);
      return 0;
    }
  }
}
