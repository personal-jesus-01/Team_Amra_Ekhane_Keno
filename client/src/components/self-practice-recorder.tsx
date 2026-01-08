import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Square, Play, AlertCircle } from 'lucide-react';
import { Slide } from '@/lib/types';

interface SelfPracticeRecorderProps {
  slide: Slide;
  suggestedSpeech: string;
  onRecordingComplete: (data: {
    transcript: string;
    duration: number;
  }) => void;
  onBack: () => void;
}

export default function SelfPracticeRecorder({ 
  slide, 
  suggestedSpeech, 
  onRecordingComplete, 
  onBack 
}: SelfPracticeRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string>('');
  const [isSupported, setIsSupported] = useState(false);

  // Check browser support
  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSupported(supported);
    if (!supported) {
      setError('Speech recognition not supported in this browser');
    }
  }, []);

  // Start camera (visual only)
  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsCameraOn(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access failed: ' + (err as Error).message);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if (!isSupported) return null;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      const fullTranscript = finalTranscript + interimTranscript;
      setTranscript(fullTranscript);
    };
    
    recognition.onstart = () => {
      setError('');
    };
    
    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setError('Speech recognition error: ' + event.error);
      }
    };
    
    return recognition;
  };

  // Start recording
  const startRecording = async () => {
    if (!isSupported) {
      setError('Speech recognition not supported');
      return;
    }

    try {
      setError('');
      setTranscript('');
      setDuration(0);
      startTimeRef.current = Date.now();
      
      recognitionRef.current = initializeSpeechRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
        
        // Duration counter
        intervalRef.current = setInterval(() => {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setDuration(elapsed);
        }, 100);
      }
    } catch (err) {
      console.error('Recording start error:', err);
      setError('Recording failed: ' + (err as Error).message);
    }
  };

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const finalDuration = (Date.now() - startTimeRef.current) / 1000;
    
    onRecordingComplete({
      transcript: transcript.trim(),
      duration: finalDuration
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Self Practice Recording</h2>
          <p className="text-gray-400">Practice speaking about: {slide.title}</p>
        </div>
        <Button onClick={onBack} variant="outline" disabled={isRecording}>
          Back to Selection
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Slide content and suggested speech */}
        <div className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Slide Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">{slide.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{slide.content}</p>
                {slide.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-gray-400 text-xs font-medium">Notes:</p>
                    <p className="text-gray-300 text-sm">{slide.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Suggested Speech</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="text-gray-300 text-sm leading-relaxed">{suggestedSpeech}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Recording interface */}
        <div className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Video className="h-5 w-5 mr-2" />
                Practice Recording
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Video Preview */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '250px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <VideoOff className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 mb-4">Camera is off</p>
                      <Button onClick={startCamera} variant="outline" size="sm">
                        Turn On Camera
                      </Button>
                    </div>
                  </div>
                )}

                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                    REC {duration.toFixed(1)}s
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={isCameraOn ? stopCamera : startCamera}
                  variant={isCameraOn ? "default" : "outline"}
                  size="sm"
                >
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>

                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "default"}
                  disabled={!isSupported}
                  size="lg"
                  className="px-8"
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Practice
                    </>
                  )}
                </Button>
              </div>

              {/* Live transcript */}
              {transcript && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <h4 className="text-white text-sm font-medium mb-2">Your Speech:</h4>
                  <div className="max-h-24 overflow-y-auto">
                    <p className="text-gray-300 text-sm leading-relaxed">{transcript}</p>
                  </div>
                  <div className="mt-2 text-gray-500 text-xs">
                    {transcript.split(' ').length} words • {duration.toFixed(1)}s
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs text-center">
                  Read the suggested speech or speak naturally about the slide content. 
                  Your speech will be analyzed for content coverage and presentation quality.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}