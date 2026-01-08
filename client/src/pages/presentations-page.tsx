import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import PresentationCard from "@/components/presentation-card";
import PresentationCreationFlow from "@/components/presentation-creation-flow";
import { PresentationWithMeta } from "@/lib/types";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function PresentationsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch presentations
  const {
    data: presentations = [],
    isLoading: presentationsLoading,
    error: presentationsError,
  } = useQuery<PresentationWithMeta[]>({
    queryKey: ["/api/presentations"],
  });

  // Fetch shared presentations
  const {
    data: sharedPresentations = [],
    isLoading: sharedLoading,
    error: sharedError,
  } = useQuery<PresentationWithMeta[]>({
    queryKey: ["/api/presentations/shared"],
  });



  // Filter and sort presentations
  const filterAndSortPresentations = (items: PresentationWithMeta[]) => {
    // First filter by search term
    let filtered = items;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = items.filter((p) =>
        p.title.toLowerCase().includes(term)
      );
    }

    // Then sort
    return [...filtered].sort((a, b) => {
      if (sortBy === "updated") {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      } else if (sortBy === "created") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else {
        return 0;
      }
    });
  };

  const filteredPresentations = filterAndSortPresentations(presentations);
  const filteredSharedPresentations = filterAndSortPresentations(sharedPresentations);

  // Get active presentations based on tab
  const activePresentations = activeTab === "all" 
    ? filteredPresentations 
    : activeTab === "shared" 
      ? filteredSharedPresentations 
      : [];

  const isLoading = 
    (activeTab === "all" && presentationsLoading) || 
    (activeTab === "shared" && sharedLoading);
  
  const hasError = 
    (activeTab === "all" && presentationsError) ||
    (activeTab === "shared" && sharedError);

  // Function to render presentations grid
  const renderPresentationsGrid = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="bg-red-50 p-4 rounded-md text-center">
          <p className="text-red-500">Failed to load presentations. Please try again.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      );
    }

    if (activePresentations.length === 0) {
      return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center backdrop-blur-sm">
          <h3 className="text-gray-300 font-medium">No presentations found</h3>
          {activeTab === "all" ? (
            <>
              <p className="mt-1 text-gray-400 text-sm">
                Create your first presentation to get started
              </p>
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Presentation
              </Button>
            </>
          ) : (
            <p className="mt-1 text-gray-400 text-sm">
              No one has shared any presentations with you yet
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 presentation-grid">
        {activePresentations.map((presentation, index) => (
          <PresentationCard
            key={presentation.id}
            presentation={presentation}
            colorScheme={index % 3 === 0 ? "blue" : index % 3 === 1 ? "green" : "purple"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-900">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <h1 className="text-2xl font-semibold text-white">My Presentations</h1>
                <p className="mt-1 text-sm text-gray-300">
                  Manage and organize all your presentations
                </p>
              </div>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Presentation
              </Button>
            </div>

            <div className="mt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <TabsList className="mb-2 sm:mb-0">
                    <TabsTrigger value="all">All Presentations</TabsTrigger>
                    <TabsTrigger value="shared">Shared with me</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search presentations..."
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="h-4 w-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="updated">Last Updated</SelectItem>
                        <SelectItem value="created">Date Created</SelectItem>
                        <SelectItem value="title">Title A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6">
                  <TabsContent value="all" className="pt-4">
                    {renderPresentationsGrid()}
                  </TabsContent>
                  
                  <TabsContent value="shared" className="pt-4">
                    {renderPresentationsGrid()}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
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
