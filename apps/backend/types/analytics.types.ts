/**
 * Analytics Service Type Definitions
 * Defines all types and interfaces for the analytics feature
 */

export interface UserAnalytics {
  totalPresentations: number;
  totalPracticeSessions: number;
  averageScore: number;
  totalSlidesCreated: number;
  totalSlidePracticed: number;
  mostUsedLanguage: string;
}

export interface DashboardData {
  userStats: UserAnalytics & { improvementRate: number | null };
  recentTrends: PracticeTrend[];
  topPresentations: TopPresentation[];
  languagePerformance: LanguagePerformance[];
}

export interface PracticeTrend {
  date: string;
  practiceCount: number;
  averageScore: number;
}

export interface TopPresentation {
  id: number;
  title: string;
  practiceCount: number;
  bestScore: number;
}

export interface LanguagePerformance {
  language: string;
  presentations: number;
  averageScore: number;
}

export interface PresentationAnalytics {
  presentationId: number;
  title: string;
  totalPracticeSessions: number;
  averageContentScore: number;
  averageDeliveryScore: number;
  averagePaceScore: number;
  mostPracticedSlide: number;
  practiceHistory: PracticeSummary[];
}

export interface PracticeSummary {
  date: string;
  contentScore: number;
  deliveryScore: number;
  paceScore: number;
}

export interface ImprovementInsight {
  metric: string;
  currentValue: number;
  previousValue: number;
  improvementRate: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PersonalizedRecommendation {
  id: string;
  type: 'content' | 'delivery' | 'pace' | 'practice' | 'general';
  title: string;
  description: string;
  actionItems: string[];
  priority: 'high' | 'medium' | 'low';
  relevantPresentation?: number;
}

export interface AnalyticsExportData {
  exportDate: string;
  userAnalytics: UserAnalytics;
  practiceTrends: PracticeTrend[];
  presentationStats: Array<{
    presentationId: number;
    title: string;
    stats: PresentationAnalytics;
  }>;
  recommendations: PersonalizedRecommendation[];
}
