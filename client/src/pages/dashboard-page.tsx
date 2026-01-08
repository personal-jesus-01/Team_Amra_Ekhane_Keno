import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  FileText,
  Plus,
  Loader2,
  Presentation,
  Sparkles,
  Clock,
  Mic,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PresentationCard from "@/components/presentation-card";
import PresentationCreationFlow from "@/components/presentation-creation-flow";
import { PresentationWithMeta } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch presentations with fresh data
  const {
    data: presentations = [],
    isLoading: presentationsLoading,
    error: presentationsError,
    refetch: refetchPresentations,
  } = useQuery<PresentationWithMeta[]>({
    queryKey: ["/api/presentations"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Sort presentations by updated_at
  const recentPresentations = [...presentations]
    .sort((a, b) => {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 6);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col w-full flex-1 overflow-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-4">
            <Logo className="hidden md:block" />
          </div>
        </header>

        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Welcome back, {user?.name || user?.username}
                  </h1>
                  <p className="text-lg text-gray-400">
                    Create stunning presentations with AI-powered design and content generation.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-4 rounded-xl border border-indigo-500/30">
                    <Presentation className="h-12 w-12 text-indigo-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Section - Create New Presentation */}
            <Card className="mb-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 border-0 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-6 md:mb-0 flex-1">
                    <h2 className="text-3xl font-bold mb-3">Create Your Next Presentation</h2>
                    <p className="text-indigo-100 mb-6 text-lg">
                      Transform your ideas into professional slides with AI assistance
                    </p>
                    <Button 
                      onClick={() => setCreateModalOpen(true)}
                      size="lg"
                      className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Start Creating
                    </Button>
                  </div>
                  <div className="hidden md:flex md:ml-8">
                    <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
                      <Presentation className="h-16 w-16 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-indigo-400" />
                    Total Presentations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-white">{presentations.length}</span>
                    <div className="ml-3 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                      Active
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                    <Plus className="h-4 w-4 mr-2 text-indigo-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setCreateModalOpen(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300 hover:scale-102"
                    variant="default"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Presentation
                  </Button>
                  <Link href="/simple-practice" className="w-full">
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 hover:scale-102"
                      variant="default"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Working Practice Recorder
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-400">
                    {presentations.length > 0 ? `Last created ${new Date().toLocaleDateString()}` : 'No activity yet'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Presentations */}
            <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Your Presentations</CardTitle>
                  <Link
                    href="/presentations"
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-300 px-3 py-1 rounded-md hover:bg-indigo-400/10"
                  >
                    View all
                  </Link>
                </div>
                <CardDescription className="text-gray-400">
                  {presentations.length === 0 
                    ? 'Create your first presentation to get started' 
                    : `${presentations.length} presentation${presentations.length === 1 ? '' : 's'} total`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {presentationsLoading ? (
                  <div className="flex flex-col justify-center items-center py-16 space-y-6">
                    <div className="relative">
                      <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
                    </div>
                    <p className="text-gray-400 text-sm">Loading your presentations...</p>
                    {/* Loading skeletons */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full mt-8">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-700 rounded-lg overflow-hidden animate-pulse">
                          <div className="h-32 bg-gray-600"></div>
                          <div className="p-4 space-y-3">
                            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-600 rounded w-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : presentationsError ? (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
                    <p className="text-red-400">
                      Failed to load presentations. Please try again.
                    </p>
                  </div>
                ) : recentPresentations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-gray-700/50 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <Presentation className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                      No presentations yet
                    </h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                      Create your first presentation to see it here. Our AI will help you build professional slides in minutes.
                    </p>
                    <Button
                      onClick={() => setCreateModalOpen(true)}
                      size="lg"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Presentation
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 presentation-grid">
                    {recentPresentations.map((presentation, index) => (
                      <PresentationCard
                        key={presentation.id}
                        presentation={presentation}
                        colorScheme={
                          index % 3 === 0
                            ? "blue"
                            : index % 3 === 1
                            ? "green"
                            : "purple"
                        }
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <PresentationCreationFlow
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}