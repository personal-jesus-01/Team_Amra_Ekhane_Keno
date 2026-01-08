import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slide } from '@/lib/types';
import { ArrowLeft, Mic, Presentation, Speech } from 'lucide-react';
import WebcamRecorder from '@/components/webcam-recorder';

export type SuggestedSpeechProps = {
  slide: Slide;
  suggestedSpeech: string;
  onBack: () => void;
  onStartRecording: () => void;
  onRecordingComplete: (data: {
    videoBlob: Blob;
    transcript: string;
    duration: number;
    screenshot: string | null;
  }) => void;
};

export default function SuggestedSpeech({
  slide,
  suggestedSpeech,
  onBack,
  onStartRecording,
  onRecordingComplete
}: SuggestedSpeechProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState('speech');
  
  // Handle starting the recording
  const handleStartRecording = () => {
    setIsRecording(true);
    onStartRecording();
  };
  
  // Handle recording complete
  const handleRecordingComplete = (data: {
    videoBlob: Blob;
    transcript: string;
    duration: number;
    screenshot: string | null;
  }) => {
    setIsRecording(false);
    onRecordingComplete(data);
  };
  
  // Handle cancel recording
  const handleCancelRecording = () => {
    setIsRecording(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {slide.title || `Slide ${slide.slide_number}`}
          </h2>
          <p className="text-sm text-gray-500">
            Review the suggested speech and practice your delivery
          </p>
        </div>
        <Button onClick={onBack} variant="outline" disabled={isRecording}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Slide Selection
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slide Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Presentation className="h-5 w-5 mr-2" />
              Slide Preview
            </CardTitle>
            <CardDescription>
              Content you'll be presenting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 flex items-center justify-center rounded">
              <div className="text-center p-4 max-w-md">
                <h3 className="font-medium mb-4">
                  {slide.title || `Slide ${slide.slide_number}`}
                </h3>
                <p className="text-sm">
                  {slide.content}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Suggested Speech */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Speech className="h-5 w-5 mr-2" />
              Suggested Speech
            </CardTitle>
            <CardDescription>
              A script to guide your presentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded h-[250px] overflow-auto">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {suggestedSpeech}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recording Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="h-5 w-5 mr-2" />
            Record Your Presentation
          </CardTitle>
          <CardDescription>
            Practice delivering the speech for this slide
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRecording ? (
            <WebcamRecorder
              onRecordingComplete={handleRecordingComplete}
              onCancel={handleCancelRecording}
              countdownSeconds={3}
              quality="high"
              backgroundBlur={false}
              maxDurationSeconds={300} // 5 minutes max
              minDurationSeconds={5} // 5 seconds min
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-center max-w-md text-sm text-gray-600">
                Record yourself presenting this slide. Your recording will be analyzed and compared with the suggested speech to provide feedback.
              </p>
              <Button 
                size="lg" 
                onClick={handleStartRecording}
                className="gap-2"
              >
                <Mic className="h-5 w-5" />
                Start Recording
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}