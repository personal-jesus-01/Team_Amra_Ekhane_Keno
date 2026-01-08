import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, TrendingUp, Award, Calendar, Download, RefreshCw } from 'lucide-react';

interface DashboardData {
  userStats: {
    totalPresentations: number;
    totalPracticeSessions: number;
    averageScore: number;
    improvementRate: number | null;
  };
  recentTrends: Array<{
    date: string;
    practiceCount: number;
    averageScore: number;
  }>;
  topPresentations: Array<{
    id: number;
    title: string;
    practiceCount: number;
    bestScore: number;
  }>;
  languagePerformance: Array<{
    language: string;
    presentations: number;
    averageScore: number;
  }>;
}

interface PresentationAnalytics {
  presentationId: number;
  title: string;
  totalPracticeSessions: number;
  averageContentScore: number;
  averageDeliveryScore: number;
  averagePaceScore: number;
  mostPracticedSlide: number;
  practiceHistory: Array<{
    date: string;
    contentScore: number;
    deliveryScore: number;
    paceScore: number;
  }>;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [presentationAnalytics, setPresentationAnalytics] = useState<PresentationAnalytics | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest('GET', '/api/analytics/dashboard');
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.message || 'Failed to fetch analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch presentation analytics
  const fetchPresentationAnalytics = async (presentationId: number) => {
    try {
      const response = await apiRequest('GET', `/api/analytics/presentation/${presentationId}`);
      const data = await response.json();
      if (data.success) {
        setPresentationAnalytics(data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch presentation analytics:', err);
    }
  };

  // Handle presentation selection
  const handleSelectPresentation = (id: number) => {
    setSelectedPresentation(id);
    fetchPresentationAnalytics(id);
  };

  // Export analytics
  const handleExportAnalytics = async () => {
    try {
      const response = await apiRequest('GET', '/api/analytics/export');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Failed to export analytics:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <RefreshCw className="h-8 w-8 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert>
        <AlertDescription>No analytics data available yet. Start practicing to see your statistics!</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Track your presentation practice progress and performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportAnalytics} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Presentations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.userStats.totalPresentations}</div>
            <p className="text-xs text-gray-500 mt-1">Created presentations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Practice Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.userStats.totalPracticeSessions}</div>
            <p className="text-xs text-gray-500 mt-1">Total practice attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.userStats.averageScore}/100</div>
            <p className="text-xs text-gray-500 mt-1">Across all sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Improvement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              {dashboardData.userStats.improvementRate ? `${dashboardData.userStats.improvementRate}%` : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Month-over-month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Practice Trends</TabsTrigger>
          <TabsTrigger value="presentations">Top Presentations</TabsTrigger>
          <TabsTrigger value="languages">Language Performance</TabsTrigger>
        </TabsList>

        {/* Practice Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Practice Activity Over Time</CardTitle>
              <CardDescription>Daily practice sessions and average scores for the last {timeRange} days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={dashboardData.recentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="practiceCount" 
                    stroke="#3b82f6" 
                    name="Practice Count"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="averageScore" 
                    stroke="#10b981" 
                    name="Avg Score"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Presentations */}
        <TabsContent value="presentations">
          <Card>
            <CardHeader>
              <CardTitle>Top Practiced Presentations</CardTitle>
              <CardDescription>Your most practiced presentations by session count</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.topPresentations.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.topPresentations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="practiceCount" fill="#3b82f6" name="Practice Count" />
                      <Bar dataKey="bestScore" fill="#10b981" name="Best Score" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-6 space-y-2">
                    {dashboardData.topPresentations.map((pres) => (
                      <Button
                        key={pres.id}
                        variant={selectedPresentation === pres.id ? 'default' : 'outline'}
                        className="w-full justify-start text-left"
                        onClick={() => handleSelectPresentation(pres.id)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{pres.title}</p>
                          <p className="text-sm text-gray-500">
                            {pres.practiceCount} sessions • Best: {pres.bestScore}/100
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">No presentation data available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Performance */}
        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Language</CardTitle>
              <CardDescription>How you perform in different languages</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.languagePerformance.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.languagePerformance}
                        dataKey="presentations"
                        nameKey="language"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {dashboardData.languagePerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dashboardData.languagePerformance.map((lang, idx) => (
                      <Card key={lang.language} className="bg-gray-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{lang.language}</p>
                              <p className="text-sm text-gray-600">{lang.presentations} presentations</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">{lang.averageScore}/100</p>
                              <div 
                                className="w-12 h-2 bg-gray-200 rounded-full mt-1"
                                style={{
                                  background: COLORS[idx % COLORS.length]
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No language data available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Presentation Details */}
      {selectedPresentation && presentationAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {presentationAnalytics.title} - Detailed Analytics
            </CardTitle>
            <CardDescription>Performance breakdown for this specific presentation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-blue-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 font-medium">Content Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {presentationAnalytics.averageContentScore.toFixed(1)}/100
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-green-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 font-medium">Delivery Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {presentationAnalytics.averageDeliveryScore.toFixed(1)}/100
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 font-medium">Pace Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {presentationAnalytics.averagePaceScore.toFixed(1)}/100
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Practice History Chart */}
            {presentationAnalytics.practiceHistory.length > 0 && (
              <>
                <div>
                  <h4 className="font-semibold mb-4">Practice History</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={presentationAnalytics.practiceHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="contentScore" stroke="#3b82f6" name="Content" />
                      <Line type="monotone" dataKey="deliveryScore" stroke="#10b981" name="Delivery" />
                      <Line type="monotone" dataKey="paceScore" stroke="#f59e0b" name="Pace" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Total Practice Sessions</p>
                <p className="text-xl font-bold">{presentationAnalytics.totalPracticeSessions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Most Practiced Slide</p>
                <p className="text-xl font-bold">Slide {presentationAnalytics.mostPracticedSlide}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
