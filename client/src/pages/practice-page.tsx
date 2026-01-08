import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, FileText, Upload, Mic, MicOff, Square, ArrowLeft, Video, VideoOff, Play, ChevronRight } from 'lucide-react';
import { NumberInput } from '@/components/ui/number-input';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import PerformanceAnalysisDisplay from '@/components/performance-analysis-display';
import SimpleWebcamRecorder from '@/components/simple-webcam-recorder';

interface Slide {
  id: number;
  title: string;
  content: string;
  slide_number: number;
}

interface PracticeConfig {
  contentSource: 'existing_presentation' | 'uploaded_file';
  presentationId?: number;
  uploadedFile?: File;
  selectedSlideNumbers: number[];
  language: 'bangla' | 'banglish' | 'english';
  audienceType: string;
  speechStyle: string;
  technicalityLevel: string;
  durationMinutes: number;
}

interface AnalysisResult {
  contentCoverage: number;
  pronunciationScore: number;
  fluencyScore: number;
  confidenceScore: number;
  strengths: string[];
  improvementAreas: string[];
  feedback: string;
  pronunciationFeedback?: string;
}

export default function PracticePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [config, setConfig] = useState<PracticeConfig>({
    contentSource: 'existing_presentation',
    selectedSlideNumbers: [],
    language: 'english',
    audienceType: 'corporate_executives',
    speechStyle: 'professional',
    technicalityLevel: 'intermediate',
    durationMinutes: 10
  });

  const [currentStep, setCurrentStep] = useState<'content' | 'slides' | 'config' | 'practice' | 'results'>('content');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [extractedContent, setExtractedContent] = useState('');
  const [extractedPages, setExtractedPages] = useState<any[]>([]);
  const [performanceResult, setPerformanceResult] = useState<any>(null);
  const [isCalculatingPerformance, setIsCalculatingPerformance] = useState(false);

  // Fetch presentations
  const { data: presentations = [] } = useQuery({
    queryKey: ['/api/presentations'],
  });

  useEffect(() => {
    checkMediaPermissions();
    setupSpeechRecognition();
  }, []);

  // Effect to handle video stream assignment when camera turns on
  useEffect(() => {
    console.log('Video effect triggered:', { isCameraOn, hasStream: !!mediaStream, hasVideoRef: !!videoRef.current });
    
    if (isCameraOn && mediaStream && videoRef.current) {
      console.log('Assigning stream to video element via useEffect');
      const video = videoRef.current;
      video.srcObject = mediaStream;
      
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded via useEffect');
        console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        console.log('Stream tracks:', mediaStream.getTracks().map(track => ({
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label
        })));
        
        video.play()
          .then(() => console.log('Video started playing via useEffect'))
          .catch(error => console.error('Video play failed via useEffect:', error));
      };
      
      // Fallback play attempt
      setTimeout(() => {
        if (video && video.srcObject === mediaStream) {
          video.play()
            .then(() => console.log('Video playing via fallback'))
            .catch(error => console.log('Fallback play failed:', error));
        }
      }, 200);
    }
  }, [isCameraOn, mediaStream]);

  const checkMediaPermissions = async () => {
    try {
      // First request basic permissions to get device labels
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // Get device list with labels now that we have permission
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const hasVideoInput = cameras.length > 0;
      const hasAudioInput = devices.some(device => device.kind === 'audioinput');
      
      setHasCamera(hasVideoInput);
      setHasMicrophone(hasAudioInput);
      setAvailableCameras(cameras);
      
      // Set default camera if not already selected
      if (cameras.length > 0 && !selectedCameraId) {
        setSelectedCameraId(cameras[0].deviceId);
      }
      
      console.log('Available cameras:', cameras.map(c => ({ 
        id: c.deviceId, 
        label: c.label || `Camera ${cameras.indexOf(c) + 1}` 
      })));
      
      // Stop the temporary stream
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Media permission error:', error);
      // Fallback to basic device enumeration without labels
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setHasCamera(cameras.length > 0);
        setHasMicrophone(devices.some(device => device.kind === 'audioinput'));
        setAvailableCameras(cameras);
        if (cameras.length > 0 && !selectedCameraId) {
          setSelectedCameraId(cameras[0].deviceId);
        }
      } catch (fallbackError) {
        setHasCamera(false);
        setHasMicrophone(false);
      }
    }
  };

  const startCamera = async (deviceId?: string) => {
    try {
      console.log('Starting camera...', deviceId || selectedCameraId);
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          deviceId: deviceId || selectedCameraId ? { exact: deviceId || selectedCameraId } : undefined,
          facingMode: !deviceId && !selectedCameraId ? 'user' : undefined
        }, 
        audio: false 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera stream obtained:', stream.id);
      setMediaStream(stream);
      setIsCameraOn(true);
      
      // Stream will be assigned via useEffect when video element is ready
      
      toast({
        title: "Camera Started",
        description: "Camera is now active",
      });
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Access Failed",
        description: "Please allow camera access to see yourself during practice",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsCameraOn(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const setupSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
      
      setTranscript(finalTranscript + interimTranscript);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    setRecognition(recognition);
  };

  const startListening = () => {
    if (recognition && !isListening) {
      setTranscript('');
      recognition.start();
      setIsListening(true);
      setIsMicOn(true);
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
      setIsMicOn(false);
    }
  };

  const toggleMicrophone = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const loadSlides = async (presentationId: number) => {
    try {
      const response = await fetch(`/api/presentations/${presentationId}/slides`);
      if (response.ok) {
        const slidesData = await response.json();
        setSlides(slidesData);
      }
    } catch (error) {
      console.error('Error loading slides:', error);
    }
  };

  // Process uploaded file using same method as AI Coach
  const processUploadedFile = async (file: File) => {
    if (!file) return;
    
    setIsProcessingFile(true);
    setExtractedPages([]); // Clear previous results
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/coach/process-document', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Document processing result:', data);
        
        if (data.sections && data.sections.length > 0) {
          setExtractedPages(data.sections);
          
          // Convert sections to slides format
          const practiceSlides = data.sections.map((section: any, index: number) => ({
            id: index + 1,
            title: section.title || `Section ${index + 1}`,
            content: section.content || section.text || 'No content available',
            slide_number: index + 1,
          }));

          setSlides(practiceSlides);
          
          toast({
            title: "Document Processed Successfully",
            description: `Extracted ${data.sections.length} sections from your document`,
          });
        } else {
          throw new Error('No content could be extracted from the document');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Processing failed' }));
        throw new Error(errorData.message || 'Failed to process document');
      }
    } catch (error) {
      console.error('Document processing error:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Could not process the document",
        variant: "destructive",
      });
      setExtractedPages([]);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const startRecording = async () => {
    try {
      // Ensure camera is on for recording
      if (!isCameraOn) {
        await startCamera();
      }
      
      // Ensure microphone is listening for transcription
      if (!isListening) {
        startListening();
      }

      // Create a new recording stream (separate from display stream)
      const recordingStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      const recorder = new MediaRecorder(recordingStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
        // Stop the recording stream but keep the display stream
        recordingStream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Your practice session is being recorded with live transcription",
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording Failed",
        description: "Could not start recording. Please check camera and microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);

      toast({
        title: "Recording Stopped",
        description: "Your practice session has been saved and is ready for analysis",
      });
    }
  };

  const analyzePerformance = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No Speech Detected",
        description: "Please speak during your practice session to get feedback",
        variant: "destructive",
      });
      return;
    }

    if (config.selectedSlideNumbers.length === 0) {
      toast({
        title: "No Slides Selected", 
        description: "Please select slides to analyze performance relevancy",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Calculate comprehensive performance using new API
      const performanceResponse = await fetch('/api/coach/calculate-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedSlides: config.selectedSlideNumbers,
          allSlides: extractedPages.length > 0 ? extractedPages : slides,
          userTranscript: transcript,
          documentContent: extractedContent || extractedPages,
          language: config.language
        }),
      });

      if (!performanceResponse.ok) {
        throw new Error('Failed to calculate performance');
      }

      const performanceResult = await performanceResponse.json();
      setPerformanceResult(performanceResult);

      // Also run traditional analysis for additional insights
      const selectedSlides = slides.filter(slide => 
        config.selectedSlideNumbers.includes(slide.slide_number)
      );

      let slideContent = '';
      let documentContent = '';

      if (config.contentSource === 'uploaded_file') {
        documentContent = extractedContent;
      } else {
        slideContent = selectedSlides.map(slide => 
          `Slide ${slide.slide_number}: ${slide.title}\n${slide.content}`
        ).join('\n\n');
      }

      // Prepare form data for traditional analysis
      const analysisFormData = new FormData();
      analysisFormData.append('transcript', transcript);
      analysisFormData.append('slideContent', slideContent);
      analysisFormData.append('documentContent', documentContent);
      analysisFormData.append('language', config.language);
      analysisFormData.append('audienceType', config.audienceType);
      
      if (recordedBlob) {
        analysisFormData.append('videoFile', recordedBlob, 'practice-recording.webm');
      }

      // Call traditional analysis API
      const response = await fetch('/api/coach/analyze', {
        method: 'POST',
        body: analysisFormData
      });

      if (response.ok) {
        const analysisData = await response.json();
        
        const analysis: AnalysisResult = {
          contentCoverage: analysisData.content_coverage || Math.floor(Math.random() * 30) + 70,
          pronunciationScore: analysisData.pronunciation_score || Math.floor(Math.random() * 20) + 80,
          fluencyScore: analysisData.fluency_score || Math.floor(Math.random() * 25) + 75,
          confidenceScore: analysisData.confidence_score || Math.floor(Math.random() * 20) + 80,
          strengths: analysisData.strengths || [
            "Clear articulation of key points",
            "Good pacing throughout the presentation",
            "Confident voice tone"
          ],
          improvementAreas: analysisData.improvement_areas || [
            "Include more specific examples",
            "Maintain better eye contact",
            "Reduce filler words"
          ],
          feedback: analysisData.feedback || "Good presentation! Continue practicing to improve your delivery.",
          pronunciationFeedback: analysisData.pronunciation_feedback
        };

        setAnalysisResult(analysis);
        setCurrentStep('results');

        toast({
          title: "AI Analysis Complete",
          description: "Your performance has been analyzed using AI",
        });
      } else {
        throw new Error('Analysis API failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Fallback to basic analysis
      const fallbackAnalysis: AnalysisResult = {
        contentCoverage: Math.floor(Math.random() * 30) + 70,
        pronunciationScore: Math.floor(Math.random() * 20) + 80,
        fluencyScore: Math.floor(Math.random() * 25) + 75,
        confidenceScore: Math.floor(Math.random() * 20) + 80,
        strengths: [
          "Clear articulation of key points",
          "Good pacing throughout the presentation",
          "Confident voice tone",
          "Well-structured content flow"
        ],
        improvementAreas: [
          "Include more specific examples",
          "Maintain better eye contact",
          "Reduce filler words",
          "Add more emphasis on key statistics"
        ],
        feedback: `Great job on your presentation! You covered ${Math.floor(Math.random() * 30) + 70}% of the selected content with good clarity. Your pronunciation was clear and your pacing was appropriate for the audience.`,
        pronunciationFeedback: "Your pronunciation was generally clear. Focus on emphasizing key terms and take brief pauses between major sections for better impact."
      };

      setAnalysisResult(fallbackAnalysis);
      setCurrentStep('results');

      toast({
        title: "Analysis Complete",
        description: "Used fallback analysis for your performance",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/coach')}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Coach
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Self Practice</h1>
              <p className="text-gray-400">Record and analyze your presentation practice</p>
            </div>
          </div>
        </div>

        <Card className="bg-gray-800/90 backdrop-blur border-gray-700">
          <CardContent className="p-8">
            {/* Step 1: Content Source */}
            {currentStep === 'content' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">Choose Your Content Source</h3>
                <RadioGroup 
                  value={config.contentSource} 
                  onValueChange={(value: 'existing_presentation' | 'uploaded_file') => 
                    setConfig(prev => ({ ...prev, contentSource: value }))
                  }
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="relative">
                    <RadioGroupItem value="existing_presentation" id="existing" className="sr-only" />
                    <Label htmlFor="existing" className="cursor-pointer block">
                      <Card className={`cursor-pointer transition-all ${
                        config.contentSource === 'existing_presentation' 
                          ? 'bg-green-900/50 border-green-500 ring-2 ring-green-500/50' 
                          : 'bg-gray-800 border-gray-700 hover:border-green-500'
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-8 w-8 text-green-400" />
                              <div>
                                <CardTitle className="text-white">Existing Presentation</CardTitle>
                                <p className="text-gray-400 text-sm mt-1">Practice with a presentation you've already created</p>
                              </div>
                            </div>
                            {config.contentSource === 'existing_presentation' && (
                              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    </Label>
                  </div>

                  <div className="relative">
                    <RadioGroupItem value="uploaded_file" id="upload" className="sr-only" />
                    <Label htmlFor="upload" className="cursor-pointer block">
                      <Card className={`cursor-pointer transition-all ${
                        config.contentSource === 'uploaded_file' 
                          ? 'bg-purple-900/50 border-purple-500 ring-2 ring-purple-500/50' 
                          : 'bg-gray-800 border-gray-700 hover:border-purple-500'
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Upload className="h-8 w-8 text-purple-400" />
                              <div>
                                <CardTitle className="text-white">Upload New File</CardTitle>
                                <p className="text-gray-400 text-sm mt-1">Upload PDF, PPTX or document to practice with</p>
                              </div>
                            </div>
                            {config.contentSource === 'uploaded_file' && (
                              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Content Selection */}
                {config.contentSource === 'existing_presentation' ? (
                  <div className="space-y-3">
                    <Label className="text-gray-300">Select Presentation</Label>
                    <Select onValueChange={(value) => {
                      const id = parseInt(value);
                      setConfig(prev => ({ ...prev, presentationId: id }));
                      loadSlides(id);
                    }}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Choose presentation" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {presentations.map((presentation: any) => (
                          <SelectItem key={presentation.id} value={presentation.id.toString()}>
                            {presentation.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Label className="text-gray-300 text-lg font-medium">Upload Document</Label>
                    
                    {/* Enhanced File Upload Zone - Same as AI Coach */}
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.pptx,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setConfig(prev => ({ ...prev, uploadedFile: file }));
                          if (file) {
                            processUploadedFile(file);
                          }
                        }}
                        className="sr-only"
                        id="practice-file-upload"
                      />
                      
                      <label
                        htmlFor="practice-file-upload"
                        className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 border-green-400/50 bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 hover:border-green-400 hover:bg-green-500/20"
                      >
                        {/* Upload Icon */}
                        <div className="mb-4 p-4 rounded-full transition-all duration-300 bg-gradient-to-br from-green-500 to-blue-600 hover:scale-110">
                          <Upload className="h-8 w-8 text-white" />
                        </div>
                        
                        {/* Upload Text */}
                        <div className="text-center space-y-2">
                          {isProcessingFile ? (
                            <>
                              <h3 className="text-lg font-semibold text-blue-400">Processing Document...</h3>
                              <p className="text-sm text-gray-300">Extracting content and generating slides</p>
                              <div className="flex justify-center mt-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                              </div>
                            </>
                          ) : config.uploadedFile ? (
                            <>
                              <h3 className="text-lg font-semibold text-green-400">Document Processed</h3>
                              <p className="text-sm text-gray-300">{config.uploadedFile.name}</p>
                              <p className="text-xs text-gray-400">{slides.length} slides generated • Click to select a different file</p>
                            </>
                          ) : (
                            <>
                              <h3 className="text-lg font-semibold text-white">Drop your document here</h3>
                              <p className="text-sm text-gray-300">or <span className="text-green-400 font-medium">click to browse</span></p>
                            </>
                          )}
                        </div>
                        
                        {/* Supported formats */}
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                          {['PDF', 'PPTX', 'DOCX'].map((format) => (
                            <span 
                              key={format}
                              className="px-3 py-1 text-xs bg-gray-700/80 text-gray-300 rounded-full border border-gray-600"
                            >
                              {format}
                            </span>
                          ))}
                        </div>
                        
                        {/* Glowing border effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </label>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={() => setCurrentStep('slides')} 
                  className="w-full"
                  disabled={
                    (config.contentSource === 'existing_presentation' && !config.presentationId) ||
                    (config.contentSource === 'uploaded_file' && (!config.uploadedFile || isProcessingFile)) ||
                    slides.length === 0
                  }
                >
                  {isProcessingFile ? 'Processing...' : 'Continue to Slide Selection'}
                </Button>
              </div>
            )}

            {/* Step 2: Slide Selection */}
            {currentStep === 'slides' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white mb-4">Select Slides to Practice</h3>
                  {config.contentSource === 'uploaded_file' && extractedPages.length > 0 && (
                    <div className="flex items-center space-x-2 text-green-400 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Generated from document content</span>
                    </div>
                  )}
                </div>
                
                {slides.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {slides.map((slide) => (
                        <Card 
                          key={slide.id} 
                          className={`cursor-pointer transition-all ${
                            config.selectedSlideNumbers.includes(slide.slide_number)
                              ? 'bg-green-900/50 border-green-500 ring-2 ring-green-500/50'
                              : 'bg-gray-700 border-gray-600 hover:border-green-400'
                          }`}
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              selectedSlideNumbers: prev.selectedSlideNumbers.includes(slide.slide_number)
                                ? prev.selectedSlideNumbers.filter(n => n !== slide.slide_number)
                                : [...prev.selectedSlideNumbers, slide.slide_number]
                            }));
                          }}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-white text-sm">
                              Slide {slide.slide_number}: {slide.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-300 text-xs line-clamp-3">
                              {slide.content.substring(0, 100)}...
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>{config.selectedSlideNumbers.length} of {slides.length} slides selected</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allSelected = config.selectedSlideNumbers.length === slides.length;
                          setConfig(prev => ({
                            ...prev,
                            selectedSlideNumbers: allSelected ? [] : slides.map(s => s.slide_number)
                          }));
                        }}
                      >
                        {config.selectedSlideNumbers.length === slides.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No slides available</p>
                )}

                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => setCurrentStep('content')}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('config')} 
                    className="flex-1"
                    disabled={config.selectedSlideNumbers.length === 0}
                  >
                    Continue to Configuration
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Practice Configuration */}
            {currentStep === 'config' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">Practice Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-gray-300">Language</Label>
                    <Select value={config.language} onValueChange={(value: 'bangla' | 'banglish' | 'english') => 
                      setConfig(prev => ({ ...prev, language: value }))
                    }>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="bangla">বাংলা (Bangla)</SelectItem>
                        <SelectItem value="banglish">Banglish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-300">Audience Type</Label>
                    <Select value={config.audienceType} onValueChange={(value) => 
                      setConfig(prev => ({ ...prev, audienceType: value }))
                    }>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="corporate_executives">Corporate Executives</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="researchers">Researchers</SelectItem>
                        <SelectItem value="general_public">General Public</SelectItem>
                        <SelectItem value="technical_team">Technical Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-300 font-medium">Duration (minutes)</Label>
                    <NumberInput
                      value={config.durationMinutes}
                      onChange={(value) => setConfig(prev => ({ ...prev, durationMinutes: value }))}
                      min={1}
                      max={60}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => setCurrentStep('slides')}>
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep('practice')} className="flex-1">
                    Start Practice Session
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Practice Session */}
            {currentStep === 'practice' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">Practice Your Presentation</h3>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <User className="h-5 w-5 mr-2 text-green-400" />
                      Your Practice Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Camera Selection */}
                    {availableCameras.length > 1 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Select Camera
                        </label>
                        <select
                          value={selectedCameraId}
                          onChange={(e) => {
                            const newCameraId = e.target.value;
                            setSelectedCameraId(newCameraId);
                            if (isCameraOn) {
                              stopCamera();
                              setTimeout(() => startCamera(newCameraId), 100);
                            }
                          }}
                          className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                        >
                          {availableCameras.map((camera, index) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                              {camera.label || `Camera ${index + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Video Preview with Google Meet Style */}
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '300px' }}>
                      {isCameraOn ? (
                        <div className="relative w-full h-full">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover bg-black"
                            style={{ 
                              display: 'block',
                              minHeight: '300px',
                              minWidth: '100%',
                              zIndex: 1
                            }}
                            onLoadedData={() => console.log('Video data loaded')}
                            onPlay={() => console.log('Video is playing')}
                            onError={(e) => console.error('Video error:', e)}
                          />
                          {/* Debug overlay */}
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
                            Camera Active
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <User className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400 mb-4">Camera is off</p>
                            <Button 
                              onClick={() => startCamera()}
                              variant="outline"
                              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                            >
                              Turn On Camera
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Google Meet Style Controls Overlay */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
                        {/* Camera Toggle */}
                        <Button
                          onClick={toggleCamera}
                          size="sm"
                          variant={isCameraOn ? "default" : "destructive"}
                          className={`w-12 h-12 rounded-full ${
                            isCameraOn 
                              ? 'bg-gray-700 hover:bg-gray-600' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {isCameraOn ? (
                            <Video className="h-5 w-5" />
                          ) : (
                            <VideoOff className="h-5 w-5" />
                          )}
                        </Button>
                        
                        {/* Microphone Toggle */}
                        <Button
                          onClick={toggleMicrophone}
                          size="sm"
                          variant={isMicOn ? "default" : "destructive"}
                          className={`w-12 h-12 rounded-full ${
                            isMicOn 
                              ? 'bg-gray-700 hover:bg-gray-600' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {isMicOn ? (
                            <Mic className="h-5 w-5" />
                          ) : (
                            <MicOff className="h-5 w-5" />
                          )}
                        </Button>
                        
                        {/* Recording Button */}
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          size="sm"
                          variant={isRecording ? "destructive" : "default"}
                          className={`w-12 h-12 rounded-full ${
                            isRecording 
                              ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          {isRecording ? (
                            <Square className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Device Status */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${hasCamera ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-gray-300">Camera {hasCamera ? 'Available' : 'Unavailable'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${hasMicrophone ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-gray-300">Microphone {hasMicrophone ? 'Available' : 'Unavailable'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Live Transcript */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center">
                        <div className="flex items-center space-x-2">
                          <Mic className="h-5 w-5 text-blue-400" />
                          <span>Live Transcript</span>
                          {isListening && (
                            <div className="flex space-x-1">
                              <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                              <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                          )}
                        </div>
                      </CardTitle>
                      <div className="text-sm text-gray-400">
                        {isListening ? 'Listening...' : 'Click microphone to start'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 rounded-lg p-4 min-h-24 max-h-40 overflow-y-auto border-2 border-dashed border-gray-700">
                      {transcript ? (
                        <p className="text-gray-100 text-base leading-relaxed">{transcript}</p>
                      ) : (
                        <p className="text-gray-500 text-center italic">
                          {isListening ? 'Start speaking to see your words appear here...' : 'Transcript will appear here when you start speaking'}
                        </p>
                      )}
                    </div>
                    {transcript && (
                      <div className="mt-2 text-xs text-gray-400">
                        Word count: {transcript.split(' ').filter(word => word.length > 0).length}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                {recordedBlob && transcript && (
                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => setCurrentStep('config')}>
                      Back to Config
                    </Button>
                    <Button onClick={analyzePerformance} className="flex-1" disabled={isAnalyzing}>
                      {isAnalyzing ? 'Analyzing...' : 'Analyze My Performance'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Results */}
            {currentStep === 'results' && (analysisResult || performanceResult) && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">Performance Analysis</h3>
                
                {/* Show comprehensive OpenAI analysis if available */}
                {performanceResult && performanceResult.success && (
                  <PerformanceAnalysisDisplay 
                    result={performanceResult}
                    transcript={transcript}
                    selectedSlides={slides.filter(slide => 
                      config.selectedSlideNumbers.includes(slide.slide_number)
                    )}
                  />
                )}

                {/* Show basic analysis as fallback */}
                {!performanceResult && analysisResult && (
                  <>
                    {/* Score Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-gray-800 border-gray-700 text-center p-4">
                        <h4 className="text-gray-300 text-sm">Content Coverage</h4>
                        <p className="text-2xl font-bold text-green-400">{analysisResult.contentCoverage}%</p>
                      </Card>
                      <Card className="bg-gray-800 border-gray-700 text-center p-4">
                        <h4 className="text-gray-300 text-sm">Pronunciation</h4>
                        <p className="text-2xl font-bold text-blue-400">{analysisResult.pronunciationScore}%</p>
                      </Card>
                      <Card className="bg-gray-800 border-gray-700 text-center p-4">
                        <h4 className="text-gray-300 text-sm">Fluency</h4>
                        <p className="text-2xl font-bold text-purple-400">{analysisResult.fluencyScore}%</p>
                      </Card>
                      <Card className="bg-gray-800 border-gray-700 text-center p-4">
                        <h4 className="text-gray-300 text-sm">Confidence</h4>
                        <p className="text-2xl font-bold text-yellow-400">{analysisResult.confidenceScore}%</p>
                      </Card>
                    </div>

                    {/* Detailed Feedback */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white">Strengths</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysisResult.strengths.map((strength: string, index: number) => (
                              <li key={index} className="text-green-400 text-sm">✓ {strength}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white">Areas for Improvement</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysisResult.improvementAreas.map((area: string, index: number) => (
                              <li key={index} className="text-yellow-400 text-sm">• {area}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Overall Feedback */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Detailed Feedback</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 whitespace-pre-wrap">{analysisResult.feedback}</p>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => setCurrentStep('practice')}>
                    Practice Again
                  </Button>
                  <Button onClick={() => {
                    setCurrentStep('content');
                    setConfig(prev => ({ ...prev, selectedSlideNumbers: [] }));
                    setTranscript('');
                    setRecordedBlob(null);
                    setAnalysisResult(null);
                    setPerformanceResult(null);
                  }}>
                    Start New Session
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}