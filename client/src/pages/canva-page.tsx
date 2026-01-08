import React from 'react';
import { Helmet } from 'react-helmet';
import { CanvaIntegration } from '@/components/canva/CanvaIntegration';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';

/**
 * Page component for Canva integration
 */
export default function CanvaPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <>
      <Helmet>
        <title>Create with Canva | Presentations AI</title>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto py-4 px-4 md:px-6">
            <h1 className="text-2xl font-bold">Create with Canva</h1>
            <p className="text-muted-foreground mt-1">
              Design beautiful presentations using Canva's powerful tools
            </p>
          </div>
        </header>
        
        <main>
          <CanvaIntegration />
        </main>
      </div>
    </>
  );
}