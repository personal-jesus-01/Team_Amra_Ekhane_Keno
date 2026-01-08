import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, Square, Play, AlertCircle } from 'lucide-react';

interface DirectStreamRecorderProps {
  onRecordingComplete?: (data: {
    videoBlob: Blob;
    transcript: string;
    duration: number;
    screenshot: string | null;
  }) => void;
  onTranscriptUpdate?: (transcript: string) => void;
}

export default function DirectStreamRecorder({ 
  onRecordingComplete, 
  onTranscriptUpdate 
}: DirectStreamRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string>('');

  // Initialize camera
  const startCamera = async () => {
    try {
      setError('');
      console.log('Starting direct stream camera...');
      
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
      setIsMicOn(true);
      console.log('Direct stream camera started successfully');
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
    setIsMicOn(false);
  };

  // Initialize speech recognition
  const startSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        
        if (finalTranscript) {
          const newTranscript = transcript + finalTranscript;
          setTranscript(newTranscript);
          onTranscriptUpdate?.(newTranscript);
        }
      };
      
      recognitionRef.current.start();
      console.log('Speech recognition started');
    }
  };

  // Stop speech recognition
  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // Canvas-based recording using stream frames
  const startRecording = async () => {
    if (!streamRef.current) {
      setError('No camera stream available');
      return;
    }

    try {
      setError('');
      chunksRef.current = [];
      setDuration(0);
      setTranscript('');
      
      // Start canvas recording
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) {
        setError('Canvas or video element not available');
        return;
      }

      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setError('Canvas context not available');
        return;
      }

      // Create a video stream from canvas
      const canvasStream = canvas.captureStream(30); // 30 FPS
      
      // Add audio track from original stream
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        canvasStream.addTrack(audioTracks[0]);
      }

      // Use MediaRecorder with canvas stream
      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        const screenshot = canvas.toDataURL('image/png');
        
        onRecordingComplete?.({
          videoBlob,
          transcript,
          duration,
          screenshot
        });
      };

      // Start drawing video frames to canvas
      const drawFrame = () => {
        if (isRecording && ctx && video.videoWidth > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        }
      };

      setIsRecording(true);
      mediaRecorder.start(1000); // Record in 1-second chunks
      startSpeechRecognition();
      drawFrame();

      // Duration counter
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 0.1);
      }, 100);

      console.log('Canvas-based recording started');
    } catch (err) {
      console.error('Recording start error:', err);
      setError('Recording failed: ' + (err as Error).message);
    }
  };

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    stopSpeechRecognition();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log('Recording stopped with duration:', duration);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeechRecognition();
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
          Direct Stream Recorder (Alternative Implementation)
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
        <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '300px' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="hidden"
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
              REC {duration.toFixed(1)}s
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={isCameraOn ? stopCamera : startCamera}
            variant={isCameraOn ? "default" : "destructive"}
            size="sm"
          >
            {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            disabled={!isCameraOn}
            size="sm"
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRecording ? ' Stop' : ' Record'}
          </Button>
        </div>

        {/* Live transcript */}
        {transcript && (
          <div className="bg-gray-900 rounded-lg p-3">
            <h4 className="text-white text-sm font-medium mb-2">Live Transcript:</h4>
            <p className="text-gray-300 text-sm">{transcript}</p>
          </div>
        )}

        {/* Status */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Camera: {isCameraOn ? 'ON' : 'OFF'} | 
            Recording: {isRecording ? 'ACTIVE' : 'STOPPED'} | 
            Duration: {duration.toFixed(1)}s
          </p>
        </div>
      </CardContent>
    </Card>
  );
}