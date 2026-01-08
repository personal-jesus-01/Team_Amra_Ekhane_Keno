import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SlideTemplateProps {
  onSelect: (template: string) => void;
}

export default function SlideTemplates({ onSelect }: SlideTemplateProps) {
  return (
    <Tabs defaultValue="title" className="w-full">
      <TabsList className="grid grid-cols-5 mb-4">
        <TabsTrigger value="title">Title</TabsTrigger>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="two-column">Two Column</TabsTrigger>
        <TabsTrigger value="image">Image</TabsTrigger>
        <TabsTrigger value="chart">Chart</TabsTrigger>
      </TabsList>
      
      <TabsContent value="title" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TemplateCard 
            title="Basic Title" 
            preview={`# Title Slide\n\n## Subtitle goes here`}
            onSelect={onSelect}
          />
          <TemplateCard 
            title="Title with Bullets" 
            preview={`# Main Title\n\n## Subtitle\n\n* Key point 1\n* Key point 2\n* Key point 3`}
            onSelect={onSelect}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="content" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TemplateCard 
            title="Basic Content" 
            preview={`# Content Slide\n\n* First important point\n* Second important point\n* Third important point with some additional explanation\n* Fourth important point`}
            onSelect={onSelect}
          />
          <TemplateCard 
            title="Numbered List" 
            preview={`# Numbered Steps\n\n1. First step in the process\n2. Second step in the process\n3. Third step with more details\n4. Final step`}
            onSelect={onSelect}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="two-column" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TemplateCard 
            title="Split Content" 
            preview={`# Two Column Layout\n\n## Left Side\n* Point 1\n* Point 2\n\n## Right Side\n* Point A\n* Point B`}
            onSelect={onSelect}
          />
          <TemplateCard 
            title="Compare/Contrast" 
            preview={`# Comparison\n\n## Option A\n* Advantage 1\n* Advantage 2\n\n## Option B\n* Alternative 1\n* Alternative 2`}
            onSelect={onSelect}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="image" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TemplateCard 
            title="Image with Caption" 
            preview={`# Image Title\n\n![Image Description](https://via.placeholder.com/640x360)\n\n## Image Caption or Description`}
            onSelect={onSelect}
          />
          <TemplateCard 
            title="Image with Points" 
            preview={`# Image with Points\n\n![Image Description](https://via.placeholder.com/640x360)\n\n* Key observation 1\n* Key observation 2\n* Key observation 3`}
            onSelect={onSelect}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="chart" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TemplateCard 
            title="Chart with Notes" 
            preview={`# Chart Title\n\n<chart data-config='{"type":"bar","data":{"labels":["A","B","C","D"],"datasets":[{"label":"Values","data":[12,19,3,5]}]},"options":{"responsive":true}}' />\n\n* Insight 1\n* Insight 2`}
            onSelect={onSelect}
          />
          <TemplateCard 
            title="Multiple Charts" 
            preview={`# Multiple Charts\n\n<chart data-config='{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[30,70]}]},"options":{"responsive":true}}' />\n\n<chart data-config='{"type":"line","data":{"labels":["Jan","Feb","Mar"],"datasets":[{"data":[5,10,15]}]},"options":{"responsive":true}}' />`}
            onSelect={onSelect}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

interface TemplateCardProps {
  title: string;
  preview: string;
  onSelect: (content: string) => void;
}

function TemplateCard({ title, preview, onSelect }: TemplateCardProps) {
  const handleClick = () => {
    onSelect(preview);
  };

  // Simplified preview rendering
  const renderPreview = () => {
    const lines = preview.split('\n');
    let previewHtml = '';
    
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      if (line.startsWith('# ')) {
        previewHtml += `<div class="text-xl font-bold">${line.substring(2)}</div>`;
      } else if (line.startsWith('## ')) {
        previewHtml += `<div class="text-lg font-semibold">${line.substring(3)}</div>`;
      } else if (line.startsWith('* ')) {
        previewHtml += `<div class="ml-4">• ${line.substring(2)}</div>`;
      } else if (line.match(/^\d+\. /)) {
        const num = line.match(/^(\d+)\. /)[1];
        previewHtml += `<div class="ml-4">${num}. ${line.substring(num.length + 2)}</div>`;
      } else if (line.startsWith('![')) {
        previewHtml += `<div class="bg-gray-200 p-2 text-center text-sm text-gray-600">[Image Placeholder]</div>`;
      } else if (line.startsWith('<chart')) {
        previewHtml += `<div class="bg-gray-200 p-2 text-center text-sm text-gray-600">[Chart Placeholder]</div>`;
      } else if (line.trim() !== '') {
        previewHtml += `<div>${line}</div>`;
      }
    }
    
    return previewHtml;
  };

  return (
    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
      <div className="text-lg font-medium mb-2">{title}</div>
      <div className="h-40 overflow-hidden bg-gray-50 p-3 mb-2 text-sm rounded border border-gray-200" 
           dangerouslySetInnerHTML={{ __html: renderPreview() }} />
      <Button variant="outline" size="sm" onClick={handleClick} className="w-full">
        Use Template
      </Button>
    </Card>
  );
}