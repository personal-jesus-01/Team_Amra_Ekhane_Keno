/**
 * Adaptive Learning Service - AGENTIC AI WORKFLOW
 *
 * This service implements an autonomous AI agent that:
 * 1. Analyzes user performance in real-time
 * 2. Adapts difficulty and feedback based on learning patterns
 * 3. Generates personalized exercises and recommendations
 * 4. Tracks long-term learning progression
 * 5. Makes intelligent decisions about coaching strategy
 *
 * The agent operates with the following principles:
 * - Continuous Assessment: Every practice session updates the user model
 * - Dynamic Difficulty Adjustment: Challenge level adapts to user performance
 * - Personalized Feedback: Tone and content match user's learning stage
 * - Goal-Oriented: Focuses on weakest skills while reinforcing strengths
 */

import OpenAI from 'openai';
import { LearningRepository, UserLearningProfile, SkillProgress, AdaptiveRecommendation } from '../repositories/learning.repository';
import type { db } from '../../../server/db';

type Database = typeof db;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PerformanceAnalysis {
  overallScore: number;
  skillScores: {
    contentCoverage: number;
    fluency: number;
    clarity: number;
    confidence: number;
    pace: number;
    pronunciation: number;
  };
  strengths: string[];
  weaknesses: string[];
  improvementRate: number;
}

export interface AdaptiveCoachingDecision {
  feedbackStrategy: 'encouraging' | 'constructive' | 'challenging' | 'balanced';
  difficultyAdjustment: 'increase' | 'maintain' | 'decrease';
  newDifficultyLevel: number;
  personalizedFeedback: string;
  recommendedExercises: Array<{
    type: string;
    title: string;
    description: string;
    difficulty: number;
  }>;
  rationale: string;
}

export class AdaptiveLearningService {
  private learningRepo: LearningRepository;

  constructor(db: Database) {
    this.learningRepo = new LearningRepository(db);
  }

  /**
   * AGENT CORE: Analyze performance and make adaptive decisions
   * This is the main decision-making loop of the AI agent
   */
  async analyzeAndAdapt(
    userId: number,
    sessionId: number,
    performanceData: PerformanceAnalysis,
    transcript: string,
    language: string = 'english'
  ): Promise<AdaptiveCoachingDecision> {
    try {
      // Step 1: Get current learning profile
      const profile = await this.learningRepo.getOrCreateLearningProfile(userId);

      // Step 2: Get skill progress history
      const skillProgress = await this.learningRepo.getSkillProgress(userId, 30);

      // Step 3: Calculate learning velocity
      const learningVelocity = await this.learningRepo.calculateLearningVelocity(userId);

      // Step 4: Ask AI agent to make coaching decision
      const decision = await this.makeCoachingDecision(
        profile,
        skillProgress,
        performanceData,
        learningVelocity,
        transcript,
        language
      );

      // Step 5: Update learning profile based on decision
      await this.updateLearningState(userId, sessionId, decision, performanceData);

      // Step 6: Generate personalized exercises
      await this.generatePersonalizedExercises(userId, decision, profile);

      // Step 7: Check and record milestones
      await this.checkMilestones(userId, performanceData, profile);

      // Step 8: Record the adaptive feedback decision
      await this.learningRepo.recordAdaptiveFeedback(
        userId,
        sessionId,
        decision.feedbackStrategy,
        decision.difficultyAdjustment,
        decision.newDifficultyLevel,
        decision.rationale
      );

      return decision;
    } catch (error) {
      console.error('Error in adaptive learning analysis:', error);
      throw new Error('Failed to analyze and adapt learning');
    }
  }

