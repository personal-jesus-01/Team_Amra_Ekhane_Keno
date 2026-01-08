import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Share2, UserCheck, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface CollaborationOverview {
  presentationCount: number;
  activeCollaborations: Array<{
    presentationId: number;
    title: string;
    activeUsers: number;
    role: string;
  }>;
  recentActivity: Array<{
    username: string;
    action: string;
    presentationId: number;
    timestamp: string;
  }>;
  suggestions: Array<{
    presentationId: number;
    title: string;
    suggestedCollaborators: Array<{
      userId: number;
      name: string;
      email: string;
    }>;
  }>;
}

interface CollaborationStats {
  ownedPresentations: number;
  collaboratingOn: number;
  totalCollaborators: number;
  recentActivity: number;
}

interface RecentCollaboration {
  presentationId: number;
  title: string;
  collaborators: number;
  lastActivity: string;
}

export default function CollaborationPage() {
  const [overview, setOverview] = useState<CollaborationOverview | null>(null);
  const [stats, setStats] = useState<CollaborationStats | null>(null);
  const [recentCollabs, setRecentCollabs] = useState<RecentCollaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, statsRes, recentRes] = await Promise.all([
        apiRequest('GET', '/api/collaboration/overview'),
        apiRequest('GET', '/api/collaboration/stats'),
        apiRequest('GET', '/api/collaboration/recent?limit=10'),
      ]);

      const overviewData = await overviewRes.json();
      const statsData = await statsRes.json();
      const recentData = await recentRes.json();

      if (overviewData.success) setOverview(overviewData.data);
      if (statsData.success) setStats(statsData.data);
      if (recentData.success) setRecentCollabs(recentData.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch collaboration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Collaboration Center
          </h1>
          <p className="text-gray-600 mt-1">Manage your team and shared presentations</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Owned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ownedPresentations}</div>
              <p className="text-xs text-gray-500 mt-1">Your presentations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Collaborating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.collaboratingOn}</div>
              <p className="text-xs text-gray-500 mt-1">Shared with others</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Collaborators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCollaborators}</div>
              <p className="text-xs text-gray-500 mt-1">Total team members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Now</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                {stats.recentActivity}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Collaborations</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        {/* Active Collaborations */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Collaborations</CardTitle>
              <CardDescription>Presentations you're actively working on with others</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.activeCollaborations.length ? (
                <div className="space-y-3">
                  {overview.activeCollaborations.map((collab) => (
                    <div key={collab.presentationId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium">{collab.title}</p>
                        <p className="text-sm text-gray-500">{collab.role}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{collab.activeUsers}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No active collaborations</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest changes and contributions</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.recentActivity.length ? (
                <div className="space-y-3">
                  {overview.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Avatar className="h-10 w-10 bg-blue-100">
                        <AvatarFallback className="text-blue-600">
                          {activity.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{activity.username}</p>
                        <p className="text-sm text-gray-600">{activity.action}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-4 w-4" />
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle>Collaboration Suggestions</CardTitle>
              <CardDescription>People who could help with your presentations</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.suggestions.length ? (
                <div className="space-y-4">
                  {overview.suggestions.map((suggestion) => (
                    <div key={suggestion.presentationId} className="border rounded-lg p-4">
                      <p className="font-medium mb-3">{suggestion.title}</p>
                      <div className="space-y-2">
                        {suggestion.suggestedCollaborators.map((collab) => (
                          <div key={collab.userId} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 bg-green-100">
                                <AvatarFallback className="text-green-600">
                                  {collab.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{collab.name}</p>
                                <p className="text-xs text-gray-500">{collab.email}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <UserCheck className="h-4 w-4 mr-1" />
                              Invite
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No suggestions available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
