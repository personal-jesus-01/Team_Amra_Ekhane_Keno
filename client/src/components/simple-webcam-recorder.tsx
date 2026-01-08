import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Camera, RefreshCw } from 'lucide-react';

interface SimpleWebcamRecorderProps {
  onRecordingComplete?: (data: {
    videoBlob: Blob;
    transcript: string;
    duration: number;
    screenshot: string | null;
  }) => void;
  onTranscriptUpdate?: (transcript: string) => void;
}

export default function SimpleWebcamRecorder({ onRecordingComplete, onTranscriptUpdate }: SimpleWebcamRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  
  // Initialize camera
  const startCamera = async () => {
    try {
      setError(null);
      console.log('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      
      console.log('Camera access granted');
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCameraOn(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera access.');
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };
  
  // Initialize speech recognition
  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = transcriptRef.current;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          transcriptRef.current = finalTranscript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      const combinedTranscript = finalTranscript + interimTranscript;
      setTranscript(combinedTranscript);
      
      if (onTranscriptUpdate) {
        onTranscriptUpdate(combinedTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };
    
    recognition.onend = () => {
      if (isRecording && isTranscribing) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Could not restart speech recognition');
        }
      } else {
        setIsTranscribing(false);
      }
    };
    
    recognitionRef.current = recognition;
    transcriptRef.current = '';
    setTranscript('');
    setIsTranscribing(true);
    
    try {
      recognition.start();
      console.log('Speech recognition started');
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsTranscribing(false);
    }
  };
  
  // Stop speech recognition
  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsTranscribing(false);
  };
  
  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      
      if (!streamRef.current) {
        await startCamera();
        if (!streamRef.current) {
          setError('Camera not available');
          return;
        }
      }
      
      if (!MediaRecorder) {
        setError('Recording not supported');
        return;
      }
      
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        const duration = (Date.now() - startTimeRef.current) / 1000;
        
        stopSpeechRecognition();
        
        if (onRecordingComplete) {
          onRecordingComplete({
            videoBlob,
            transcript: transcriptRef.current || transcript,
            duration,
            screenshot: null
          });
        }
        
        setIsRecording(false);
        mediaRecorderRef.current = null;
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed');
        setIsRecording(false);
        stopSpeechRecognition();
      };
      
      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);
      
      startSpeechRecognition();
      
      console.log('Recording started successfully');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Recording failed to start');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    stopSpeechRecognition();
  };
  
  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      stopSpeechRecognition();
    };
  }, []);
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-64 object-cover"
        />
        
        {/* Controls overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
          {/* Camera toggle */}
          <Button
            variant="secondary"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={isCameraOn ? stopCamera : startCamera}
          >
            {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          
          {/* Recording button */}
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopRecording : startRecording}
            className={`rounded-full w-16 h-16 flex items-center justify-center ${
              isRecording ? 'animate-pulse' : ''
            }`}
            disabled={!isCameraOn}
          >
            {isRecording ? (
              <div className="h-6 w-6 rounded-sm bg-white" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-destructive" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Live Transcript */}
      {(isRecording || transcript) && (
        <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-white flex items-center">
              <Mic className="h-4 w-4 mr-2 text-blue-400" />
              Live Transcript
              {isTranscribing && (
                <div className="flex space-x-1 ml-2">
                  <div className="w-1 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </h4>
            <span className="text-xs text-gray-400">
              {isTranscribing ? 'Listening...' : 'Stopped'}
            </span>
          </div>
          <div className="bg-gray-800 rounded p-3 min-h-[60px] max-h-32 overflow-y-auto">
            <p className="text-gray-300 text-sm leading-relaxed">
              {transcript || 'Start speaking to see live transcription...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}