  /**
   * AI AGENT DECISION-MAKING: Core intelligence of the system
   * Uses GPT-4o to analyze patterns and make coaching decisions
   */
  private async makeCoachingDecision(
    profile: UserLearningProfile,
    skillProgress: SkillProgress[],
    performanceData: PerformanceAnalysis,
    learningVelocity: number,
    transcript: string,
    language: string
  ): Promise<AdaptiveCoachingDecision> {
    try {
      const prompt = this.buildCoachingPrompt(
        profile,
        skillProgress,
        performanceData,
        learningVelocity,
        transcript,
        language
      );

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI coaching agent specializing in adaptive learning for presentation skills.

Your role is to:
1. Analyze user performance holistically
2. Identify learning patterns and trends
3. Determine optimal difficulty level
4. Choose appropriate feedback strategy
5. Generate actionable recommendations

Be intelligent about difficulty adjustment:
- If user is consistently scoring 80%+, INCREASE difficulty
- If user is scoring 40-70%, MAINTAIN current level
- If user is scoring below 40%, DECREASE difficulty

Choose feedback strategy based on:
- ENCOURAGING: For beginners or users showing low confidence (scores < 50%)
- BALANCED: For intermediate learners making steady progress (scores 50-70%)
- CONSTRUCTIVE: For advanced users who can handle critical feedback (scores 70-85%)
- CHALLENGING: For expert users who need to be pushed (scores 85%+)

Your response must be in valid JSON format.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      return {
        feedbackStrategy: result.feedbackStrategy || 'balanced',
        difficultyAdjustment: result.difficultyAdjustment || 'maintain',
        newDifficultyLevel: result.newDifficultyLevel || profile.adaptiveDifficulty,
        personalizedFeedback: result.personalizedFeedback || 'Good effort! Keep practicing.',
        recommendedExercises: result.recommendedExercises || [],
        rationale: result.rationale || 'Standard coaching approach'
      };
    } catch (error) {
      console.error('Error in AI decision making:', error);
      // Fallback to rule-based decision
      return this.fallbackDecision(profile, performanceData);
    }
  }

  /**
   * Build comprehensive prompt for AI agent
   */
  private buildCoachingPrompt(
    profile: UserLearningProfile,
    skillProgress: SkillProgress[],
    performanceData: PerformanceAnalysis,
    learningVelocity: number,
    transcript: string,
    language: string
  ): string {
    return `
ANALYZE THIS USER'S LEARNING STATE AND MAKE ADAPTIVE COACHING DECISIONS:

USER PROFILE:
- Current Level: ${profile.currentLevel}
- Learning Pace: ${profile.learningPace}
- Total Practice Time: ${profile.totalPracticeTime} minutes
- Current Streak: ${profile.streakDays} days
- Current Difficulty: ${profile.adaptiveDifficulty}/100
- Strong Areas: ${profile.strongAreas.join(', ') || 'None identified yet'}
- Weak Areas: ${profile.weakAreas.join(', ') || 'None identified yet'}
- Preferred Language: ${language}

RECENT PERFORMANCE:
- Overall Score: ${performanceData.overallScore}%
- Content Coverage: ${performanceData.skillScores.contentCoverage}%
- Fluency: ${performanceData.skillScores.fluency}%
- Clarity: ${performanceData.skillScores.clarity}%
- Confidence: ${performanceData.skillScores.confidence}%
- Pace: ${performanceData.skillScores.pace}%
- Pronunciation: ${performanceData.skillScores.pronunciation}%

LEARNING VELOCITY: ${learningVelocity > 0 ? 'Improving' : learningVelocity < 0 ? 'Declining' : 'Stable'} (${learningVelocity} points/session)

SKILL PROGRESS TRENDS:
${skillProgress.map(sp => `- ${sp.skillCategory}: Level ${sp.currentLevel}% (${sp.trend})`).join('\n')}

USER'S LATEST SPEECH SAMPLE:
"${transcript.substring(0, 500)}..."

TASK: Based on this data, provide a JSON response with:
{
  "feedbackStrategy": "encouraging|balanced|constructive|challenging",
  "difficultyAdjustment": "increase|maintain|decrease",
  "newDifficultyLevel": number (0-100),
  "personalizedFeedback": "Detailed, personalized feedback message in ${language}",
  "recommendedExercises": [
    {
      "type": "breathing|pacing|articulation|content_structuring",
      "title": "Exercise title",
      "description": "What this exercise does",
      "difficulty": number (1-10)
    }
  ],
  "rationale": "Explain your coaching decisions and why you chose this approach"
}

IMPORTANT: Be adaptive and intelligent. Don't just give generic feedback - tailor it to the user's specific situation, level, and progress trends.
`;
  }

