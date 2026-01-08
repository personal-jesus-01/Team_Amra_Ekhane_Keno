/**
 * Analytics Service - NEW FEATURE
 *
 * Business logic for the Analytics Dashboard feature.
 * Provides insights and trends for user presentations and practice sessions.
 *
 * Design Pattern: Service Layer Pattern
 * Why: Encapsulates business logic, orchestrates repositories, testable
 */

import { AnalyticsRepository } from '../repositories/analytics.repository';
import { PresentationRepository } from '../repositories/presentation.repository';
import type { db } from '../../../server/db';

type Database = typeof db;

export interface DashboardData {
  userStats: {
    totalPresentations: number;
    totalPracticeSessions: number;
    averageScore: number;
    totalSlides: number;
    improvementRate: number | null;
    lastPracticeDate: Date | null;
  };
  recentTrends: {
    date: string;
    avgContentScore: number;
    avgFluencyScore: number;
    avgConfidenceScore: number;
    sessionCount: number;
  }[];
  topPresentations: {
    id: number;
    title: string;
    practiceCount: number;
    averageScore: number;
  }[];
  languagePerformance: {
    language: string;
    averageScore: number;
    sessionCount: number;
  }[];
}

export class AnalyticsService {
  private analyticsRepo: AnalyticsRepository;
  private presentationRepo: PresentationRepository;

  constructor(db: Database) {
    this.analyticsRepo = new AnalyticsRepository(db);
    this.presentationRepo = new PresentationRepository(db);
  }

  /**
   * Get comprehensive dashboard data for user
   */
  async getDashboardData(userId: number): Promise<DashboardData> {
    try {
      // Fetch all analytics data in parallel for performance
      const [
        userAnalytics,
        improvementData,
        practiceTrends,
        topPresentations,
        languagePerformance
      ] = await Promise.all([
        this.analyticsRepo.getUserAnalytics(userId),
        this.analyticsRepo.getImprovementRate(userId),
        this.analyticsRepo.getPracticeTrends(userId, 30),
        this.analyticsRepo.getTopPresentations(userId, 5),
        this.analyticsRepo.getPerformanceByLanguage(userId)
      ]);

      return {
        userStats: {
          ...userAnalytics,
          improvementRate: improvementData?.improvementRate || null
        },
        recentTrends: practiceTrends,
        topPresentations,
        languagePerformance
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error('Failed to fetch dashboard analytics');
    }
  }

  /**
   * Get detailed analytics for specific presentation
   */
  async getPresentationAnalytics(presentationId: number, userId: number) {
    try {
      // Verify user has access to this presentation
      const hasAccess = await this.presentationRepo.hasAccess(userId, presentationId);
      if (!hasAccess) {
        throw new Error('Access denied to presentation');
      }

      const analytics = await this.analyticsRepo.getPresentationAnalytics(presentationId);
      if (!analytics) {
        throw new Error('Presentation not found');
      }

      // Get practice trends for this presentation
      const trends = await this.analyticsRepo.getPracticeTrends(userId, 30);

      return {
        ...analytics,
        trends
      };
    } catch (error) {
      console.error('Error fetching presentation analytics:', error);
      throw error;
    }
  }

  /**
   * Get practice trends with customizable time range
   */
  async getPracticeTrends(userId: number, days: number = 30) {
    try {
      if (days < 1 || days > 365) {
        throw new Error('Days must be between 1 and 365');
      }

      return await this.analyticsRepo.getPracticeTrends(userId, days);
    } catch (error) {
      console.error('Error fetching practice trends:', error);
      throw error;
    }
  }

  /**
   * Get user improvement insights
   */
  async getImprovementInsights(userId: number) {
    try {
      const improvementData = await this.analyticsRepo.getImprovementRate(userId);

      if (!improvementData) {
        return {
          message: 'Not enough data yet. Complete more practice sessions to see improvement trends.',
          hasData: false
        };
      }

      const { improvementRate, firstSessionScore, recentSessionScore } = improvementData;

      let message = '';
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';

      if (improvementRate > 10) {
        message = `Great progress! Your scores have improved by ${improvementRate}% since you started practicing.`;
        sentiment = 'positive';
      } else if (improvementRate > 0) {
        message = `You're improving! Keep practicing to see even better results.`;
        sentiment = 'positive';
      } else if (improvementRate === 0) {
        message = `Your scores are consistent. Try focusing on specific areas to improve further.`;
        sentiment = 'neutral';
      } else {
        message = `Recent scores are lower. Review feedback from recent sessions to identify areas for improvement.`;
        sentiment = 'negative';
      }

      return {
        message,
        sentiment,
        improvementRate,
        firstSessionScore,
        recentSessionScore,
        hasData: true
      };
    } catch (error) {
      console.error('Error fetching improvement insights:', error);
      throw new Error('Failed to fetch improvement insights');
    }
  }

  /**
   * Get personalized recommendations based on analytics
   */
  async getRecommendations(userId: number) {
    try {
      const userAnalytics = await this.analyticsRepo.getUserAnalytics(userId);
      const languagePerformance = await this.analyticsRepo.getPerformanceByLanguage(userId);
      const topPresentations = await this.analyticsRepo.getTopPresentations(userId, 3);

      const recommendations: string[] = [];

      // Check practice frequency
      if (userAnalytics.lastPracticeDate) {
        const daysSinceLastPractice = Math.floor(
          (Date.now() - userAnalytics.lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastPractice > 7) {
          recommendations.push('It\'s been a while! Practice regularly to maintain your skills.');
        } else if (daysSinceLastPractice <= 1) {
          recommendations.push('Great consistency! Keep up the daily practice.');
        }
      }

      // Check average score
      if (userAnalytics.averageScore < 40) {
        recommendations.push('Focus on content coverage - try practicing with the AI-generated speech script.');
      } else if (userAnalytics.averageScore < 60) {
        recommendations.push('You\'re making progress! Work on reducing filler words for better fluency.');
      } else {
        recommendations.push('Excellent performance! Consider challenging yourself with longer presentations.');
      }

      // Check language diversity
      if (languagePerformance.length === 1) {
        recommendations.push('Try practicing in different languages (English, Bengali, Banglish) to expand your skills.');
      }

      // Check presentation variety
      if (topPresentations.length > 0 && userAnalytics.totalPresentations > 5) {
        const topPracticeCount = topPresentations[0].practiceCount;
        const totalPractices = userAnalytics.totalPracticeSessions;

        if (topPracticeCount / totalPractices > 0.7) {
          recommendations.push('You\'re practicing the same presentation a lot. Try practicing different presentations for varied experience.');
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Export analytics data as JSON
   */
  async exportAnalyticsData(userId: number) {
    try {
      const dashboardData = await this.getDashboardData(userId);
      const improvements = await this.getImprovementInsights(userId);
      const recommendations = await this.getRecommendations(userId);

      return {
        exportDate: new Date().toISOString(),
        userId,
        dashboard: dashboardData,
        improvements,
        recommendations
      };
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw new Error('Failed to export analytics data');
    }
  }
}
