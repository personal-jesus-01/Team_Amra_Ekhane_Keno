import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Play, Pause, Square, Mic, MicOff, Camera, CameraOff, Bot, User, FileText, Volume2, VolumeX } from "lucide-react";
import { NumberInput } from "@/components/ui/number-input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SlideCoachProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CoachConfig {
  mode: 'existing_presentation' | 'uploaded_file';
  presentationId?: number;
  uploadedFile?: File;
  audienceType: string;
  speechStyle: string;
  technicalityLevel: string;
  language: 'bangla' | 'banglish' | 'english';
  durationMinutes: number;
  slideRangeStart?: number;
  slideRangeEnd?: number;
  practiceScope: 'full' | 'range';
}

interface AIAvatar {
  isVisible: boolean;
  isSpeaking: boolean;
  currentText: string;
}

export default function EnhancedSlideCoach({ open, onOpenChange }: SlideCoachProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'mode' | 'config' | 'preview' | 'generate' | 'practice' | 'results'>('mode');
  const [config, setConfig] = useState<CoachConfig>({
    mode: 'existing_presentation',
    audienceType: 'corporate_executives',
    speechStyle: 'professional',
    technicalityLevel: 'intermediate',
    language: 'english',
    durationMinutes: 10,
    practiceScope: 'full'
  });
  
  // AI-generated content state
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [presentations, setPresentations] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [selectedSlides, setSelectedSlides] = useState<any[]>([]);
  
  // AI Avatar state
  const [aiAvatar, setAiAvatar] = useState<AIAvatar>({
    isVisible: false,
    isSpeaking: false,
    currentText: ''
  });
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  
  // Performance analysis state
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load presentations on mount
  useEffect(() => {
    if (open && config.mode === 'existing_presentation') {
      loadPresentations();
    }
  }, [open, config.mode]);

  // Initialize media permissions
  useEffect(() => {
    checkMediaPermissions();
  }, []);

  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setHasCamera(true);
      setHasMicrophone(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.log('Media permissions not granted:', error);
    }
  };

  const loadPresentations = async () => {
    try {
      const response = await apiRequest('GET', '/api/presentations');
      const data = await response.json();
      setPresentations(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load presentations",
        variant: "destructive",
      });
    }
  };

  const loadSlides = async (presentationId: number) => {
    try {
      const response = await apiRequest('GET', `/api/presentations/${presentationId}/slides`);
      const data = await response.json();
      setSlides(data);
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to load slides",
        variant: "destructive",
      });
    }
  };

  const generateSpeechScript = async () => {
    try {
      setStep('generate');
      
      let slidesData = selectedSlides;
      
      // If uploading file, create demo script for now
      if (config.mode === 'uploaded_file' && config.uploadedFile) {
        slidesData = [{
          title: 'Uploaded Content Practice',
          content: `This is a practice session based on your uploaded file: ${config.uploadedFile.name}. The AI will generate a sample speech script for demonstration purposes.`,
          slide_number: 1
        }];
      }

      // For demo purposes, generate a sample script based on the configuration
      const demoScript = generateDemoScript(config, slidesData);
      setGeneratedScript(demoScript);
      setStep('practice');
      
      toast({
        title: "Speech Generated",
        description: "AI has created your personalized speech script",
      });
    } catch (error) {
      console.error('Error generating speech script:', error);
      toast({
        title: "Error",
        description: "Failed to generate speech script",
        variant: "destructive",
      });
    }
  };

  const generateDemoScript = (config: CoachConfig, slides: any[]): string => {
    const languageGreetings = {
      bangla: "আসসালামু আলাইকুম, আমি আজ আপনাদের সামনে একটি গুরুত্বপূর্ণ উপস্থাপনা নিয়ে এসেছি।",
      banglish: "Assalamu alaikum, ami ajke apnader shamne ekta important presentation niye eshechi.",
      english: "Good morning everyone, I'm here today to present an important topic to you."
    };

    const audienceContext = {
      corporate_executives: "business strategy and implementation",
      students: "educational concepts and learning objectives", 
      researchers: "research findings and methodological insights",
      general_public: "accessible information and practical applications",
      technical_team: "technical specifications and implementation details"
    };

    const styleApproach = {
      professional: "structured and authoritative manner",
      persuasive: "compelling and influential approach",
      narrative: "story-driven and engaging style",
      casual: "friendly and conversational tone",
      educational: "clear and informative method"
    };

    return `${languageGreetings[config.language]}

Today's presentation focuses on ${audienceContext[config.audienceType]} delivered in a ${styleApproach[config.speechStyle]}.

${slides.map((slide, index) => `
${config.language === 'bangla' ? `স্লাইড ${index + 1}` : config.language === 'banglish' ? `Slide ${index + 1}` : `Slide ${index + 1}`}: ${slide.title || `Slide ${index + 1}`}
${slide.content || 'Content for this slide will be discussed in detail.'}
`).join('\n')}

${config.language === 'bangla' ? 'ধন্যবাদ সবাইকে। আপনাদের কোন প্রশ্ন থাকলে জিজ্ঞাসা করতে পারেন।' : 
  config.language === 'banglish' ? 'Dhonnobad shobaike. Apnader kono proshno thakle jiggasha korte paren.' :
  'Thank you for your attention. I welcome any questions you may have.'}`;
  };

  const startAIAvatar = () => {
    if (!generatedScript) return;
    
    setAiAvatar({ isVisible: true, isSpeaking: true, currentText: generatedScript });
    
    // Use Speech Synthesis API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(generatedScript);
      
      // Set language based on config
      switch (config.language) {
        case 'bangla':
          utterance.lang = 'bn-BD';
          break;
        case 'english':
          utterance.lang = 'en-US';
          break;
        case 'banglish':
          utterance.lang = 'en-US'; // Fallback to English for Banglish
          break;
      }
      
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        setAiAvatar(prev => ({ ...prev, isSpeaking: false }));
      };
      
      speechSynthRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const stopAIAvatar = () => {
    if (speechSynthRef.current) {
      speechSynthesis.cancel();
    }
    setAiAvatar({ isVisible: true, isSpeaking: false, currentText: generatedScript });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start speech recognition
      startSpeechRecognition();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to access camera/microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const startSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      
      // Set language for recognition
      switch (config.language) {
        case 'bangla':
          recognition.lang = 'bn-BD';
          break;
        case 'english':
          recognition.lang = 'en-US';
          break;
        case 'banglish':
          recognition.lang = 'en-US'; // Fallback for Banglish
          break;
      }
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const analyzePerformance = async () => {
    if (!transcript || !generatedScript) {
      toast({
        title: "Error",
        description: "Missing transcript or speech script",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsAnalyzing(true);
      
      const slideContent = selectedSlides.map(slide => slide.content).join('\n');
      
      const response = await apiRequest('POST', '/api/coach/analyze-performance', {
        userTranscript: transcript,
        idealScript: generatedScript,
        slideContent: slideContent,
        language: config.language
      });
      
      const analysis = await response.json();
      setAnalysisResult(analysis);
      setStep('results');
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze performance",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-6xl h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Slide Coach - AI-Powered Practice</h2>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400">
              ✕
            </Button>
          </div>

          {/* Step 1: Content Source Selection */}
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
                        ? 'bg-indigo-900/50 border-indigo-500 ring-2 ring-indigo-500/50' 
                        : 'bg-gray-800 border-gray-700 hover:border-indigo-500'
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-8 w-8 text-indigo-400" />
                            <div>
                              <CardTitle className="text-white">Existing Presentation</CardTitle>
                              <p className="text-gray-400 text-sm mt-1">Practice with a presentation you've already created</p>
                            </div>
                          </div>
                          {config.contentSource === 'existing_presentation' && (
                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
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
                      {presentations.map((presentation) => (
                        <SelectItem key={presentation.id} value={presentation.id.toString()}>
                          {presentation.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-gray-300">Upload File</Label>
                  <Input
                    type="file"
                    accept=".pdf,.pptx,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setConfig(prev => ({ ...prev, uploadedFile: file }));
                      if (file) {
                        // Create mock slides for uploaded file
                        setSlides([
                          { id: 1, title: 'Slide 1 - Introduction', content: `Content from ${file.name}`, slide_number: 1 },
                          { id: 2, title: 'Slide 2 - Main Content', content: `Main content from ${file.name}`, slide_number: 2 },
                          { id: 3, title: 'Slide 3 - Conclusion', content: `Conclusion from ${file.name}`, slide_number: 3 }
                        ]);
                      }
                    }}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              )}
              
              <Button 
                onClick={() => setCurrentStep('slides')} 
                className="w-full"
                disabled={
                  (config.contentSource === 'existing_presentation' && !config.presentationId) ||
                  (config.contentSource === 'uploaded_file' && !config.uploadedFile)
                }
              >
                Continue to Slide Selection
              </Button>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 'config' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Speech Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Presentation/File Selection */}
                {config.mode === 'existing_presentation' ? (
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
                        {presentations.map((presentation) => (
                          <SelectItem key={presentation.id} value={presentation.id.toString()}>
                            {presentation.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label className="text-gray-300">Upload File</Label>
                    <Input
                      type="file"
                      accept=".pdf,.pptx,.docx"
                      onChange={(e) => setConfig(prev => ({ ...prev, uploadedFile: e.target.files?.[0] }))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                )}

                {/* Language Selection */}
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

                {/* Audience Type */}
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

                {/* Speech Style */}
                <div className="space-y-3">
                  <Label className="text-gray-300">Speech Style</Label>
                  <Select value={config.speechStyle} onValueChange={(value) => 
                    setConfig(prev => ({ ...prev, speechStyle: value }))
                  }>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="persuasive">Persuasive</SelectItem>
                      <SelectItem value="narrative">Narrative</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Technical Level */}
                <div className="space-y-3">
                  <Label className="text-gray-300">Technical Level</Label>
                  <Select value={config.technicalityLevel} onValueChange={(value) => 
                    setConfig(prev => ({ ...prev, technicalityLevel: value }))
                  }>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="layman_friendly">Layman-Friendly</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert_level">Expert Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
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

              {/* Slide Range Selection */}
              {slides.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-gray-300">Practice Scope</Label>
                  <RadioGroup 
                    value={config.practiceScope} 
                    onValueChange={(value: 'full' | 'range') => 
                      setConfig(prev => ({ ...prev, practiceScope: value }))
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full" className="text-gray-300">Practice entire presentation ({slides.length} slides)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="range" id="range" />
                      <Label htmlFor="range" className="text-gray-300">Practice specific slide range</Label>
                    </div>
                  </RadioGroup>

                  {config.practiceScope === 'range' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 font-medium">Start Slide</Label>
                        <NumberInput
                          value={config.slideRangeStart || 1}
                          onChange={(value) => setConfig(prev => ({ ...prev, slideRangeStart: value }))}
                          min={1}
                          max={slides.length}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 font-medium">End Slide</Label>
                        <NumberInput
                          value={config.slideRangeEnd || slides.length}
                          onChange={(value) => setConfig(prev => ({ ...prev, slideRangeEnd: value }))}
                          min={config.slideRangeStart || 1}
                          max={slides.length}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setStep('mode')}>
                  Back
                </Button>
                <Button onClick={() => {
                  // Set selected slides based on configuration
                  if (config.practiceScope === 'full') {
                    setSelectedSlides(slides);
                  } else {
                    const start = (config.slideRangeStart || 1) - 1;
                    const end = config.slideRangeEnd || slides.length;
                    setSelectedSlides(slides.slice(start, end));
                  }
                  
                  // For uploaded file mode, create mock slide data
                  if (config.mode === 'uploaded_file' && config.uploadedFile) {
                    setSelectedSlides([{
                      id: 1,
                      title: 'Uploaded Content',
                      content: `Practice presentation based on: ${config.uploadedFile.name}`,
                      slide_number: 1
                    }]);
                  }
                  
                  generateSpeechScript();
                }} className="flex-1">
                  Generate Speech Script
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Generate Script (Loading) */}
          {step === 'generate' && (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-indigo-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold text-white mb-2">Generating Your Speech Script</h3>
              <p className="text-gray-400">AI is creating a personalized speech based on your preferences...</p>
            </div>
          )}

          {/* Step 4: Practice with AI Avatar */}
          {step === 'practice' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Practice Your Presentation</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Avatar Section */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Bot className="h-5 w-5 mr-2 text-indigo-400" />
                      AI Speech Coach
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aiAvatar.isVisible && (
                      <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-lg p-6 border border-indigo-500/30">
                        <div className="flex items-center mb-4">
                          <div className={`w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center ${aiAvatar.isSpeaking ? 'animate-pulse' : ''}`}>
                            <Bot className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-white font-medium">AI Coach</h4>
                            <p className="text-gray-300 text-sm">
                              {aiAvatar.isSpeaking ? 'Speaking...' : 'Ready to help'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-900/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">
                            {aiAvatar.currentText.substring(0, 200)}...
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={startAIAvatar}
                        disabled={aiAvatar.isSpeaking}
                        className="flex-1"
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Listen to AI Speech
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={stopAIAvatar}
                        disabled={!aiAvatar.isSpeaking}
                      >
                        <VolumeX className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* User Practice Section */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <User className="h-5 w-5 mr-2 text-green-400" />
                      Your Practice
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Video Preview */}
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Recording Controls */}
                    <div className="flex space-x-2">
                      {!isRecording ? (
                        <Button 
                          onClick={startRecording}
                          className="flex-1"
                          disabled={!hasCamera || !hasMicrophone}
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          Start Practice
                        </Button>
                      ) : (
                        <Button 
                          onClick={stopRecording}
                          variant="destructive"
                          className="flex-1"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Stop Practice
                        </Button>
                      )}
                    </div>
                    
                    {/* Permission Status */}
                    <div className="text-sm text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>Camera: {hasCamera ? '✓ Ready' : '✗ Not available'}</span>
                        <span>Microphone: {hasMicrophone ? '✓ Ready' : '✗ Not available'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Live Transcript */}
              {transcript && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Live Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 rounded-lg p-4 max-h-32 overflow-y-auto">
                      <p className="text-gray-300 text-sm">{transcript}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {recordedBlob && transcript && (
                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => setStep('config')}>
                    Back to Config
                  </Button>
                  <Button onClick={analyzePerformance} className="flex-1" disabled={isAnalyzing}>
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Performance'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Results */}
          {step === 'results' && analysisResult && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Performance Analysis</h3>
              
              {/* Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gray-800 border-gray-700 text-center p-4">
                  <h4 className="text-gray-300 text-sm">Content Coverage</h4>
                  <p className="text-2xl font-bold text-indigo-400">{analysisResult.contentCoverage}%</p>
                </Card>
                <Card className="bg-gray-800 border-gray-700 text-center p-4">
                  <h4 className="text-gray-300 text-sm">Pronunciation</h4>
                  <p className="text-2xl font-bold text-green-400">{analysisResult.pronunciationScore}%</p>
                </Card>
                <Card className="bg-gray-800 border-gray-700 text-center p-4">
                  <h4 className="text-gray-300 text-sm">Fluency</h4>
                  <p className="text-2xl font-bold text-blue-400">{analysisResult.fluencyScore}%</p>
                </Card>
                <Card className="bg-gray-800 border-gray-700 text-center p-4">
                  <h4 className="text-gray-300 text-sm">Confidence</h4>
                  <p className="text-2xl font-bold text-purple-400">{analysisResult.confidenceScore}%</p>
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

              {/* Pronunciation Feedback */}
              {analysisResult.pronunciationFeedback && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Pronunciation Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">{analysisResult.pronunciationFeedback}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setStep('practice')}>
                  Practice Again
                </Button>
                <Button onClick={() => {
                  setStep('mode');
                  // Reset state
                  setGeneratedScript('');
                  setTranscript('');
                  setRecordedBlob(null);
                  setAnalysisResult(null);
                  setAiAvatar({ isVisible: false, isSpeaking: false, currentText: '' });
                }}>
                  Start New Session
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}