  /**
   * Fallback decision if AI fails
   */
  private fallbackDecision(
    profile: UserLearningProfile,
    performanceData: PerformanceAnalysis
  ): AdaptiveCoachingDecision {
    const avgScore = performanceData.overallScore;
    let feedbackStrategy: 'encouraging' | 'constructive' | 'challenging' | 'balanced' = 'balanced';
    let difficultyAdjustment: 'increase' | 'maintain' | 'decrease' = 'maintain';
    let newDifficultyLevel = profile.adaptiveDifficulty;

    if (avgScore < 50) {
      feedbackStrategy = 'encouraging';
      difficultyAdjustment = 'decrease';
      newDifficultyLevel = Math.max(20, profile.adaptiveDifficulty - 10);
    } else if (avgScore > 80) {
      feedbackStrategy = 'challenging';
      difficultyAdjustment = 'increase';
      newDifficultyLevel = Math.min(90, profile.adaptiveDifficulty + 10);
    }

    return {
      feedbackStrategy,
      difficultyAdjustment,
      newDifficultyLevel,
      personalizedFeedback: 'Keep practicing to improve your presentation skills.',
      recommendedExercises: [],
      rationale: 'Fallback decision based on score thresholds'
    };
  }

  /**
   * Update learning state after analysis
   */
  private async updateLearningState(
    userId: number,
    sessionId: number,
    decision: AdaptiveCoachingDecision,
    performanceData: PerformanceAnalysis
  ): Promise<void> {
    try {
      // Record skill assessments
      await this.learningRepo.recordSkillAssessment(
        userId,
        sessionId,
        'content_coverage',
        performanceData.skillScores.contentCoverage
      );
      await this.learningRepo.recordSkillAssessment(
        userId,
        sessionId,
        'fluency',
        performanceData.skillScores.fluency
      );
      await this.learningRepo.recordSkillAssessment(
        userId,
        sessionId,
        'clarity',
        performanceData.skillScores.clarity
      );
      await this.learningRepo.recordSkillAssessment(
        userId,
        sessionId,
        'confidence',
        performanceData.skillScores.confidence
      );

      // Update learning profile
      const updates: Partial<UserLearningProfile> = {
        adaptiveDifficulty: decision.newDifficultyLevel,
        lastPracticeDate: new Date()
      };

      // Update strong/weak areas based on performance
      const strongAreas: string[] = [];
      const weakAreas: string[] = [];

      Object.entries(performanceData.skillScores).forEach(([skill, score]) => {
        if (score >= 75) strongAreas.push(skill);
        if (score < 50) weakAreas.push(skill);
      });

      if (strongAreas.length > 0) updates.strongAreas = strongAreas;
      if (weakAreas.length > 0) updates.weakAreas = weakAreas;

      // Determine level progression
      if (performanceData.overallScore >= 85) {
        updates.currentLevel = 'expert';
      } else if (performanceData.overallScore >= 70) {
        updates.currentLevel = 'advanced';
      } else if (performanceData.overallScore >= 50) {
        updates.currentLevel = 'intermediate';
      }

      await this.learningRepo.updateLearningProfile(userId, updates);
    } catch (error) {
      console.error('Error updating learning state:', error);
    }
  }

  /**
   * Generate personalized exercises based on AI recommendations
   */
  private async generatePersonalizedExercises(
    userId: number,
    decision: AdaptiveCoachingDecision,
    profile: UserLearningProfile
  ): Promise<void> {
    try {
      for (const exercise of decision.recommendedExercises) {
        await this.learningRepo.createPersonalizedExercise(
          userId,
          exercise.type,
          exercise.difficulty,
          exercise.title,
          exercise.description,
          await this.generateExerciseInstructions(exercise.type, exercise.difficulty),
          [exercise.type],
          10 // estimated 10 minutes
        );
      }
    } catch (error) {
      console.error('Error generating exercises:', error);
    }
  }

