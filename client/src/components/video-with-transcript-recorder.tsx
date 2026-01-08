import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, Square, Play, AlertCircle } from 'lucide-react';

interface VideoWithTranscriptRecorderProps {
  onRecordingComplete?: (data: {
    transcript: string;
    duration: number;
  }) => void;
  onTranscriptUpdate?: (transcript: string) => void;
}

export default function VideoWithTranscriptRecorder({ 
  onRecordingComplete, 
  onTranscriptUpdate 
}: VideoWithTranscriptRecorderProps) {
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
      console.log('Starting camera for visual display...');
      
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
      console.log('Camera started for visual display');
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

  // Initialize speech recognition (actual functionality)
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
      onTranscriptUpdate?.(fullTranscript);
    };
    
    recognition.onstart = () => {
      console.log('Speech recognition started');
      setError('');
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
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

  // Start recording (transcript only)
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
        
        console.log('Transcript recording started');
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
    
    onRecordingComplete?.({
      transcript: transcript.trim(),
      duration: finalDuration
    });
    
    console.log('Transcript recording completed:', { transcript, duration: finalDuration });
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
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Video className="h-5 w-5 mr-2" />
          Practice Session (Video Display + Transcript Recording)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-center">
            <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Video Preview (Visual Only) */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '300px' }}>
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
                <Button onClick={startCamera} variant="outline">
                  Turn On Camera
                </Button>
              </div>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm animate-pulse">
              REC {duration.toFixed(1)}s (Audio Only)
            </div>
          )}

          {/* Visual-only indicator */}
          {isCameraOn && !isRecording && (
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
              Video Display Only
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
            Camera
          </Button>

          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            disabled={!isSupported}
            size="sm"
            className="px-6"
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </>
            )}
          </Button>
        </div>

        {/* Live transcript display */}
        {transcript && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-white text-sm font-medium mb-2 flex items-center">
              <Mic className="h-4 w-4 mr-2" />
              Live Transcript:
            </h4>
            <div className="max-h-32 overflow-y-auto">
              <p className="text-gray-300 text-sm leading-relaxed">{transcript}</p>
            </div>
            <div className="mt-2 text-gray-500 text-xs">
              {transcript.split(' ').length} words • {duration.toFixed(1)}s
            </div>
          </div>
        )}

        {/* Status and Instructions */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">
              Camera: {isCameraOn ? 'ON (Display)' : 'OFF'}
            </span>
            <span className="text-gray-400 text-sm">
              Recording: {isRecording ? 'ACTIVE (Audio)' : 'STOPPED'}
            </span>
          </div>
          <p className="text-gray-500 text-xs text-center">
            Video shows for visual reference. Only speech is recorded and analyzed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}