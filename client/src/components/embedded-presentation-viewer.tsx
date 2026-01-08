import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Maximize2, Eye, Edit, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface EmbeddedPresentationViewerProps {
  presentation: {
    id: number;
    title: string;
    google_slides_id?: string;
    google_slides_url?: string;
    status: string;
    created_at?: string;
    updated_at?: string;
  };
  embedUrl?: string;
  className?: string;
}

export default function EmbeddedPresentationViewer({ 
  presentation, 
  embedUrl,
  className = "" 
}: EmbeddedPresentationViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'embed' | 'preview'>('embed');

  // Generate embed URL if not provided
  const finalEmbedUrl = embedUrl || 
    (presentation.google_slides_id 
      ? `https://docs.google.com/presentation/d/${presentation.google_slides_id}/embed?start=false&loop=false&delayms=3000`
      : null);

  const previewUrl = presentation.google_slides_id 
    ? `https://docs.google.com/presentation/d/${presentation.google_slides_id}/preview`
    : null;

  const editUrl = presentation.google_slides_url;

  if (!finalEmbedUrl && !previewUrl) {
    return (
      <Card className={`${className} border-dashed`}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Presentation Available
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              This presentation hasn't been generated with Google Slides yet.
            </p>
            <Button variant="outline" size="sm">
              Generate Slides
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const PresentationEmbed = ({ url, isFullscreen }: { url: string; isFullscreen?: boolean }) => (
    <iframe
      src={url}
      className={`w-full border-0 rounded-lg ${
        isFullscreen ? 'h-[90vh]' : 'h-[400px] lg:h-[500px]'
      }`}
      allowFullScreen
      title={`${presentation.title} - Presentation Viewer`}
      loading="lazy"
    />
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-lg">{presentation.title}</CardTitle>
            <Badge 
              variant={presentation.status === 'published' ? 'default' : 'secondary'}
            >
              {presentation.status}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1">
              <Button
                variant={viewMode === 'embed' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('embed')}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview')}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Fullscreen Dialog */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl h-[95vh] p-6">
                <DialogHeader>
                  <DialogTitle>{presentation.title} - Full View</DialogTitle>
                </DialogHeader>
                {(viewMode === 'embed' ? finalEmbedUrl : previewUrl) && (
                  <PresentationEmbed 
                    url={viewMode === 'embed' ? finalEmbedUrl! : previewUrl!} 
                    isFullscreen={true}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* External Edit Link */}
            {editUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(editUrl, '_blank')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {/* External View Link */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = viewMode === 'embed' ? finalEmbedUrl : previewUrl;
                if (url) window.open(url, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Embedded Presentation */}
        {viewMode === 'embed' && finalEmbedUrl && (
          <div className="space-y-4">
            <PresentationEmbed url={finalEmbedUrl} />
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Created: {presentation.created_at 
                  ? new Date(presentation.created_at).toLocaleDateString() 
                  : 'Unknown'}
              </span>
              <span>
                Updated: {presentation.updated_at 
                  ? new Date(presentation.updated_at).toLocaleDateString() 
                  : 'Unknown'}
              </span>
            </div>
          </div>
        )}

        {/* Preview Mode */}
        {viewMode === 'preview' && previewUrl && (
          <div className="space-y-4">
            <PresentationEmbed url={previewUrl} />
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Preview Mode:</strong> This shows how your presentation will appear to viewers. 
                Use the embed mode to see the full interactive experience.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {editUrl && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => window.open(editUrl, '_blank')}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit in Google Slides
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(
              `https://docs.google.com/presentation/d/${presentation.google_slides_id}/present`, 
              '_blank'
            )}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Present
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const shareUrl = `https://docs.google.com/presentation/d/${presentation.google_slides_id}/edit?usp=sharing`;
              navigator.clipboard.writeText(shareUrl);
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Copy Share Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}