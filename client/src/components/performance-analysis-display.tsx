import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, TrendingUp, Target, MessageSquare, BookOpen } from 'lucide-react';

interface PerformanceAnalysisProps {
  result: {
    success: boolean;
    overallScore: number;
    slideRelevancyScore: number;
    speechQualityScore: number;
    languageAnalysis: {
      language_detected: string;
      code_switching_detected: boolean;
      cultural_references: string[];
      language_proficiency: string;
    };
    detailedFeedback: {
      slideSelection: {
        coverage: number;
        relevancy: number;
        logical_flow: number;
        key_points_covered: number;
        feedback: string;
      };
      speechDelivery: {
        content_relevancy: number;
        clarity_fluency: number;
        engagement_level: number;
        language_proficiency: number;
        structure_organization: number;
        feedback: string;
      };
    };
    recommendations: string[];
  };
  transcript: string;
  selectedSlides: any[];
}

export default function PerformanceAnalysisDisplay({ result, transcript, selectedSlides }: PerformanceAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Overall Performance Card */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Target className="h-6 w-6 mr-2 text-purple-400" />
            Overall Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                {result.overallScore}%
              </div>
              <p className="text-gray-300 text-sm mt-1">Overall Score</p>
              <Progress value={result.overallScore} className="mt-2" />
            </div>
            
            {/* Slide Relevancy */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(result.slideRelevancyScore)}`}>
                {result.slideRelevancyScore}%
              </div>
              <p className="text-gray-300 text-sm mt-1">Slide Relevancy</p>
              <Badge variant={getScoreBadgeVariant(result.slideRelevancyScore)} className="mt-2">
                {result.slideRelevancyScore >= 80 ? 'Excellent' : 
                 result.slideRelevancyScore >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
            
            {/* Speech Quality */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(result.speechQualityScore)}`}>
                {result.speechQualityScore}%
              </div>
              <p className="text-gray-300 text-sm mt-1">Speech Quality</p>
              <Badge variant={getScoreBadgeVariant(result.speechQualityScore)} className="mt-2">
                {result.speechQualityScore >= 80 ? 'Excellent' : 
                 result.speechQualityScore >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="speech" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="speech" className="data-[state=active]:bg-purple-600">
            <MessageSquare className="h-4 w-4 mr-2" />
            Speech Analysis
          </TabsTrigger>
          <TabsTrigger value="slides" className="data-[state=active]:bg-purple-600">
            <BookOpen className="h-4 w-4 mr-2" />
            Slide Analysis
          </TabsTrigger>
          <TabsTrigger value="language" className="data-[state=active]:bg-purple-600">
            <TrendingUp className="h-4 w-4 mr-2" />
            Language Analysis
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-purple-600">
            <CheckCircle className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Speech Analysis Tab */}
        <TabsContent value="speech">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Speech Quality Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Content Relevancy</span>
                    <span className={getScoreColor(result.detailedFeedback.speechDelivery.content_relevancy)}>
                      {result.detailedFeedback.speechDelivery.content_relevancy}%
                    </span>
                  </div>
                  <Progress value={result.detailedFeedback.speechDelivery.content_relevancy} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Clarity & Fluency</span>
                    <span className={getScoreColor(result.detailedFeedback.speechDelivery.clarity_fluency)}>
                      {result.detailedFeedback.speechDelivery.clarity_fluency}%
                    </span>
                  </div>
                  <Progress value={result.detailedFeedback.speechDelivery.clarity_fluency} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Engagement Level</span>
                    <span className={getScoreColor(result.detailedFeedback.speechDelivery.engagement_level)}>
                      {result.detailedFeedback.speechDelivery.engagement_level}%
                    </span>
                  </div>
                  <Progress value={result.detailedFeedback.speechDelivery.engagement_level} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Structure & Organization</span>
                    <span className={getScoreColor(result.detailedFeedback.speechDelivery.structure_organization)}>
                      {result.detailedFeedback.speechDelivery.structure_organization}%
                    </span>
                  </div>
                  <Progress value={result.detailedFeedback.speechDelivery.structure_organization} />
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4 mt-4">
                <h4 className="text-white font-medium mb-2">Speech Delivery Feedback</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {result.detailedFeedback.speechDelivery.feedback}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slide Analysis Tab */}
        <TabsContent value="slides">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Slide Selection & Coverage Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Content Coverage</span>
                    <span className={getScoreColor(result.detailedFeedback.slideSelection.coverage)}>
                      {result.detailedFeedback.slideSelection.coverage}%
                    </span>
                  </div>
                  <Progress value={result.detailedFeedback.slideSelection.coverage} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Slide Relevancy</span>
                    <span className={getScoreColor(result.detailedFeedback.slideSelection.relevancy)}>
                      {result.detailedFeedback.slideSelection.relevancy}%
                    </span>
                  </div>
                  <Progress value={result.detailedFeedback.slideSelection.relevancy} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Logical Flow</span>
                    <span className={getScoreColor(result.detailedFeedback.slideSelection.logical_flow)}>
                      {result.detailedFeedback.slideSelection.logical_flow}%
                    </span>
                  </div>
                  <Progress value={result.detailedFeedback.slideSelection.logical_flow} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Key Points Covered</span>
                    <span className={getScoreColor(result.detailedFeedback.slideSelection.key_points_covered)}>
                      {result.detailedFeedback.slideSelection.key_points_covered}%
                    </span>
                  </div>
                  <Progress value={result.detailedFeedback.slideSelection.key_points_covered} />
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4 mt-4">
                <h4 className="text-white font-medium mb-2">Slide Selection Feedback</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {result.detailedFeedback.slideSelection.feedback}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Analysis Tab */}
        <TabsContent value="language">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Language & Communication Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Language Detection</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-purple-400 border-purple-400">
                      {result.languageAnalysis.language_detected}
                    </Badge>
                    {result.languageAnalysis.code_switching_detected && (
                      <Badge variant="secondary">Code-switching detected</Badge>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Language Proficiency</h4>
                  <Badge variant={
                    result.languageAnalysis.language_proficiency === 'advanced' ? 'default' :
                    result.languageAnalysis.language_proficiency === 'intermediate' ? 'secondary' : 'destructive'
                  }>
                    {result.languageAnalysis.language_proficiency}
                  </Badge>
                </div>
              </div>
              
              {result.languageAnalysis.cultural_references && result.languageAnalysis.cultural_references.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Cultural References Detected</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.languageAnalysis.cultural_references.map((ref, index) => (
                      <Badge key={index} variant="outline" className="text-blue-400 border-blue-400">
                        {ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Improvement Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 bg-gray-900 rounded-lg p-4">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm leading-relaxed">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Your Transcript */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Your Speech Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {transcript}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}