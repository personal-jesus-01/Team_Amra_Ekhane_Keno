import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ChevronRight, Search, CheckCircle2, Circle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import VideoWithTranscriptRecorder from '@/components/video-with-transcript-recorder';

interface Presentation {
  id: number;
  title: string;
  slides_count: number;
}

interface Slide {
  id: number;
  presentation_id: number;
  slide_number: number;
  content: string;
  background_color: string;
  created_at: string;
  updated_at: string;
}

type Step = 'choose-presentation' | 'choose-slides' | 'recording' | 'analysis';

export default function AICoachSelfPractice() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<Step>('choose-presentation');
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [selectedSlides, setSelectedSlides] = useState<Slide[]>([]);
  const [recordingData, setRecordingData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch presentations
  const { data: presentations = [] } = useQuery<Presentation[]>({
    queryKey: ["/api/presentations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Fetch slides for selected presentation
  const { data: allSlides = [], isLoading: isLoadingSlides, error: slidesError } = useQuery<Slide[]>({
    queryKey: [`/api/presentations/${selectedPresentation?.id}/slides`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!selectedPresentation?.id,
  });



  const handlePresentationSelect = (presentation: Presentation) => {
    setSelectedPresentation(presentation);
    setSelectedSlides([]); // Clear any previously selected slides
    setCurrentStep('choose-slides');
  };

  const handleSlideToggle = (slide: Slide) => {
    setSelectedSlides(prev => {
      const isSelected = prev.some(s => s.id === slide.id);
      if (isSelected) {
        return prev.filter(s => s.id !== slide.id);
      } else {
        return [...prev, slide];
      }
    });
  };

  const handleStartRecording = () => {
    if (selectedSlides.length === 0) {
      toast({
        title: "No slides selected",
        description: "Please select at least one slide to practice with",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep('recording');
  };

  const handleRecordingComplete = async (data: { transcript: string; duration: number }) => {
    setRecordingData(data);
    setIsAnalyzing(true);
    setCurrentStep('analysis');

    toast({
      title: "Recording Complete",
      description: "Analyzing your speech with AI...",
    });

    try {
      const response = await fetch('/api/coach/calculate-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-test-token'
        },
        body: JSON.stringify({
          selectedSlides: selectedSlides.map(s => s.slide_number),
          allSlides: selectedSlides,
          userTranscript: data.transcript,
          documentContent: selectedSlides.map(s => `Slide ${s.slide_number}: ${s.content}`).join('\n\n'),
          language: 'english'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
        
        toast({
          title: "Analysis Complete",
          description: "Your presentation performance has been analyzed",
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Could not analyze performance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep('choose-presentation');
    setSelectedPresentation(null);
    setSelectedSlides([]);
    setRecordingData(null);
    setAnalysisResult(null);
    setSearchQuery('');
  };

  // Filter presentations based on search query
  const filteredPresentations = presentations.filter(presentation =>
    presentation.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/coach')}
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AI Coach
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Self Practice</h1>
            <p className="text-gray-400">Choose presentation → Select slides → Record → Get AI analysis</p>
          </div>
        </div>

        {/* Step 1: Choose Presentation */}
        {currentStep === 'choose-presentation' && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Step 1: Choose Your Presentation</CardTitle>
              <p className="text-gray-400">Search and select a presentation to practice with</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search presentations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                />
              </div>

              {/* Presentation List */}
              {filteredPresentations.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {filteredPresentations.map((presentation) => (
                    <div
                      key={presentation.id}
                      onClick={() => handlePresentationSelect(presentation)}
                      className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 cursor-pointer transition-all duration-200 border border-gray-600 hover:border-purple-500 hover:shadow-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-white font-medium text-lg">{presentation.title}</h3>
                          <p className="text-gray-400 text-sm mt-1">{presentation.slides_count} slides available</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No presentations found matching "{searchQuery}"</p>
                  <Button 
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="mt-4 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    Clear Search
                  </Button>
                </div>
              ) : presentations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No presentations found</p>
                  <Button 
                    onClick={() => setLocation('/presentations')}
                    className="mt-4 bg-purple-600 hover:bg-purple-700"
                  >
                    Create Presentation
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">Type to search presentations</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Slides */}
        {currentStep === 'choose-slides' && selectedPresentation && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Step 2: Select Slides from "{selectedPresentation.title}"
              </CardTitle>
              <p className="text-gray-400">Choose which slides you want to practice with</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSlides ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading slides...</p>
                </div>
              ) : slidesError ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Error loading slides. Please try again.</p>
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep('choose-presentation')}
                    className="mt-4 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    Back to Presentations
                  </Button>
                </div>
              ) : allSlides.length > 0 ? (
                <div className="space-y-3">
                  {/* Select All/None */}
                  <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSlides(allSlides)}
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSlides([])}
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      >
                        Clear All
                      </Button>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {selectedSlides.length} of {allSlides.length} slides selected
                    </span>
                  </div>

                  {/* Slide List */}
                  <div className="max-h-96 overflow-y-auto space-y-2 slide-selector">
                    {allSlides.map((slide) => {
                      const isSelected = selectedSlides.some(s => s.id === slide.id);
                      return (
                        <div
                          key={slide.id}
                          onClick={() => handleSlideToggle(slide)}
                          className={`rounded-lg p-4 cursor-pointer transition-all duration-200 border ${
                            isSelected
                              ? 'bg-purple-900/30 border-purple-500 shadow-lg'
                              : 'bg-gray-700 border-gray-600 hover:border-gray-500 hover:bg-gray-650'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Selection Icon */}
                            <div className="flex-shrink-0 mt-1">
                              {isSelected ? (
                                <CheckCircle2 className="h-5 w-5 text-purple-400" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            
                            {/* Slide Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-white font-medium truncate">Slide #{slide.slide_number}</h4>
                              </div>
                              <p className="text-gray-400 text-sm mt-1 line-clamp-3">{slide.content}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No slides found for this presentation</p>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('choose-presentation')}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleStartRecording}
                  disabled={selectedSlides.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Start Recording
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Recording */}
        {currentStep === 'recording' && (
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Step 3: Practice Recording</CardTitle>
                <p className="text-gray-400">Speak about your selected slides. Your speech will be transcribed and analyzed.</p>
              </CardHeader>
              <CardContent>
                <VideoWithTranscriptRecorder 
                  onRecordingComplete={handleRecordingComplete}
                />
              </CardContent>
            </Card>

            {/* Show selected slides for reference */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Your Selected Slides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSlides.map((slide) => (
                    <div key={slide.id} className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Slide #{slide.slide_number}</h4>
                      <p className="text-gray-300 text-sm">{slide.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Analysis Results */}
        {currentStep === 'analysis' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Step 4: Analysis Results</h2>
                <p className="text-gray-400">AI analysis of your presentation practice</p>
              </div>
              <Button onClick={resetFlow} variant="outline">
                Practice Again
              </Button>
            </div>

            {isAnalyzing ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white">Analyzing your performance...</p>
                    <p className="text-gray-400 text-sm">Comparing your speech with slide content</p>
                  </div>
                </CardContent>
              </Card>
            ) : analysisResult ? (
              <div className="space-y-6">
                {/* Performance Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {Math.round(analysisResult.slideRelevancyScore || 0)}%
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Relevancy</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {Math.round(analysisResult.speechQualityScore || 0)}%
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Fluency</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {Math.round(analysisResult.slideRelevancyScore || 0)}%
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Content Coverage</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {Math.round(analysisResult.clarityScore || 0)}%
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Speech Confidence</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Improvement Pointers */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">What You Can Improve</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysisResult.recommendations && analysisResult.recommendations.length > 0 ? (
                      analysisResult.recommendations.slice(0, 4).map((recommendation: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg border-l-4 border-purple-500">
                          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">{recommendation}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400">Great job! Keep practicing to maintain your performance level.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transcript Review */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Your Speech Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-700/50 rounded-lg p-4 max-h-32 overflow-y-auto analysis-results">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {recordingData?.transcript || 'No transcript available'}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                      <span>Duration: {recordingData?.duration?.toFixed(1) || 0}s</span>
                      <span>Words: {recordingData?.transcript?.split(' ').length || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="text-center py-12">
                  <p className="text-gray-400">Analysis failed. Please try again.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}