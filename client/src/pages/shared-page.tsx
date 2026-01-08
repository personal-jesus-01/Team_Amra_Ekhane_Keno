import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Users, FileText, Loader2 } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SharedPage() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col w-full flex-1 overflow-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-700 bg-gray-900 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-4">
            <h1 className="text-xl font-semibold text-white">Shared with me</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12 animate-slide-up">
              <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No shared presentations
              </h3>
              <p className="text-gray-400 mb-6">
                Presentations shared with you will appear here
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}