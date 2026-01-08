import { useState, useEffect, useRef } from 'react';
import { PresentationWithMeta, Slide, PracticeConfig } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import VideoWithTranscriptRecorder from '@/components/video-with-transcript-recorder';
import { Mic, MicOff, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PracticeSessionProps {
  presentation: PresentationWithMeta;
  config: PracticeConfig;
  slides: Slide[];
  onComplete: (result: {
    videoBlob: Blob | null;
    screenshot: string | null;
    transcript: string;
    duration: number;
    presentationId: number;
  }) => void;
  onBack: () => void;
}

export default function PracticeSession({
  presentation,
  config,
  slides,
  onComplete,
  onBack
}: PracticeSessionProps) {
  // Filter slides based on config
  const practiceSlides = config.practiceMode === 'full'
    ? slides.filter(slide => slide.presentation_id === presentation.id).sort((a, b) => a.slide_number - b.slide_number)
    : slides.filter(slide => config.selectedSlideIds?.includes(slide.id))
         .sort((a, b) => a.slide_number - b.slide_number);
  
  // State for the practice session
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [transcript, setTranscript] = useState('');
  const [showNotes, setShowNotes] = useState(config.displaySettings.showNotes);
  const [isMuted, setIsMuted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Refs
  const timerRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  
  // Set up improved Speech Recognition for real-time transcript
  useEffect(() => {
    // Check if SpeechRecognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !speechRecognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Track full transcript between recognition sessions
      let fullTranscript = '';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        // Process results for this recognition segment
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update the full transcript with any final results
        if (finalTranscript) {
          fullTranscript += finalTranscript;
        }
        
        // Set the combined transcript (permanent + interim)
        setTranscript(fullTranscript + (interimTranscript ? interimTranscript : ''));
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
      };
      
      recognition.onend = () => {
        // Auto-restart recognition if we're still recording
        if (isRecording) {
          try {
            recognition.start();
            console.log('Restarted speech recognition');
          } catch (e) {
            console.error('Could not restart speech recognition', e);
          }
        }
      };
      
      speechRecognitionRef.current = recognition;
    }
    
    // Start recognition if recording is already in progress
    if (isRecording && speechRecognitionRef.current && !isMuted) {
      try {
        speechRecognitionRef.current.start();
        console.log('Started speech recognition');
      } catch (e) {
        console.error('Could not start speech recognition', e);
      }
    }
    
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
          console.log('Stopped speech recognition');
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [isRecording, isMuted]);
  
  // Timer effect for tracking elapsed time
  useEffect(() => {
    if (isRecording && !timerRef.current) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (!isRecording && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);
  
  // Effect for automatic slide advancement if strict timing is enabled
  useEffect(() => {
    if (isRecording && config.timerSettings.strictTiming) {
      const slideTimeInSeconds = config.timerSettings.perSlideDuration;
      const slideStartTime = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0;
      const slideElapsedTime = elapsedTime - slideStartTime;
      
      if (slideElapsedTime >= slideTimeInSeconds && currentSlideIndex < practiceSlides.length - 1) {
        setCurrentSlideIndex(prev => prev + 1);
      }
    }
  }, [elapsedTime, isRecording, config.timerSettings.strictTiming, config.timerSettings.perSlideDuration, 
     currentSlideIndex, practiceSlides.length, recordingStartTime]);
  
  // Current slide
  const currentSlide = practiceSlides[currentSlideIndex];
  
  // Handlers
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    
    // Start speech recognition
    if (speechRecognitionRef.current && !isMuted) {
      try {
        speechRecognitionRef.current.start();
      } catch (e) {
        console.error('Error starting speech recognition:', e);
      }
    }
  };
  
  const handleStopRecording = (videoBlob: Blob | null, screenshot: string | null) => {
    setIsRecording(false);
    
    // Stop speech recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
      }
    }
    
    // Show the completion view
    setIsFinished(true);
    
    // Prepare and send result
    const result = {
      videoBlob,
      screenshot,
      transcript: transcript || 'No transcript available',
      duration: elapsedTime,
      presentationId: presentation.id
    };
    
    // Call onComplete after a brief delay to allow the UI to update
    setTimeout(() => {
      onComplete(result);
    }, 500);
  };
  
  const handleNextSlide = () => {
    if (currentSlideIndex < practiceSlides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };
  
  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (speechRecognitionRef.current) {
      if (isMuted && isRecording) {
        // Unmuting, start recognition if recording
        try {
          speechRecognitionRef.current.start();
        } catch (e) {
          // Might already be running
        }
      } else if (!isMuted) {
        // Muting, stop recognition
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {
          // Might not be running
        }
      }
    }
  };
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const progressPercentage = (currentSlideIndex / (practiceSlides.length - 1)) * 100;
  
  // If practice session is finished, show a processing message
  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <h3 className="text-xl font-semibold">Processing Your Practice Session</h3>
          <p className="text-gray-600">
            Analyzing your presentation and preparing feedback...
          </p>
          <div className="w-full mt-4">
            <Progress value={75} className="h-2" />
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate slide timer information
  const slideDurationSeconds = config.timerSettings.perSlideDuration;
  const totalDurationMinutes = config.timerSettings.totalDuration;
  const elapsedPercentage = config.timerSettings.strictTiming 
    ? ((elapsedTime % slideDurationSeconds) / slideDurationSeconds) * 100
    : (elapsedTime / (totalDurationMinutes * 60)) * 100;
  
  // Note position class based on settings
  const notesPositionClass = {
    'side': 'md:grid-cols-3 md:grid-rows-1',
    'bottom': 'grid-cols-1 grid-rows-2',
    'overlay': 'grid-cols-1 grid-rows-1'
  }[config.displaySettings.notesPosition];
  
  // Font size class based on settings
  const fontSizeClass = {
    'small': 'text-sm',
    'medium': 'text-base',
    'large': 'text-lg'
  }[config.displaySettings.fontSize];
  
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Timer and Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
          
          {config.timerSettings.strictTiming && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {formatTime(slideDurationSeconds - (elapsedTime % slideDurationSeconds))} per slide
              </Badge>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleMute}
            className={isMuted ? 'text-destructive' : ''}
          >
            {isMuted ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge>
            Slide {currentSlideIndex + 1} of {practiceSlides.length}
          </Badge>
        </div>
      </div>
      
      {config.timerSettings.strictTiming && (
        <div className="w-full">
          <Progress value={elapsedPercentage} 
            className="h-1" 
            indicatorClassName={elapsedPercentage > 80 ? 'bg-destructive' : ''}
          />
        </div>
      )}
      
      {/* Main content: Slide and Notes */}
      <div className={`grid ${notesPositionClass} flex-1 gap-4`}>
        {/* Slide display */}
        <div className={`flex-1 ${config.displaySettings.notesPosition === 'side' ? 'col-span-2' : 'w-full'}`}>
          <Card className="h-full overflow-hidden">
            <CardContent className="p-0 h-full flex flex-col">
              <div 
                className="flex-1 flex flex-col p-6 overflow-auto"
                style={{
                  backgroundColor: currentSlide?.background_color || '#ffffff'
                }}
              >
                <h2 className="text-2xl font-bold mb-4">{currentSlide?.title || `Slide ${currentSlideIndex + 1}`}</h2>
                <div className="flex-1">
                  {currentSlide?.content && (
                    <div className="whitespace-pre-wrap">{currentSlide.content}</div>
                  )}
                </div>
              </div>
              
              {config.displaySettings.showProgress && (
                <div className="p-1">
                  <Progress value={progressPercentage} className="h-1" />
                </div>
              )}
              
              <div className="flex justify-between p-2 bg-gray-50 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextSlide}
                  disabled={currentSlideIndex === practiceSlides.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Notes section (if enabled) */}
        {showNotes && config.displaySettings.notesPosition !== 'overlay' && (
          <div className={`${config.displaySettings.notesPosition === 'bottom' ? 'w-full' : ''}`}>
            <Card className="h-full">
              <CardContent className="p-4 h-full overflow-auto">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Speaker Notes</h3>
                <div className={`whitespace-pre-wrap ${fontSizeClass}`}>
                  {currentSlide?.notes || 'No notes for this slide.'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Overlay notes (if enabled) */}
        {showNotes && config.displaySettings.notesPosition === 'overlay' && (
          <div className="absolute bottom-32 left-0 right-0 mx-auto w-full max-w-3xl p-4 bg-black/60 text-white rounded-md">
            <div className={`whitespace-pre-wrap max-h-40 overflow-auto ${fontSizeClass}`}>
              {currentSlide?.notes || 'No notes for this slide.'}
            </div>
          </div>
        )}
      </div>
      
      {/* Real-time transcript area with live indication */}
      <div className="border rounded-md p-4 bg-gray-50 overflow-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">Real-time Speech Transcript</h3>
          {isRecording && (
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-xs text-red-500">Recording speech...</span>
            </div>
          )}
        </div>
        <div className={`text-sm whitespace-pre-wrap ${isRecording ? 'min-h-24' : 'h-32'}`}>
          {transcript || (
            <span className="text-gray-400">
              {isRecording 
                ? "Your speech will appear here in real-time as you speak..."
                : "Transcription will appear here when you start recording..."}
            </span>
          )}
        </div>
      </div>
      
      {/* Reorganized layout with webcam at the top and real-time guidance */}
      <div className="grid grid-cols-1 gap-4">
        {/* Video with Transcript Recorder - working implementation */}
        <div className="flex flex-col items-center">
          <VideoWithTranscriptRecorder
            onRecordingComplete={(data) => {
              setTranscript(data.transcript);
              setIsRecording(false);
              setIsFinished(true);
              
              // Trigger the completion callback with transcript data
              onComplete({
                videoBlob: null, // No video blob needed
                screenshot: null,
                transcript: data.transcript,
                duration: data.duration,
                presentationId: presentation.id
              });
            }}
            onTranscriptUpdate={(transcript) => {
              setTranscript(transcript);
            }}
          />
          
          {isRecording && (
            <div className="mt-2 w-full max-w-xl bg-primary/10 p-3 rounded-md border border-primary/20">
              <h4 className="text-sm font-medium mb-1">Speech Guidance</h4>
              <ul className="text-xs space-y-1">
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Speak clearly and at a moderate pace
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Make eye contact with the camera
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Use hand gestures appropriately
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Pause between key points for emphasis
                </li>
              </ul>
            </div>
          )}
          
          <div className="mt-2 text-center">
            {!isRecording ? (
              <p className="text-sm text-gray-600">
                Click the record button to start your practice session.
              </p>
            ) : (
              <div className="animate-pulse">
                <p className="text-sm font-medium text-red-500">
                  Recording in progress...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Back button */}
      <div className="mt-4">
        <Button 
          variant="outline" 
          onClick={onBack} 
          disabled={isRecording}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Setup
        </Button>
      </div>
    </div>
  );
}