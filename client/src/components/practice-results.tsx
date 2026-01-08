import { useState, useRef, useEffect } from 'react';
import { ImprovementTip } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressWithText, { ProgressWithTextProps } from '@/components/progress-with-text';
import CoachTips from '@/components/coach-tips';
import { ArrowLeft, Repeat, Download, Share2, Clock, PlayCircle, PauseCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SlideBySlideItem {
  slide_number: number;
  slide_title: string;
  coverage_score: number;
  recommendations: string;
  key_points_missed: string[];
  delivery_notes: string;
}

interface StructureAnalysis {
  adherence_to_outline: number;
  transitions: string;
  logical_flow: string;
  recommendations: string;
}

interface DeliveryRecommendations {
  pace: string;
  emphasis: string;
  vocal_variety: string;
  body_language: string;
}

interface PracticeResultsProps {
  videoBlob: Blob | null;
  videoUrl: string | null;
  screenshot: string | null;
  transcript: string;
  presentationTitle: string;
  duration: number;
  date: Date;
  metrics: {
    content_coverage: number;
    pace_score: number;
    clarity_score: number;
    eye_contact_score: number;
    overall_score: number;
  };
  feedback: string;
  strengths: string[];
  improvement_tips: ImprovementTip[];
  practice_exercises: string[];
  // Optional outline-specific feedback
  slide_by_slide_feedback?: SlideBySlideItem[];
  structure_analysis?: StructureAnalysis;
  coach_script?: string;
  delivery_recommendations?: DeliveryRecommendations;
  isDemoMode?: boolean;
  onBack: () => void;
  onTryAgain: () => void;
}

export default function PracticeResults({
  videoBlob,
  videoUrl,
  screenshot,
  transcript,
  presentationTitle,
  duration,
  date,
  metrics,
  feedback,
  strengths,
  improvement_tips,
  practice_exercises,
  slide_by_slide_feedback = [],
  structure_analysis,
  coach_script,
  delivery_recommendations,
  isDemoMode = false,
  onBack,
  onTryAgain
}: PracticeResultsProps) {
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Create video object URL if we have a blob
  const videoObjectUrl = videoBlob ? URL.createObjectURL(videoBlob) : videoUrl;
  
  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };
  
  // Update time display
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(Math.floor(videoRef.current.currentTime));
    }
  };
  
  // Handle video ended
  const handleVideoEnded = () => {
    setIsPlaying(false);
  };
  
  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (videoObjectUrl && videoBlob) {
        URL.revokeObjectURL(videoObjectUrl);
      }
    };
  }, [videoObjectUrl, videoBlob]);
  
  // Generate a downloadable video
  const handleDownloadVideo = () => {
    if (videoObjectUrl) {
      const a = document.createElement('a');
      a.href = videoObjectUrl;
      a.download = `${presentationTitle.replace(/\s+/g, '_')}_practice_${new Date().toISOString().split('T')[0]}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  // Share results (dummy function for now)
  const handleShare = () => {
    alert('Sharing functionality is not implemented yet');
  };
  
  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-xl font-semibold">Practice Results</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleDownloadVideo} disabled={!videoObjectUrl}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download recording</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share your results</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button onClick={onTryAgain}>
            <Repeat className="h-4 w-4 mr-2" />
            Practice Again
          </Button>
        </div>
      </div>
      
      {/* Practice session results */}
      
      {/* Basic Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div>
              <CardTitle>{presentationTitle}</CardTitle>
              <CardDescription>Practice Session</CardDescription>
            </div>
            <div className="flex flex-col items-end text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{formatDuration(duration)}</span>
              </div>
              <span>{formatDate(date)}</span>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`w-full grid ${slide_by_slide_feedback.length > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recording">Recording</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          {slide_by_slide_feedback.length > 0 && (
            <TabsTrigger value="detailed-coach" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span>Detailed Coach</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Content Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressWithText 
                  label="Content Covered"
                  value={metrics.content_coverage}
                  showPercentage
                  size="lg"
                  colorByValue
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Speaking Clarity</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressWithText 
                  label="Clarity Score"
                  value={metrics.clarity_score}
                  showPercentage
                  size="lg"
                  colorByValue
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pacing</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressWithText 
                  label="Pace Score"
                  value={metrics.pace_score}
                  showPercentage
                  size="lg"
                  colorByValue
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Overall Score & Eye Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Overall Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressWithText 
                  label="Overall Score"
                  value={metrics.overall_score}
                  showPercentage
                  size="lg"
                  colorByValue
                />
              </CardContent>
              <CardFooter className="pt-0 pb-4 px-6">
                <p className="text-sm text-gray-600">
                  {feedback}
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Eye Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressWithText 
                  label="Eye Contact Score"
                  value={metrics.eye_contact_score}
                  showPercentage
                  size="lg"
                  colorByValue
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Coach Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Coach Tips</CardTitle>
              <CardDescription>
                Personalized recommendations to improve your presentation skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CoachTips 
                improvementTips={improvement_tips}
                strengths={strengths}
                practiceExercises={practice_exercises}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recording Tab */}
        <TabsContent value="recording" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Practice Recording</CardTitle>
              <CardDescription>
                Review your presentation to identify areas for improvement
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {videoObjectUrl ? (
                <div className="relative w-full max-w-3xl mx-auto">
                  <video
                    ref={videoRef}
                    src={videoObjectUrl}
                    className="w-full rounded-md"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                  />
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={togglePlay}
                      >
                        {isPlaying ? 
                          <PauseCircle className="h-5 w-5" /> : 
                          <PlayCircle className="h-5 w-5" />
                        }
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={toggleMute}
                      >
                        {isMuted ? 
                          <VolumeX className="h-5 w-5" /> : 
                          <Volume2 className="h-5 w-5" />
                        }
                      </Button>
                      
                      <span className="text-sm font-mono">
                        {formatDuration(currentTime)} / {formatDuration(duration)}
                      </span>
                    </div>
                    
                    <Button 
                      variant="outline"
                      size="sm" 
                      onClick={handleDownloadVideo}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md w-full">
                  <p className="text-gray-500">Video recording not available</p>
                  {screenshot && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2">Screenshot</h4>
                      <img 
                        src={screenshot} 
                        alt="Practice Screenshot" 
                        className="max-w-full max-h-64 mx-auto rounded-md"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Transcript Tab */}
        <TabsContent value="transcript" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Speech Transcript</CardTitle>
              <CardDescription>
                Full text transcript of your practice session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-md max-h-[500px] overflow-y-auto">
                <p className="whitespace-pre-wrap">{transcript}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-0">
              <div className="text-sm text-gray-500 flex items-center">
                <Badge variant="outline">{transcript.split(/\s+/).length} words</Badge>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Detailed Coach Tab */}
        {slide_by_slide_feedback.length > 0 && (
          <TabsContent value="detailed-coach" className="space-y-6">
            {/* AI Coach Script */}
            {coach_script && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Coach Script
                  </CardTitle>
                  <CardDescription>
                    Personalized coaching session for your SlideBanai presentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/5 p-6 rounded-md border border-primary/10">
                    <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{coach_script}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Structure Analysis */}
            {structure_analysis && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Structure Analysis</CardTitle>
                  <CardDescription>
                    Evaluation of how well your presentation followed the intended structure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <ProgressWithText 
                        label="Adherence to Outline"
                        value={structure_analysis.adherence_to_outline}
                        showPercentage
                        size="lg"
                        colorByValue
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="p-4 rounded-md bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Transitions</h4>
                      <p className="text-sm text-gray-600">{structure_analysis.transitions}</p>
                    </div>
                    <div className="p-4 rounded-md bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Logical Flow</h4>
                      <p className="text-sm text-gray-600">{structure_analysis.logical_flow}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 p-4 rounded-md bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
                    <p className="text-sm text-gray-600">{structure_analysis.recommendations}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Slide by Slide Feedback */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Slide-by-Slide Feedback</CardTitle>
                <CardDescription>
                  Detailed analysis of how you covered each slide in your presentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {slide_by_slide_feedback.map((slide, index) => (
                    <AccordionItem key={index} value={`slide-${slide.slide_number}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0">
                              {slide.slide_number}
                            </Badge>
                            <span className="font-medium">{slide.slide_title}</span>
                          </div>
                          <div className="w-20">
                            <ProgressWithText 
                              label="Coverage"
                              value={slide.coverage_score}
                              showPercentage
                              size="sm"
                              colorByValue
                            />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pb-4 px-4 space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Recommendations</h4>
                            <p className="text-sm text-gray-600">{slide.recommendations}</p>
                          </div>
                          
                          {slide.key_points_missed.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Key Points Missed</h4>
                              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                                {slide.key_points_missed.map((point, i) => (
                                  <li key={i}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Delivery Notes</h4>
                            <p className="text-sm text-gray-600">{slide.delivery_notes}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
            
            {/* Delivery Recommendations */}
            {delivery_recommendations && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Delivery Recommendations</CardTitle>
                  <CardDescription>
                    Specific recommendations to enhance your presentation delivery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-md bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Pace</h4>
                      <p className="text-sm text-gray-600">{delivery_recommendations.pace}</p>
                    </div>
                    <div className="p-4 rounded-md bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Emphasis</h4>
                      <p className="text-sm text-gray-600">{delivery_recommendations.emphasis}</p>
                    </div>
                    <div className="p-4 rounded-md bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Vocal Variety</h4>
                      <p className="text-sm text-gray-600">{delivery_recommendations.vocal_variety}</p>
                    </div>
                    <div className="p-4 rounded-md bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Body Language</h4>
                      <p className="text-sm text-gray-600">{delivery_recommendations.body_language}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}