  /**
   * Generate detailed instructions for an exercise
   */
  private async generateExerciseInstructions(type: string, difficulty: number): Promise<string[]> {
    const instructionMap: Record<string, string[]> = {
      breathing: [
        'Find a quiet place to practice',
        'Breathe in slowly for 4 counts',
        'Hold for 4 counts',
        'Exhale for 4 counts',
        'Repeat 10 times before presenting'
      ],
      pacing: [
        'Record yourself presenting',
        'Count the number of words per minute',
        'Aim for 120-150 words per minute',
        'Practice with a metronome if needed',
        'Vary pace for emphasis'
      ],
      articulation: [
        'Practice tongue twisters slowly',
        'Exaggerate mouth movements',
        'Record and listen to yourself',
        'Focus on difficult sounds',
        'Gradually increase speed'
      ],
      content_structuring: [
        'Create an outline before presenting',
        'Use the "Tell them what you\'ll tell them" approach',
        'Organize with clear transitions',
        'End with a strong summary',
        'Practice the flow multiple times'
      ]
    };

    return instructionMap[type] || ['Practice this exercise regularly', 'Track your progress'];
  }

  /**
   * Check and record learning milestones
   */
  private async checkMilestones(
    userId: number,
    performanceData: PerformanceAnalysis,
    profile: UserLearningProfile
  ): Promise<void> {
    try {
      const milestones = await this.learningRepo.getUserMilestones(userId, 100);
      const achievedTypes = new Set(milestones.map(m => m.milestone_type));

      // First practice milestone
      if (!achievedTypes.has('first_practice') && profile.totalPracticeTime === 0) {
        await this.learningRepo.recordMilestone(
          userId,
          'first_practice',
          'First Practice Session',
          'Completed your first practice session!',
          10
        );
      }

      // High score milestone
      if (!achievedTypes.has('high_score_80') && performanceData.overallScore >= 80) {
        await this.learningRepo.recordMilestone(
          userId,
          'high_score_80',
          'Expert Performance',
          'Achieved a score of 80% or higher!',
          50
        );
      }

      // Consistent improvement
      if (performanceData.improvementRate > 15 && !achievedTypes.has('rapid_improvement')) {
        await this.learningRepo.recordMilestone(
          userId,
          'rapid_improvement',
          'Fast Learner',
          'Showed rapid improvement in your skills!',
          30
        );
      }
    } catch (error) {
      console.error('Error checking milestones:', error);
    }
  }

  /**
   * Get comprehensive learning dashboard for user
   */
  async getLearningDashboard(userId: number) {
    try {
      const profile = await this.learningRepo.getOrCreateLearningProfile(userId);
      const skillProgress = await this.learningRepo.getSkillProgress(userId, 30);
      const exercises = await this.learningRepo.getPersonalizedExercises(userId, false);
      const milestones = await this.learningRepo.getUserMilestones(userId, 10);
      const learningVelocity = await this.learningRepo.calculateLearningVelocity(userId);

      return {
        profile,
        skillProgress,
        exercises,
        milestones,
        learningVelocity,
        insights: this.generateInsights(profile, skillProgress, learningVelocity)
      };
    } catch (error) {
      console.error('Error getting learning dashboard:', error);
      throw new Error('Failed to get learning dashboard');
    }
  }

  /**
   * Generate insights from learning data
   */
  private generateInsights(
    profile: UserLearningProfile,
    skillProgress: SkillProgress[],
    velocity: number
  ): string[] {
    const insights: string[] = [];

    if (velocity > 5) {
      insights.push('You\'re improving rapidly! Keep up the great work.');
    } else if (velocity < -5) {
      insights.push('Your performance has declined recently. Consider taking a break or revisiting fundamentals.');
    }

    const improving = skillProgress.filter(sp => sp.trend === 'improving');
    if (improving.length > 0) {
      insights.push(`You're making progress in: ${improving.map(sp => sp.skillCategory).join(', ')}`);
    }

    const declining = skillProgress.filter(sp => sp.trend === 'declining');
    if (declining.length > 0) {
      insights.push(`Focus needed on: ${declining.map(sp => sp.skillCategory).join(', ')}`);
    }

    if (profile.streakDays >= 7) {
      insights.push(`Amazing! You've maintained a ${profile.streakDays}-day practice streak!`);
    }

    return insights;
  }
}
