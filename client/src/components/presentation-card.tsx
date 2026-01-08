import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { FileText, Trash2, Loader2 } from "lucide-react";
import { PresentationWithMeta } from "@/lib/types";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { useState } from "react";

interface PresentationCardProps {
  presentation: PresentationWithMeta;
  className?: string;
  colorScheme?: "blue" | "green" | "purple";
}

export default function PresentationCard({
  presentation,
  className,
  colorScheme = "blue",
}: PresentationCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const colorClasses = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-green-500 to-teal-600",
    purple: "from-purple-500 to-pink-600",
  };

  const formattedDate = presentation.updated_at
    ? formatDistanceToNow(new Date(presentation.updated_at), { addSuffix: true })
    : "";

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/presentations/${presentation.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      toast({
        title: "Presentation deleted",
        description: "The presentation has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete presentation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    if (presentation.external_url) {
      window.open(presentation.external_url, '_blank');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteModal(false);
  };

  return (
    <div
      className={cn(
        "bg-gray-800 border border-gray-700 overflow-hidden shadow-lg rounded-lg hover:bg-gray-700 transition-all duration-300 hover:cursor-pointer hover:shadow-xl group hover:scale-102",
        className
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "h-32 bg-gradient-to-r relative overflow-hidden",
          colorClasses[colorScheme]
        )}
      >
        {/* Presentation Thumbnail */}
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Slide mockup layout */}
            <div className="bg-white/90 rounded-sm shadow-lg w-20 h-16 flex flex-col p-2 transform transition-all duration-300 group-hover:scale-105">
              <div className="bg-blue-600 h-2 w-12 rounded-sm mb-1"></div>
              <div className="space-y-1">
                <div className="bg-gray-300 h-1 w-16 rounded-sm"></div>
                <div className="bg-gray-300 h-1 w-14 rounded-sm"></div>
                <div className="bg-gray-300 h-1 w-12 rounded-sm"></div>
              </div>
              <div className="mt-auto bg-blue-100 h-3 w-full rounded-sm flex items-center justify-center">
                <div className="bg-blue-500 h-1 w-8 rounded-sm"></div>
              </div>
            </div>
            {/* Slide count indicator */}
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
              {presentation.slides_count || 0}
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium text-white truncate smooth-transition group-hover:text-indigo-300">
            {presentation.title}
          </h3>
          <span className="text-xs text-gray-400 smooth-transition group-hover:text-gray-300">{formattedDate}</span>
        </div>
        <p className="mt-1 text-sm text-gray-400 truncate smooth-transition group-hover:text-gray-300">
          {presentation.external_url ? 'Click to open in Google Slides' : 'Presentation ready'}
        </p>
        <p className="mt-1 text-sm text-gray-400 truncate smooth-transition group-hover:text-gray-300">
          {presentation.slides_count} slides - Last edited{" "}
          {formattedDate.replace(" ago", "")}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {presentation.collaborators && presentation.collaborators.length > 0 ? (
              <AvatarGroup users={presentation.collaborators} limit={3} />
            ) : (
              <div className="text-xs text-gray-500 smooth-transition group-hover:text-gray-400">Just you</div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              className={cn(
                "rounded-full p-2 text-gray-500 hover:text-red-400 focus:outline-none btn-danger focus-ring",
                "transform transition-all duration-300 hover:scale-110 active:scale-95",
                deleteMutation.isPending && "animate-spin"
              )}
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              title={deleteMutation.isPending ? "Deleting..." : "Delete presentation"}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress indicator for deletion */}
      {deleteMutation.isPending && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center rounded-lg animate-bounce-in">
          <div className="text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Deleting presentation...</p>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title={presentation.title}
        itemType="presentation"
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}