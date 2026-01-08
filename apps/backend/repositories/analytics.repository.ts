/**
 * Analytics Repository - NEW FEATURE
 *
 * Handles analytics queries for the new Analytics Dashboard feature.
 * Provides insights into presentation usage and practice performance.
 */

import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { presentations, coachSessions } from '../../../shared/schema';
import type { db } from '../../../server/db';

type Database = typeof db;

export interface UserAnalytics {
  totalPresentations: number;
  totalPracticeSessions: number;
  averageScore: number;
  totalSlides: number;
  lastPracticeDate: Date | null;
}

export interface PresentationAnalytics {
  presentationId: number;
  title: string;
  practiceCount: number;
  averageContentScore: number;
  averageFluencyScore: number;
  averageConfidenceScore: number;
  lastPracticeDate: Date | null;
}

export interface PracticeTrend {
  date: string;
  avgContentScore: number;
  avgFluencyScore: number;
  avgConfidenceScore: number;
  sessionCount: number;
}

export interface TopPresentation {
  id: number;
  title: string;
  practiceCount: number;
  averageScore: number;
}

export class AnalyticsRepository {
  constructor(private db: Database) {}

  /**
   * Get comprehensive user analytics
   */
  async getUserAnalytics(userId: number): Promise<UserAnalytics> {
    try {
      // Get presentation stats
      const presentationStats = await this.db
        .select({
          totalPresentations: sql<number>`COUNT(*)`,
          totalSlides: sql<number>`COALESCE(SUM(${presentations.slides_count}), 0)`
        })
        .from(presentations)
        .where(eq(presentations.owner_id, userId));

      // Get practice session stats
      const practiceStats = await this.db
        .select({
          totalPracticeSessions: sql<number>`COUNT(*)`,
          averageContentScore: sql<number>`AVG(${coachSessions.content_coverage})`,
          averageFluencyScore: sql<number>`AVG(${coachSessions.fluency_score})`,
          averageConfidenceScore: sql<number>`AVG(${coachSessions.confidence_score})`,
          lastPracticeDate: sql<Date>`MAX(${coachSessions.created_at})`
        })
        .from(coachSessions)
        .where(eq(coachSessions.user_id, userId));

      const presentationData = presentationStats[0];
      const practiceData = practiceStats[0];

      // Calculate composite average score
      const avgContent = Number(practiceData?.averageContentScore || 0);
      const avgFluency = Number(practiceData?.averageFluencyScore || 0);
      const avgConfidence = Number(practiceData?.averageConfidenceScore || 0);
      const averageScore = (avgContent + avgFluency + avgConfidence) / 3;

      return {
        totalPresentations: Number(presentationData?.totalPresentations || 0),
        totalPracticeSessions: Number(practiceData?.totalPracticeSessions || 0),
        averageScore: Math.round(averageScore),
        totalSlides: Number(presentationData?.totalSlides || 0),
        lastPracticeDate: practiceData?.lastPracticeDate || null
      };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw new Error('Failed to fetch user analytics');
    }
  }

  /**
   * Get analytics for specific presentation
   */
  async getPresentationAnalytics(presentationId: number): Promise<PresentationAnalytics | null> {
    try {
      // Get presentation info
      const presentation = await this.db
        .select({
          id: presentations.id,
          title: presentations.title
        })
        .from(presentations)
        .where(eq(presentations.id, presentationId))
        .limit(1);

      if (!presentation.length) return null;

      // Get practice stats for this presentation
      const stats = await this.db
        .select({
          practiceCount: sql<number>`COUNT(*)`,
          averageContentScore: sql<number>`AVG(${coachSessions.content_coverage})`,
          averageFluencyScore: sql<number>`AVG(${coachSessions.fluency_score})`,
          averageConfidenceScore: sql<number>`AVG(${coachSessions.confidence_score})`,
          lastPracticeDate: sql<Date>`MAX(${coachSessions.created_at})`
        })
        .from(coachSessions)
        .where(eq(coachSessions.presentation_id, presentationId));

      const statData = stats[0];

      return {
        presentationId: presentation[0].id,
        title: presentation[0].title,
        practiceCount: Number(statData?.practiceCount || 0),
        averageContentScore: Math.round(Number(statData?.averageContentScore || 0)),
        averageFluencyScore: Math.round(Number(statData?.averageFluencyScore || 0)),
        averageConfidenceScore: Math.round(Number(statData?.averageConfidenceScore || 0)),
        lastPracticeDate: statData?.lastPracticeDate || null
      };
    } catch (error) {
      console.error('Error fetching presentation analytics:', error);
      throw new Error('Failed to fetch presentation analytics');
    }
  }

  /**
   * Get practice trends over time (last 30 days)
   */
  async getPracticeTrends(userId: number, days: number = 30): Promise<PracticeTrend[]> {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);

      const trends = await this.db
        .select({
          date: sql<string>`DATE(${coachSessions.created_at})`,
          avgContentScore: sql<number>`AVG(${coachSessions.content_coverage})`,
          avgFluencyScore: sql<number>`AVG(${coachSessions.fluency_score})`,
          avgConfidenceScore: sql<number>`AVG(${coachSessions.confidence_score})`,
          sessionCount: sql<number>`COUNT(*)`
        })
        .from(coachSessions)
        .where(
          and(
            eq(coachSessions.user_id, userId),
            gte(coachSessions.created_at, daysAgo)
          )
        )
        .groupBy(sql`DATE(${coachSessions.created_at})`)
        .orderBy(sql`DATE(${coachSessions.created_at}) ASC`);

