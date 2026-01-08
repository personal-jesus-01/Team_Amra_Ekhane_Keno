import { useState } from 'react';
import { ImprovementTip } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Dumbbell } from 'lucide-react';

interface CoachTipsProps {
  improvementTips: ImprovementTip[];
  strengths: string[];
  practiceExercises: string[];
}

export default function CoachTips({
  improvementTips,
  strengths,
  practiceExercises
}: CoachTipsProps) {
  const [activeTab, setActiveTab] = useState('improvements');
  
  // Sort tips by importance (highest first)
  const sortedTips = [...improvementTips].sort((a, b) => b.importance - a.importance);
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="improvements" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Improvements
          </TabsTrigger>
          <TabsTrigger value="strengths" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Strengths
          </TabsTrigger>
          <TabsTrigger value="exercises" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Exercises
          </TabsTrigger>
        </TabsList>
        
        {/* Improvements Tab */}
        <TabsContent value="improvements" className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            Here are some key areas for improvement, listed in order of priority.
          </p>
          
          {sortedTips.length > 0 ? (
            <div className="grid gap-4">
              {sortedTips.map((tip, i) => (
                <Card key={i} className={`${getImportanceBorderClass(tip.importance)}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{tip.area}</CardTitle>
                      <Badge variant={getImportanceVariant(tip.importance)}>
                        {getImportanceLabel(tip.importance)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{tip.tip}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-lg">
              <p className="text-gray-500">No improvement tips available</p>
            </div>
          )}
        </TabsContent>
        
        {/* Strengths Tab */}
        <TabsContent value="strengths" className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            These areas stood out as your presentation strengths.
          </p>
          
          {strengths.length > 0 ? (
            <div className="space-y-3">
              {strengths.map((strength, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="mt-0.5">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm">{strength}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-lg">
              <p className="text-gray-500">No strengths identified yet</p>
            </div>
          )}
        </TabsContent>
        
        {/* Exercises Tab */}
        <TabsContent value="exercises" className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            Practice these exercises to improve your presentation skills.
          </p>
          
          {practiceExercises.length > 0 ? (
            <div className="space-y-3">
              {practiceExercises.map((exercise, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Exercise {i + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{exercise}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-lg">
              <p className="text-gray-500">No practice exercises available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions for formatting importance
function getImportanceLabel(importance: number): string {
  if (importance >= 0.8) return 'High Priority';
  if (importance >= 0.5) return 'Medium Priority';
  return 'Low Priority';
}

function getImportanceVariant(importance: number): 'destructive' | 'default' | 'secondary' {
  if (importance >= 0.8) return 'destructive';
  if (importance >= 0.5) return 'default';
  return 'secondary';
}

function getImportanceBorderClass(importance: number): string {
  if (importance >= 0.8) return 'border-l-4 border-l-destructive';
  if (importance >= 0.5) return 'border-l-4 border-l-primary';
  return 'border-l-4 border-l-muted';
}