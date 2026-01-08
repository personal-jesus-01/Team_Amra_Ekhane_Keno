import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bot, FileText, Upload, Volume2, VolumeX, ArrowLeft, Play, Pause } from 'lucide-react';
import { NumberInput } from '@/components/ui/number-input';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface Slide {
  id: number;
  title: string;
  content: string;
  slide_number: number;
}

interface CoachConfig {
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

export default function AICoachPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<CoachConfig>({
    contentSource: 'existing_presentation',
    selectedSlideNumbers: [],
    language: 'english',
    audienceType: 'corporate_executives',
    speechStyle: 'professional',
    technicalityLevel: 'intermediate',
    durationMinutes: 10
  });

  const [currentStep, setCurrentStep] = useState<'content' | 'slides' | 'config' | 'ai-demo'>('content');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [extractedPages, setExtractedPages] = useState<{page: number, content: string, title: string}[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [speechWords, setSpeechWords] = useState<string[]>([]);
  const [highlightedWords, setHighlightedWords] = useState<Set<number>>(new Set());
  const [speechProgress, setSpeechProgress] = useState(0);

  // Fetch presentations
  const { data: presentations = [] } = useQuery({
    queryKey: ['/api/presentations'],
  });

  // Stop speech when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop speech when user navigates away from demo step
  useEffect(() => {
    if (currentStep !== 'ai-demo' && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentWordIndex(0);
      setHighlightedWords(new Set());
      setSpeechProgress(0);
    }
  }, [currentStep]);

  const loadSlides = async (presentationId: number) => {
    try {
      const response = await fetch(`/api/presentations/${presentationId}/slides`);
      if (response.ok) {
        const slidesData = await response.json();
        setSlides(slidesData);
        // Reset slide selection when loading new presentation
        setConfig(prev => ({ ...prev, selectedSlideNumbers: [] }));
      }
    } catch (error) {
      console.error('Error loading slides:', error);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    
    setConfig(prev => ({ ...prev, uploadedFile: file, contentSource: 'uploaded_file' }));
    setIsExtracting(true);
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
        
        if (data.sections && data.sections.length > 0) {
          setExtractedPages(data.sections);
          setCurrentStep('slides');
          
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
      setIsExtracting(false);
    }
  };

  const generateScript = async () => {
    setIsGeneratingScript(true);
    
    try {
      let contentToProcess = '';
      let selectedContent: any[] = [];
      
      if (config.contentSource === 'uploaded_file' && extractedPages.length > 0) {
        // Use ONLY selected pages from extracted document content
        const selectedPages = extractedPages.filter(page => 
          config.selectedSlideNumbers.includes(page.page)
        );
        
        if (selectedPages.length === 0) {
          throw new Error('No sections selected. Please select at least one section.');
        }
        
        selectedContent = selectedPages;
        contentToProcess = selectedPages.map(page => 
          `Section: ${page.title}\nContent: ${page.content}`
        ).join('\n\n');
      } else {
        // Use selected slides content from existing presentations
        const selectedSlides = slides.filter(slide => 
          config.selectedSlideNumbers.includes(slide.slide_number)
        );
        
        if (selectedSlides.length === 0) {
          throw new Error('No slides selected. Please select at least one slide.');
        }
        
        selectedContent = selectedSlides;
        contentToProcess = selectedSlides.map(slide => 
          `Slide ${slide.slide_number}: ${slide.title}\nContent: ${slide.content}`
        ).join('\n\n');
      }

      console.log('Generating speech for selected content:', {
        contentSource: config.contentSource,
        selectedCount: selectedContent.length,
        contentLength: contentToProcess.length
      });

      // Generate AI speech script using OpenAI with ONLY the selected content
      const response = await fetch('/api/coach/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slides: selectedContent,
          content: contentToProcess,
          config: {
            audienceType: config.audienceType,
            speechStyle: config.speechStyle,
            technicalityLevel: config.technicalityLevel,
            language: config.language,
            durationMinutes: config.durationMinutes
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // ONLY use OpenAI generated script - no fallback to fake content
        if (data.script && data.script.trim().length > 0) {
          setGeneratedScript(data.script);
          
          // Prepare words for real-time highlighting
          const words = data.script.split(/\s+/).filter(word => word.length > 0);
          setSpeechWords(words);
          setCurrentWordIndex(0);
          setHighlightedWords(new Set());
          setSpeechProgress(0);
          
          toast({
            title: "AI Speech Generated",
            description: `Speech created from ${selectedContent.length} selected ${config.contentSource === 'uploaded_file' ? 'sections' : 'slides'}`,
          });
          
          setCurrentStep('ai-demo');
        } else {
          throw new Error('OpenAI returned empty speech script');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to generate speech from selected content');
      }
    } catch (error) {
      console.error('Speech generation error:', error);
      
      toast({
        title: "Speech Generation Failed",
        description: error instanceof Error ? error.message : "Could not generate speech from selected content",
        variant: "destructive",
      });
      
      // Do NOT proceed to demo step if speech generation fails
      // Stay on current step so user can try again
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateFallbackScript = () => {
    const languageGreetings = {
      bangla: "আসসালামু আলাইকুম, আমি আজ আপনাদের সামনে একটি গুরুত্বপূর্ণ উপস্থাপনা নিয়ে এসেছি।",
      banglish: "Assalamu alaikum, ami ajke apnader shamne ekta important presentation niye eshechi.",
      english: "Good morning everyone, I'm here today to present an important topic to you."
    };

    let content = '';
    
    if (config.contentSource === 'uploaded_file' && extractedPages.length > 0) {
      const selectedPages = extractedPages.filter(page => 
        config.selectedSlideNumbers.includes(page.page)
      );
      content = selectedPages.map(page => `
${config.language === 'bangla' ? `পৃষ্ঠা ${page.page}` : 
  config.language === 'banglish' ? `Page ${page.page}` : 
  `Page ${page.page}`}:

${page.content}
`).join('\n');
    } else {
      const selectedSlides = slides.filter(slide => 
        config.selectedSlideNumbers.includes(slide.slide_number)
      );
      content = selectedSlides.map(slide => `
${config.language === 'bangla' ? `স্লাইড ${slide.slide_number}` : 
  config.language === 'banglish' ? `Slide ${slide.slide_number}` : 
  `Slide ${slide.slide_number}`}: ${slide.title}

${slide.content}
`).join('\n');
    }

    return `${languageGreetings[config.language]}

${content}

${config.language === 'bangla' ? 'ধন্যবাদ সবাইকে। আপনাদের কোন প্রশ্ন থাকলে জিজ্ঞাসা করতে পারেন।' : 
  config.language === 'banglish' ? 'Dhonnobad shobaike. Apnader kono proshno thakle jiggasha korte paren.' :
  'Thank you for your attention. I welcome any questions you may have.'}`;
  };

  const playAIDemo = () => {
    if (generatedScript && 'speechSynthesis' in window && speechWords.length > 0) {
      // Stop any existing speech
      speechSynthesis.cancel();
      
      // Reset highlighting state
      setCurrentWordIndex(0);
      setHighlightedWords(new Set());
      setSpeechProgress(0);
      
      const utterance = new SpeechSynthesisUtterance(generatedScript);
      utterance.rate = 0.8; // Slightly slower for better word tracking
      utterance.pitch = 1.1;
      utterance.volume = 0.9;
      utterance.lang = config.language === 'bangla' ? 'bn-BD' : 'en-US';
      
      // Real-time word boundary detection
      let wordIndex = 0;
      let startTime: number;
      let intervalId: NodeJS.Timeout;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        startTime = Date.now();
        
        // Calculate words per second based on speech rate
        const baseWordsPerMinute = 150; // Baseline WPM
        const adjustedWPM = baseWordsPerMinute * utterance.rate;
        const wordsPerSecond = adjustedWPM / 60;
        const msPerWord = 1000 / wordsPerSecond;
        
        console.log(`Starting speech with ${speechWords.length} words at ${adjustedWPM} WPM (${msPerWord}ms per word)`);
        
        // Use interval for consistent word highlighting
        intervalId = setInterval(() => {
          if (!speechSynthesis.speaking) {
            clearInterval(intervalId);
            return;
          }
          
          const elapsed = Date.now() - startTime;
          const expectedWordIndex = Math.floor(elapsed / msPerWord);
          
          if (expectedWordIndex !== wordIndex && expectedWordIndex < speechWords.length) {
            wordIndex = expectedWordIndex;
            setCurrentWordIndex(wordIndex);
            
            // Add word to highlighted set (karaoke-style persistence)
            setHighlightedWords(prev => new Set([...prev, wordIndex]));
            
            // Update progress
            setSpeechProgress((wordIndex / speechWords.length) * 100);
            
            // Auto-scroll to current word if needed
            const currentWordElement = document.getElementById(`word-${wordIndex}`);
            if (currentWordElement) {
              currentWordElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              });
            }
            
            console.log(`Highlighting word ${wordIndex}: "${speechWords[wordIndex]}"`);
          }
        }, 50); // Update every 50ms for smooth animation
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setSpeechProgress(100);
        clearInterval(intervalId);
        
        // Highlight all remaining words
        setHighlightedWords(new Set(Array.from({ length: speechWords.length }, (_, i) => i)));
        setCurrentWordIndex(speechWords.length - 1);
        
        console.log('Speech completed');
        
        // Reset after a delay
        setTimeout(() => {
          setCurrentWordIndex(0);
          setHighlightedWords(new Set());
          setSpeechProgress(0);
        }, 3000);
      };
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setIsPlaying(false);
        setCurrentWordIndex(0);
        setHighlightedWords(new Set());
        setSpeechProgress(0);
        clearInterval(intervalId);
        
        toast({
          title: "Speech Error",
          description: "Could not play the speech. Please try again.",
          variant: "destructive",
        });
      };
      
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "No Script Available",
        description: "Please generate a speech script first.",
        variant: "destructive",
      });
    }
  };