      return trends.map(trend => ({
        date: trend.date,
        avgContentScore: Math.round(Number(trend.avgContentScore || 0)),
        avgFluencyScore: Math.round(Number(trend.avgFluencyScore || 0)),
        avgConfidenceScore: Math.round(Number(trend.avgConfidenceScore || 0)),
        sessionCount: Number(trend.sessionCount)
      }));
    } catch (error) {
      console.error('Error fetching practice trends:', error);
      throw new Error('Failed to fetch practice trends');
    }
  }

  /**
   * Get top practiced presentations
   */
  async getTopPresentations(userId: number, limit: number = 5): Promise<TopPresentation[]> {
    try {
      const results = await this.db
        .select({
          id: presentations.id,
          title: presentations.title,
          practiceCount: sql<number>`COUNT(${coachSessions.id})`,
          avgContentScore: sql<number>`AVG(${coachSessions.content_coverage})`,
          avgFluencyScore: sql<number>`AVG(${coachSessions.fluency_score})`,
          avgConfidenceScore: sql<number>`AVG(${coachSessions.confidence_score})`
        })
        .from(presentations)
        .leftJoin(coachSessions, eq(presentations.id, coachSessions.presentation_id))
        .where(eq(presentations.owner_id, userId))
        .groupBy(presentations.id)
        .orderBy(desc(sql`COUNT(${coachSessions.id})`))
        .limit(limit);

      return results.map(result => {
        const avgContent = Number(result.avgContentScore || 0);
        const avgFluency = Number(result.avgFluencyScore || 0);
        const avgConfidence = Number(result.avgConfidenceScore || 0);
        const averageScore = (avgContent + avgFluency + avgConfidence) / 3;

        return {
          id: result.id,
          title: result.title,
          practiceCount: Number(result.practiceCount),
          averageScore: Math.round(averageScore)
        };
      });
    } catch (error) {
      console.error('Error fetching top presentations:', error);
      throw new Error('Failed to fetch top presentations');
    }
  }

  /**
   * Get practice performance by language
   */
  async getPerformanceByLanguage(userId: number): Promise<{ language: string; averageScore: number; sessionCount: number }[]> {
    try {
      const results = await this.db
        .select({
          language: coachSessions.language,
          avgContentScore: sql<number>`AVG(${coachSessions.content_coverage})`,
          avgFluencyScore: sql<number>`AVG(${coachSessions.fluency_score})`,
          avgConfidenceScore: sql<number>`AVG(${coachSessions.confidence_score})`,
          sessionCount: sql<number>`COUNT(*)`
        })
        .from(coachSessions)
        .where(eq(coachSessions.user_id, userId))
        .groupBy(coachSessions.language);

      return results.map(result => {
        const avgContent = Number(result.avgContentScore || 0);
        const avgFluency = Number(result.avgFluencyScore || 0);
        const avgConfidence = Number(result.avgConfidenceScore || 0);
        const averageScore = (avgContent + avgFluency + avgConfidence) / 3;

        return {
          language: result.language || 'english',
          averageScore: Math.round(averageScore),
          sessionCount: Number(result.sessionCount)
        };
      });
    } catch (error) {
      console.error('Error fetching performance by language:', error);
      throw new Error('Failed to fetch language performance');
    }
  }

  /**
   * Get improvement rate (comparing first vs recent sessions)
   */
  async getImprovementRate(userId: number): Promise<{
    improvementRate: number;
    firstSessionScore: number;
    recentSessionScore: number;
  } | null> {
    try {
      // Get first 3 sessions average
      const firstSessions = await this.db
        .select({
          avgScore: sql<number>`AVG((${coachSessions.content_coverage} + ${coachSessions.fluency_score} + ${coachSessions.confidence_score}) / 3)`
        })
        .from(coachSessions)
        .where(eq(coachSessions.user_id, userId))
        .orderBy(coachSessions.created_at)
        .limit(3);

      // Get last 3 sessions average
      const recentSessions = await this.db
        .select({
          avgScore: sql<number>`AVG((${coachSessions.content_coverage} + ${coachSessions.fluency_score} + ${coachSessions.confidence_score}) / 3)`
        })
        .from(coachSessions)
        .where(eq(coachSessions.user_id, userId))
        .orderBy(desc(coachSessions.created_at))
        .limit(3);

      const firstScore = Number(firstSessions[0]?.avgScore || 0);
      const recentScore = Number(recentSessions[0]?.avgScore || 0);

      if (firstScore === 0) return null;

      const improvementRate = ((recentScore - firstScore) / firstScore) * 100;

      return {
        improvementRate: Math.round(improvementRate),
        firstSessionScore: Math.round(firstScore),
        recentSessionScore: Math.round(recentScore)
      };
    } catch (error) {
      console.error('Error calculating improvement rate:', error);
      throw new Error('Failed to calculate improvement rate');
    }
  }
}
