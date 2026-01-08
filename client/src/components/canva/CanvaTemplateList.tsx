import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CanvaTemplate } from '@/models/canva.model';
import { CanvaService } from '@/services/canva.service';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface CanvaTemplateListProps {
  onSelectTemplate: (template: CanvaTemplate) => void;
  category?: string;
  limit?: number;
}

/**
 * Component to display a list of Canva templates
 */
export function CanvaTemplateList({ 
  onSelectTemplate,
  category,
  limit = 10
}: CanvaTemplateListProps) {
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['/api/canva/templates', category, limit],
    queryFn: () => CanvaService.getTemplates(category, limit)
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardHeader className="p-0">
              <Skeleton className="h-40 w-full" />
            </CardHeader>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-600">
        Failed to load templates. Please try again later.
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-md text-gray-500">
        No templates available.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="overflow-hidden h-full flex flex-col">
          <CardHeader className="p-0">
            {template.thumbnail_url ? (
              <img 
                src={template.thumbnail_url} 
                alt={template.name} 
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400">
                No Preview
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4 flex-grow">
            <h3 className="text-lg font-medium">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            )}
          </CardContent>
          <CardFooter className="px-4 pb-4 pt-0">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onSelectTemplate(template)}
            >
              Use Template
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}