  const stopAIDemo = () => {
    console.log('Stopping AI speech demonstration');
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentWordIndex(0);
    setHighlightedWords(new Set());
    setSpeechProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 p-6">
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
              <h1 className="text-3xl font-bold text-white">AI Speech Coach</h1>
              <p className="text-gray-400">Watch AI demonstrate your presentation</p>
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
                          ? 'bg-indigo-900/50 border-indigo-500 ring-2 ring-indigo-500/50' 
                          : 'bg-gray-800 border-gray-700 hover:border-indigo-500'
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-8 w-8 text-indigo-400" />
                              <div>
                                <CardTitle className="text-white">Existing Presentation</CardTitle>
                                <p className="text-gray-400 text-sm mt-1">Use a presentation you've already created</p>
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
                      } ${isExtracting ? 'opacity-75 pointer-events-none' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Upload className="h-8 w-8 text-purple-400" />
                              <div>
                                <CardTitle className="text-white">Upload New File</CardTitle>
                                <p className="text-gray-400 text-sm mt-1">Upload PDF, PPTX or document</p>
                              </div>
                            </div>
                            {config.contentSource === 'uploaded_file' && (
                              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                {isExtracting ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                )}
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
                            {presentation.title} ({presentation.slides_count || 0} slides)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Label className="text-gray-300 text-lg font-medium">Upload Document</Label>
                    
                    {/* Enhanced File Upload Zone */}
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.pptx,.docx"
                        disabled={isExtracting}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && !isExtracting) {
                            setConfig(prev => ({ ...prev, uploadedFile: file }));
                            handleFileUpload([file]);
                          }
                        }}
                        className="sr-only"
                        id="file-upload"
                      />
                      
                      <label
                        htmlFor="file-upload"
                        className={`
                          relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
                          ${isExtracting 
                            ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed' 
                            : 'border-indigo-400/50 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:border-indigo-400 hover:bg-indigo-500/20'
                          }
                        `}
                      >
                        {/* Upload Icon */}
                        <div className={`
                          mb-4 p-4 rounded-full transition-all duration-300
                          ${isExtracting 
                            ? 'bg-gray-700' 
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-110'
                          }
                        `}>
                          {isExtracting ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                          ) : (
                            <Upload className="h-8 w-8 text-white" />
                          )}
                        </div>
                        
                        {/* Upload Text */}
                        <div className="text-center space-y-2">
                          {isExtracting ? (
                            <>
                              <h3 className="text-lg font-semibold text-gray-300">Processing with AI...</h3>
                              <p className="text-sm text-gray-400">Extracting content from your document</p>
                            </>
                          ) : config.uploadedFile ? (
                            <>
                              <h3 className="text-lg font-semibold text-green-400">File Selected</h3>
                              <p className="text-sm text-gray-300">{config.uploadedFile.name}</p>
                              <p className="text-xs text-gray-400">Click to select a different file</p>
                            </>
                          ) : (
                            <>
                              <h3 className="text-lg font-semibold text-white">Drop your document here</h3>
                              <p className="text-sm text-gray-300">or <span className="text-indigo-400 font-medium">click to browse</span></p>
                            </>
                          )}
                        </div>
                        
                        {/* Supported formats */}
                        {!isExtracting && (
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
                        )}
                        
                        {/* Glowing border effect */}
                        {!isExtracting && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        )}
                      </label>
                    </div>
                    
                    {/* Processing Status */}
                    {isExtracting && (
                      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
                          <div>
                            <p className="font-medium text-white">AI Processing in Progress</p>
                            <p className="text-sm text-gray-400">Using OpenAI to extract and analyze document content...</p>
                          </div>
                        </div>
                        
                        {/* Progress Animation */}
                        <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <Button 
                  onClick={() => setCurrentStep('slides')} 
                  className="w-full"
                  disabled={
                    (config.contentSource === 'existing_presentation' && !config.presentationId) ||
                    (config.contentSource === 'uploaded_file' && !config.uploadedFile) ||
                    isExtracting
                  }
                >
                  {isExtracting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Document...
                    </>
                  ) : (
                    'Continue to Selection'
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: Slide/Section Selection */}
            {currentStep === 'slides' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {config.contentSource === 'uploaded_file' ? 'Select Document Sections' : 'Select Slides to Practice'}
                </h3>
                
                {/* Document processing loader */}
                {isExtracting && (
                  <div className="text-center py-20">
                    <div className="flex flex-col items-center space-y-6">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-500 border-t-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Upload className="h-8 w-8 text-indigo-400" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-white">AI is processing your document</h3>
                        <p className="text-lg text-gray-400">Extracting content and creating intelligent sections...</p>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                          <div className="animate-pulse w-2 h-2 bg-indigo-400 rounded-full"></div>
                          <span>This may take 30-60 seconds</span>
                          <div className="animate-pulse w-2 h-2 bg-indigo-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document sections from OCR */}
                {config.contentSource === 'uploaded_file' && extractedPages.length > 0 && !isExtracting && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-400 mb-4">
                      Select the sections you want to practice presenting:
                    </div>
                    {extractedPages.map((page) => (
                      <div
                        key={page.page}
                        className={`
                          border-2 rounded-lg p-4 cursor-pointer transition-all
                          ${config.selectedSlideNumbers.includes(page.page) 
                            ? 'border-indigo-500 bg-indigo-500/10' 
                            : 'border-gray-600 bg-gray-800/50 hover:border-indigo-400'
                          }
                        `}
                        onClick={() => {
                          const isSelected = config.selectedSlideNumbers.includes(page.page);
                          if (isSelected) {
                            setConfig(prev => ({
                              ...prev,
                              selectedSlideNumbers: prev.selectedSlideNumbers.filter(num => num !== page.page)
                            }));
                          } else {
                            setConfig(prev => ({
                              ...prev,
                              selectedSlideNumbers: [...prev.selectedSlideNumbers, page.page]
                            }));
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={config.selectedSlideNumbers.includes(page.page)}
                            onChange={() => {}} // Handled by parent onClick
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2">{page.title}</h4>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {page.content.length > 250 ? `${page.content.substring(0, 250)}...` : page.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-between items-center text-sm text-gray-400 pt-2">
                      <span>{config.selectedSlideNumbers.length} of {extractedPages.length} sections selected</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allSelected = config.selectedSlideNumbers.length === extractedPages.length;
                          setConfig(prev => ({
                            ...prev,
                            selectedSlideNumbers: allSelected ? [] : extractedPages.map(p => p.page)
                          }));
                        }}
                      >
                        {config.selectedSlideNumbers.length === extractedPages.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Existing presentation slides */}
                {config.contentSource === 'existing_presentation' && slides.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {slides.map((slide) => (
                        <Card 
                          key={slide.id} 
                          className={`cursor-pointer transition-all ${
                            config.selectedSlideNumbers.includes(slide.slide_number)
                              ? 'bg-indigo-900/50 border-indigo-500 ring-2 ring-indigo-500/50'
                              : 'bg-gray-700 border-gray-600 hover:border-indigo-400'
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
                )}

                {/* Empty state */}
                {!isExtracting && (
                  (config.contentSource === 'uploaded_file' && extractedPages.length === 0) ||
                  (config.contentSource === 'existing_presentation' && slides.length === 0)
                ) && (
                  <div className="text-center py-8 text-gray-400">
                    {config.contentSource === 'uploaded_file' 
                      ? 'No content extracted. Please try uploading again.'
                      : 'No slides available. Please select a presentation first.'
                    }
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => setCurrentStep('content')}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('config')} 
                    className="flex-1"
                    disabled={config.selectedSlideNumbers.length === 0 || isExtracting}
                  >
                    Continue to Configuration
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Speech Configuration */}
            {currentStep === 'config' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">Speech Configuration</h3>
                
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
                  <Button 
                    onClick={generateScript} 
                    className="flex-1"
                    disabled={isGeneratingScript}
                  >
                    {isGeneratingScript ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating AI Speech...
                      </>
                    ) : (
                      'Generate AI Demonstration'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: AI Demonstration */}
            {currentStep === 'ai-demo' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">AI Speech Demonstration</h3>
                
                {/* Speech Generation Loader */}
                {isGeneratingScript && (
                  <div className="text-center py-16">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Bot className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">AI is generating your speech</h3>
                        <p className="text-gray-400">Creating personalized presentation script from your selected content...</p>
                        <p className="text-sm text-gray-500">This may take 15-30 seconds</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Large AI Avatar Demo */}
                {!isGeneratingScript && (
                  <div className="min-h-screen flex flex-col items-center justify-center space-y-8 py-12">
                  {/* Massive AI Avatar - Center Stage with Equalizer */}
                  <div className="flex justify-center relative">
                    {/* Equalizer Animation */}
                    {isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[520px] h-[520px] rounded-full border-4 border-indigo-400/30 animate-ping"></div>
                        <div className="absolute w-[540px] h-[540px] rounded-full border-2 border-purple-400/20 animate-pulse"></div>
                        <div className="absolute w-[560px] h-[560px] rounded-full border-2 border-pink-400/15 animate-ping delay-75"></div>
                      </div>
                    )}
                    
                    {/* Main Avatar */}
                    <div className={`
                      w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 
                      flex items-center justify-center shadow-2xl transform transition-all duration-500 relative z-10
                      ${isPlaying ? 'scale-105' : 'hover:scale-102'}
                    `}>
                      <Bot className="w-64 h-64 text-white drop-shadow-2xl" />
                      
                      {/* Inner glow when speaking */}
                      {isPlaying && (
                        <div className="absolute inset-4 rounded-full bg-white/10 animate-pulse"></div>
                      )}
                    </div>
                  </div>

                  {/* Compact Speech Bubble with Word Highlighting */}
                  {isPlaying && speechWords.length > 0 && (
                    <div className="relative max-w-2xl mx-auto">
                      <div className="bg-white rounded-2xl p-4 shadow-2xl relative">
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
                        
                        {/* Real-time Karaoke-style Speech Highlighting */}
                        <div className="relative">
                          {/* Progress bar */}
                          <div className="absolute -top-2 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-100 ease-out rounded-full"
                              style={{ width: `${speechProgress}%` }}
                            />
                          </div>
                          
                          {/* Scrollable text with synchronized highlighting */}
                          <div className="h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pt-2">
                            <p className="text-gray-800 text-base leading-relaxed text-center font-medium">
                              {speechWords.map((word, index) => {
                                const isCurrentWord = index === currentWordIndex;
                                const isHighlighted = highlightedWords.has(index);
                                const isUpcoming = index > currentWordIndex;
                                
                                return (
                                  <span
                                    key={index}
                                    id={`word-${index}`}
                                    className={`
                                      inline-block transition-all duration-300 ease-out mx-0.5
                                      ${isCurrentWord 
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-2 py-1 rounded-lg font-bold transform scale-110 shadow-lg animate-pulse' 
                                        : isHighlighted 
                                          ? 'bg-indigo-100 text-indigo-800 px-1 rounded font-semibold' 
                                          : isUpcoming 
                                            ? 'text-gray-500 hover:text-gray-700' 
                                            : 'text-gray-800'
                                      }
                                      ${isCurrentWord ? 'ring-2 ring-indigo-300 ring-opacity-50' : ''}
                                    `}
                                    style={{
                                      animationDelay: isCurrentWord ? '0ms' : `${index * 50}ms`
                                    }}
                                  >
                                    {word}
                                  </span>
                                );
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Avatar Status */}
                  <div className="text-center space-y-3">
                    <h2 className="text-4xl font-bold text-white">AI Presentation Coach</h2>
                    <p className="text-xl text-gray-300">
                      {isPlaying ? 'Presenting your document content...' : 'Ready to demonstrate your selected sections'}
                    </p>
                    {isPlaying && (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                          <span>Word {currentWordIndex + 1} of {speechWords.length}</span>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{Math.round(speechProgress)}% complete</span>
                          <div className="w-16 h-1 bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-400 transition-all duration-100"
                              style={{ width: `${speechProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compact Script Preview (when not playing) */}
                  {!isPlaying && generatedScript && (
                    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm max-w-2xl mx-auto">
                      <CardContent className="p-4">
                        <h3 className="text-base font-semibold text-white mb-3">Generated Speech Script</h3>
                        <div className="bg-gray-900/50 rounded-lg p-3 h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent">
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {generatedScript}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Control Buttons */}
                  <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    {!isPlaying ? (
                      <Button 
                        onClick={playAIDemo} 
                        size="lg"
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-8 py-4 text-lg"
                      >
                        <Play className="h-6 w-6 mr-3" />
                        Start AI Demonstration
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopAIDemo} 
                        variant="destructive" 
                        size="lg"
                        className="px-8 py-4 text-lg"
                      >
                        <Pause className="h-6 w-6 mr-3" />
                        Stop Demonstration
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="px-8 py-4 text-lg"
                      onClick={() => {
                        if (speechSynthesis.speaking) {
                          speechSynthesis.cancel();
                          setIsPlaying(false);
                          setCurrentWordIndex(0);
                          setHighlightedWords(new Set());
                          setSpeechProgress(0);
                        }
                        setLocation('/practice');
                      }}
                    >
                      Practice Yourself
                    </Button>
                  </div>
                  </div>
                )}

                {/* Navigation buttons - only show when not generating */}
                {!isGeneratingScript && (
                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => setCurrentStep('config')}>
                      Back to Config
                    </Button>
                    <Button onClick={() => {
                      setCurrentStep('content');
                      setConfig(prev => ({ ...prev, selectedSlideNumbers: [] }));
                      setGeneratedScript('');
                    }}>
                      Start New Session
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}