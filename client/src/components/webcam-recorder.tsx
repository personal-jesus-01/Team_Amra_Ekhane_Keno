import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Camera, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WebcamRecorderProps {
  isRecording?: boolean;
  previewOnly?: boolean;
  buttonOnly?: boolean;
  onStart?: () => void;
  onStop?: (videoBlob: Blob | null, screenshot: string | null) => void;
  onRecordingComplete?: (data: {
    videoBlob: Blob;
    transcript: string;
    duration: number;
    screenshot: string | null;
  }) => void;
  onTranscriptUpdate?: (transcript: string) => void;
  onCancel?: () => void;
  backgroundBlur?: boolean;
  quality?: 'standard' | 'high';
  className?: string;
  countdownSeconds?: number;
  maxDurationSeconds?: number;
  minDurationSeconds?: number;
}

export default function WebcamRecorder({
  isRecording = false,
  previewOnly = false,
  buttonOnly = false,
  onStart,
  onStop,
  onRecordingComplete,
  onTranscriptUpdate,
  onCancel,
  backgroundBlur = false,
  quality = 'standard',
  className = '',
  countdownSeconds = 3,
  maxDurationSeconds = 300,
  minDurationSeconds = 10
}: WebcamRecorderProps) {
  // State
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [internalIsRecording, setInternalIsRecording] = useState(isRecording);
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  
  // Camera constraints based on quality
  const cameraConstraints = {
    video: {
      width: quality === 'high' ? { ideal: 1280 } : { ideal: 640 },
      height: quality === 'high' ? { ideal: 720 } : { ideal: 480 },
      frameRate: quality === 'high' ? { ideal: 30 } : { ideal: 24 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100
    }
  };
  
  // Initialize camera with fallback for audio permissions
  const initCamera = async () => {
    try {
      setError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Your browser does not support camera access. Try using Chrome, Firefox, or Edge.');
        return;
      }
      
      let stream: MediaStream | null = null;
      
      // First try with both video and audio
      try {
        console.log('Requesting camera and microphone access...');
        stream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
        console.log('Got both camera and microphone access');
      } catch (audioError: any) {
        console.log('Failed to get audio, trying video only:', audioError.message);
        
        // If audio fails, try video only
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: cameraConstraints.video 
          });
          console.log('Got camera access (video only)');
          setIsMicOn(false); // No microphone available
        } catch (videoError: any) {
          console.error('Failed to get camera access:', videoError);
          
          // Provide specific error messages
          if (videoError.name === 'NotAllowedError' || videoError.name === 'PermissionDeniedError') {
            setError('Camera access was denied. Please allow camera access in your browser settings.');
          } else if (videoError.name === 'NotFoundError' || videoError.name === 'DevicesNotFoundError') {
            setError('No camera detected. Please connect a camera and try again.');
          } else if (videoError.name === 'NotReadableError' || videoError.name === 'TrackStartError') {
            setError('Your camera is already in use by another application.');
          } else {
            setError(`Unable to access camera: ${videoError.message || 'Unknown error'}`);
          }
          return;
        }
      }
      
      if (stream) {
        // Log stream details
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        console.log('Stream initialized with:', {
          videoTracks: videoTracks.length,
          audioTracks: audioTracks.length,
          streamId: stream.id
        });
        
        // Apply background blur if requested
        if (backgroundBlur) {
          console.log('Background blur enabled (visual effect would be applied here)');
        }
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setMediaStream(stream);
        streamRef.current = stream;
        setIsCameraOn(true);
        setIsMicOn(audioTracks.length > 0);
      }
    } catch (err: any) {
      console.error('Unexpected error during camera initialization:', err);
      setError(`Unexpected error: ${err.message || 'Unknown error'}`);
    }
  };

  // Initialize speech recognition
  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          finalTranscriptRef.current = finalTranscript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      const combinedTranscript = finalTranscript + interimTranscript;
      setTranscript(combinedTranscript);
      
      // Call the transcript update callback
      if (onTranscriptUpdate) {
        onTranscriptUpdate(combinedTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsTranscribing(false);
      }
    };
    
    recognition.onend = () => {
      // Auto-restart recognition if we're still recording
      if (internalIsRecording && isTranscribing) {
        try {
          recognition.start();
          console.log('Restarted speech recognition');
        } catch (e) {
          console.error('Could not restart speech recognition', e);
          setIsTranscribing(false);
        }
      } else {
        setIsTranscribing(false);
      }
    };
    
    return recognition;
  };

  // Start speech recognition
  const startSpeechRecognition = () => {
    const recognition = initSpeechRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      finalTranscriptRef.current = '';
      setTranscript('');
      setIsTranscribing(true);
      
      try {
        recognition.start();
        console.log('Started speech recognition');
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setIsTranscribing(false);
      }
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
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setMediaStream(null);
    streamRef.current = null;
  };
  
  // Toggle camera
  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      initCamera();
    }
  };
  
  // Toggle microphone
  const toggleMicrophone = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(!isMicOn);
    }
  };
  
  // Start recording
  const startRecording = async () => {
    if (!streamRef.current) {
      console.log('No stream available, initializing camera first');
      try {
        await initCamera();
        setIsStartingRecording(true);
      } catch (err) {
        console.error('Failed to initialize camera:', err);
        setError('Could not access camera. Please check permissions and try again.');
      }
      return;
    }
    
    console.log('Starting recording with stream:', streamRef.current.id);
    recordedChunksRef.current = [];
    
    // Validate stream tracks
    const videoTracks = streamRef.current.getVideoTracks();
    const audioTracks = streamRef.current.getAudioTracks();
    console.log('Stream validation:', {
      videoTracks: videoTracks.length,
      audioTracks: audioTracks.length,
      videoEnabled: videoTracks[0]?.enabled,
      audioEnabled: audioTracks[0]?.enabled,
      videoReadyState: videoTracks[0]?.readyState,
      audioReadyState: audioTracks[0]?.readyState
    });
    
    if (videoTracks.length === 0) {
      setError('No video track available for recording. Please check camera permissions.');
      return;
    }
    
    try {
      let mediaRecorder: MediaRecorder | null = null;
      
      // Check MediaRecorder support
      if (!window.MediaRecorder) {
        console.error('MediaRecorder not supported');
        setError('Recording is not supported in this browser. Please use Chrome, Firefox, or Safari.');
        return;
      }
      
      // Check if stream has tracks
      const videoTracks = streamRef.current.getVideoTracks();
      const audioTracks = streamRef.current.getAudioTracks();
      console.log('Available tracks for recording:', { video: videoTracks.length, audio: audioTracks.length });
      
      if (videoTracks.length === 0) {
        console.error('No video tracks available for recording');
        setError('No video source available for recording');
        return;
      }
      
      // Try simpler mime types that work better with different track combinations
      const mimeTypes = audioTracks.length > 0 
        ? ['video/webm', 'video/mp4', ''] // With audio
        : ['video/webm', 'video/mp4', '']; // Video only
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (mimeType === '' || MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('Selected mime type:', mimeType || 'default');
          break;
        }
      }
      
      // Create MediaRecorder with minimal options
      try {
        const options: MediaRecorderOptions = {};
        if (selectedMimeType) {
          options.mimeType = selectedMimeType;
        }
        
        mediaRecorder = new MediaRecorder(streamRef.current, options);
        console.log('MediaRecorder created successfully with options:', options);
      } catch (err) {
        console.error('Failed to create MediaRecorder:', err);
        // Try with no options as fallback
        try {
          mediaRecorder = new MediaRecorder(streamRef.current);
          console.log('MediaRecorder created with default options');
        } catch (fallbackErr) {
          console.error('MediaRecorder fallback also failed:', fallbackErr);
          setError('Recording not supported in your browser');
          return;
        }
      }
      
      if (!mediaRecorder) {
        console.error('MediaRecorder is null after creation attempts');
        setError('Failed to initialize recording');
        return;
      }
      
      // Handle data chunks
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available, size:', event.data?.size);
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks:', recordedChunksRef.current.length);
        // Create video blob
        let recordedBlob = null;
        if (recordedChunksRef.current.length > 0 && mediaRecorder) {
          recordedBlob = new Blob(recordedChunksRef.current, { type: mediaRecorder.mimeType || 'video/webm' });
          setVideoBlob(recordedBlob);
          console.log('Video blob created, size:', recordedBlob.size);
        } else {
          console.warn('No data chunks recorded');
        }
        
        // Take screenshot before stopping
        const screenshotData = takeScreenshot();
        
        // Call onStop callback
        if (onStop) {
          console.log('Calling onStop callback');
          onStop(recordedBlob, screenshotData || screenshot);
        }
        
        // Stop speech recognition
        stopSpeechRecognition();
        
        // Call onRecordingComplete with full data if available
        if (onRecordingComplete && recordedBlob) {
          console.log('Calling onRecordingComplete with full data');
          const recordingDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
          onRecordingComplete({
            videoBlob: recordedBlob,
            transcript: finalTranscriptRef.current || transcript, // Use live transcript from speech recognition
            duration: recordingDuration,
            screenshot: screenshotData || screenshot
          });
        }
        
        setInternalIsRecording(false);
      };
      
      // Handle errors during recording
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error event:', event);
        const error = (event as any).error;
        if (error) {
          console.error('MediaRecorder error details:', error);
          setError(`Recording error: ${error.message || error.name || 'MediaRecorder failed'}`);
        } else {
          console.error('MediaRecorder error without details');
          setError('Recording encountered an unknown error');
        }
        setInternalIsRecording(false);
        stopSpeechRecognition();
      };
      
      // Start recording with better error handling
      try {
        mediaRecorderRef.current = mediaRecorder;
        console.log('Starting MediaRecorder...');
        mediaRecorder.start(1000); // Collect data in 1-second chunks
        console.log('MediaRecorder started successfully');
        setInternalIsRecording(true);
        recordingStartTimeRef.current = Date.now();
        
        // Start speech recognition alongside recording
        startSpeechRecognition();
        
        // Call onStart callback
        if (onStart) {
          console.log('Calling onStart callback');
          onStart();
        }
      } catch (startError) {
        console.error('Failed to start recording:', startError);
        setError(`Failed to start recording: ${(startError as Error).message}`);
        return;
      }
      console.log('MediaRecorder started');
      setInternalIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      
      // Call onStart callback
      if (onStart) {
        console.log('Calling onStart callback');
        onStart();
      }
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Your browser may not support this feature.');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && internalIsRecording) {
      mediaRecorderRef.current.stop();
    }
    // Stop speech recognition
    stopSpeechRecognition();
  };
  
  // Take screenshot from the current video frame
  const takeScreenshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setScreenshot(dataUrl);
        return dataUrl;
      }
    }
    return null;
  };
  
  // Reset everything
  const resetRecorder = () => {
    setVideoBlob(null);
    setScreenshot(null);
    stopCamera();
    setInternalIsRecording(false);
  };
  
  // Handle external isRecording prop changes
  useEffect(() => {
    if (isRecording !== internalIsRecording) {
      if (isRecording) {
        startRecording();
      } else if (internalIsRecording) {
        stopRecording();
      }
    }
  }, [isRecording]);
  
  // Initialize camera when component mounts
  useEffect(() => {
    if (!buttonOnly && !previewOnly) {
      initCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [buttonOnly, previewOnly]);
  
  // Handle starting recording after camera initialization
  useEffect(() => {
    if (isStartingRecording && streamRef.current) {
      startRecording();
      setIsStartingRecording(false);
    }
  }, [isStartingRecording, mediaStream]);
  
  // Render only record button if buttonOnly is true
  if (buttonOnly) {
    return (
      <div className="flex flex-col items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                variant={internalIsRecording ? "destructive" : "default"}
                onClick={internalIsRecording ? stopRecording : startRecording}
                className={`rounded-full w-16 h-16 flex items-center justify-center ${
                  internalIsRecording ? 'animate-pulse' : ''
                }`}
              >
                {internalIsRecording ? (
                  <div className="h-6 w-6 rounded-sm bg-white" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-destructive" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{internalIsRecording ? 'Stop Recording' : 'Start Recording'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
  
  // Render only preview if previewOnly is true
  if (previewOnly) {
    return (
      <div className="relative rounded-md overflow-hidden w-full max-w-md mx-auto aspect-video bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  
  // Render full webcam recorder
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Error message */}
      {error && (
        <div className="text-destructive text-sm mb-2">{error}</div>
      )}
      
      {/* Video preview */}
      <div className="relative rounded-md overflow-hidden w-full max-w-xl mx-auto aspect-video bg-black mb-3">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            backgroundBlur ? 'backdrop-blur' : ''
          }`}
        />
        
        {/* Controls overlay */}
        <div className="absolute bottom-2 left-2 flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8"
                  onClick={toggleCamera}
                >
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8"
                  onClick={toggleMicrophone}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8"
                  onClick={takeScreenshot}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Take Screenshot</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Main recording button */}
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                variant={internalIsRecording ? "destructive" : "default"}
                onClick={internalIsRecording ? stopRecording : startRecording}
                className={`rounded-full w-16 h-16 flex items-center justify-center ${
                  internalIsRecording ? 'animate-pulse' : ''
                }`}
                disabled={!isCameraOn}
              >
                {internalIsRecording ? (
                  <div className="h-6 w-6 rounded-sm bg-white" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-destructive" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{internalIsRecording ? 'Stop Recording' : 'Start Recording'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {!internalIsRecording && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetRecorder}
                  className="rounded-full"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset Recorder</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Live Transcript Display */}
      {(internalIsRecording || transcript) && (
        <div className="mt-4 bg-gray-900/80 rounded-lg p-4 border border-gray-700">
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