import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Square, Play, AlertCircle } from 'lucide-react';

interface TranscriptOnlyRecorderProps {
  onRecordingComplete?: (data: {
    transcript: string;
    duration: number;
  }) => void;
  onTranscriptUpdate?: (transcript: string) => void;
}

export default function TranscriptOnlyRecorder({ 
  onRecordingComplete, 
  onTranscriptUpdate 
}: TranscriptOnlyRecorderProps) {
  const recognitionRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const [isRecording, setIsRecording] = useState(false);
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
      onTranscriptUpdate?.(fullTranscript);
    };
    
    recognition.onstart = () => {
      console.log('Speech recognition started');
      setError('');
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      if (isRecording) {
        // Restart recognition if still recording
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
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
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
      console.error('Microphone access error:', err);
      setError('Microphone access denied: ' + (err as Error).message);
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
          <Mic className="h-5 w-5 mr-2" />
          Speech Transcript Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-center">
            <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {!isSupported && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 flex items-center">
            <AlertCircle className="h-4 w-4 text-yellow-400 mr-2" />
            <span className="text-yellow-400 text-sm">
              Speech recognition not supported. Please use Chrome, Edge, or Safari.
            </span>
          </div>
        )}

        {/* Recording Status */}
        <div className="text-center py-8">
          <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
            isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-700'
          }`}>
            {isRecording ? (
              <Mic className="h-12 w-12 text-white" />
            ) : (
              <MicOff className="h-12 w-12 text-gray-400" />
            )}
          </div>
          
          <p className="text-white text-lg font-medium mb-2">
            {isRecording ? 'Recording Speech...' : 'Ready to Record'}
          </p>
          
          <p className="text-gray-400 text-sm">
            Duration: {duration.toFixed(1)}s
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            disabled={!isSupported}
            size="lg"
            className="px-8"
          >
            {isRecording ? (
              <>
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start Recording
              </>
            )}
          </Button>
        </div>

        {/* Live transcript display */}
        {transcript && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-white text-sm font-medium mb-2">Live Transcript:</h4>
            <div className="max-h-40 overflow-y-auto">
              <p className="text-gray-300 text-sm leading-relaxed">{transcript}</p>
            </div>
            <div className="mt-2 text-gray-500 text-xs">
              {transcript.split(' ').length} words
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <p className="text-gray-400 text-xs text-center">
            Click "Start Recording" and speak clearly. Your speech will be transcribed in real-time.
            Click "Stop Recording" when finished to analyze your presentation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}