import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slide, SpeechComparisonResult } from '@/lib/types';
import { ArrowLeft, ChevronRight, Play, Pause, Video, Clock, BadgeCheck, AlertTriangle, RotateCcw, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export type SpeechComparisonProps = {
  slide: Slide;
  suggestedSpeech: string;
  recordingData: {
    videoBlob: Blob | null;
    screenshot: string | null;
    transcript: string;
    duration: number;
  };
  comparisonResult: SpeechComparisonResult;
  isLoading: boolean;
  onBack: () => void;
  onTryAgain: () => void;
  onFinish: () => void;
};

export default function SpeechComparison({
  slide,
  suggestedSpeech,
  recordingData,
  comparisonResult,
  isLoading,
  onBack,
  onTryAgain,
  onFinish
}: SpeechComparisonProps) {
  const [currentTab, setCurrentTab] = useState('comparison');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Handle video playback
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle video ended
  const handleVideoEnded = () => {
    setIsPlaying(false);
  };
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Download recording
  const handleDownloadRecording = () => {
    if (!recordingData.videoBlob) return;
    
    const url = URL.createObjectURL(recordingData.videoBlob as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slide-${slide.slide_number}-recording.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Practice Analysis</h2>
          <p className="text-sm text-gray-500">
            Review your performance and get improvement suggestions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onTryAgain} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={onFinish}>
            Finish
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="comparison" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="recording">Your Recording</TabsTrigger>
          <TabsTrigger value="analysis">Detailed Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Scores</CardTitle>
                <CardDescription>
                  How your delivery compared to the suggested speech
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Coverage */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Content Coverage</span>
                    <span className="text-sm font-medium">{comparisonResult.content_coverage}%</span>
                  </div>
                  <Progress value={comparisonResult.content_coverage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    How well you covered the key points from the suggested speech
                  </p>
                </div>
                
                {/* Clarity */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Clarity</span>
                    <span className="text-sm font-medium">{comparisonResult.clarity_score}%</span>
                  </div>
                  <Progress value={comparisonResult.clarity_score} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    How clear and well-structured your speech was
                  </p>
                </div>
                
                {/* Delivery */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Delivery Style</span>
                    <span className="text-sm font-medium">{comparisonResult.delivery_score}%</span>
                  </div>
                  <Progress value={comparisonResult.delivery_score} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    Your tone, pacing, emphasis, and transitions
                  </p>
                </div>
                
                {/* Overall */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span className="text-sm font-medium">{comparisonResult.overall_score}%</span>
                  </div>
                  <Progress value={comparisonResult.overall_score} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    Your overall performance rating
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Strengths & Improvements */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
                <CardDescription>
                  Your strengths and areas for improvement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Strengths */}
                <div>
                  <h4 className="flex items-center text-sm font-medium mb-2">
                    <BadgeCheck className="h-4 w-4 text-green-600 mr-2" />
                    Strengths
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {comparisonResult.strengths.map((strength, index) => (
                      <li key={index} className="text-sm pl-2">
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Separator />
                
                {/* Improvements */}
                <div>
                  <h4 className="flex items-center text-sm font-medium mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                    Improvement Areas
                  </h4>
                  <div className="space-y-3">
                    {comparisonResult.improvements.map((tip, index) => (
                      <div key={index} className="flex gap-2">
                        <Badge variant={
                          tip.priority === 'high' ? 'destructive' :
                          tip.priority === 'medium' ? 'default' : 'outline'
                        } className="h-fit">
                          {tip.area}
                        </Badge>
                        <p className="text-sm">{tip.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Speech Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Speech Comparison</CardTitle>
              <CardDescription>
                Compare your speech with the suggested script
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Suggested Speech */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Suggested Speech</h4>
                  <div className="bg-gray-50 p-4 rounded h-[250px] overflow-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {suggestedSpeech}
                    </p>
                  </div>
                </div>
                
                {/* Actual Speech */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Your Speech</h4>
                  <div className="bg-gray-50 p-4 rounded h-[250px] overflow-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {comparisonResult.actual_speech}
                    </p>
                    {comparisonResult.whisper_used && (
                      <div className="mt-4 text-xs text-gray-500 italic">
                        Transcribed automatically using AI
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recording">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="h-5 w-5 mr-2" />
                Your Recording
              </CardTitle>
              <CardDescription className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Duration: {formatDuration(recordingData.duration)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="max-w-2xl w-full">
                {recordingData.videoBlob && (
                  <video
                    ref={videoRef}
                    src={URL.createObjectURL(recordingData.videoBlob as Blob)}
                    className="w-full rounded-lg"
                    onEnded={handleVideoEnded}
                    controls
                  />
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleDownloadRecording}>
                <Download className="h-4 w-4 mr-2" />
                Download Recording
              </Button>
              <Button onClick={handlePlayPause}>
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
              <CardDescription>
                In-depth feedback on your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line">
                  {comparisonResult.detailed_analysis}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}