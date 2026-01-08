import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import { Slide, PresentationWithMeta, CoachSession, PresentationAnalysis, PracticeConfig, SpeechComparisonResult } from "@/lib/types";
import { ArrowLeft, Bot, Mic, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";

// Import components for the different practice steps
import PracticeSetup from "@/components/practice-setup";
import PracticeSession from "@/components/practice-session";
import PracticeResults from "@/components/practice-results";
import SlideSelection from "@/components/slide-selection";
import SuggestedSpeech from "@/components/suggested-speech";
import SelfPracticeRecorder from "@/components/self-practice-recorder";
import SpeechComparison from "@/components/speech-comparison";
import PerformanceAnalysisDisplay from "@/components/performance-analysis-display";
import coachService from "@/services/coach.service";

export default function CoachPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Add missing state variables that were removed but still referenced
  const [selectedPresentationId, setSelectedPresentationId] = useState<number | null>(null);
  const [practiceStep, setPracticeStep] = useState<'setup' | 'select-slide' | 'suggested-speech' | 'recording' | 'comparison' | 'results' | null>(null);
  const [practiceConfig, setPracticeConfig] = useState<PracticeConfig | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
  const [suggestedSpeech, setSuggestedSpeech] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<SpeechComparisonResult | null>(null);
  const [isComparingSpeeches, setIsComparingSpeeches] = useState(false);
  const [recordingData, setRecordingData] = useState<{
    videoBlob: Blob | null;
    screenshot: string | null;
    transcript: string;
    duration: number;
  } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PresentationAnalysis | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [viewingAllSessions, setViewingAllSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  

  
  // Fetch presentations with special handling for auth issues
  const { 
    data: presentations = [], 
    isLoading: presentationsLoading,
    error: presentationsError
  } = useQuery<PresentationWithMeta[]>({
    queryKey: ["/api/presentations"],
    queryFn: getQueryFn({ on401: "mockData" }),
    retry: false,
  });

  // Fetch coaching sessions with special handling for auth issues
  const {
    data: coachSessions = [],
    isLoading: sessionsLoading,
    error: sessionsError
  } = useQuery<CoachSession[]>({
    queryKey: ["/api/coach/sessions"],
    queryFn: getQueryFn({ on401: "mockData" }),
    retry: false,
  });
  
  // Log errors but don't surface to user in production - use mock data instead
  // Using a useEffect to prevent infinite loops from toast notifications
  useEffect(() => {
    if (presentationsError || sessionsError) {
      console.warn('Error fetching coach data:', { presentationsError, sessionsError });
      
      // In development, show toast error
      if (import.meta.env.DEV) {
        toast({
          title: "Error fetching data",
          description: "Could not load presentations or practice sessions. Using demo mode.",
          variant: "destructive",
        });
      }
    }
  }, [presentationsError, sessionsError, toast]);

  // Fetch slides for a selected presentation
  const { 
    data: slides = [],
    isLoading: slidesLoading,
    error: slidesError
  } = useQuery<Slide[]>({
    queryKey: ["/api/slides", selectedPresentationId],
    queryFn: getQueryFn({ on401: "mockData" }),
    enabled: !!selectedPresentationId && (practiceStep === 'setup' || practiceStep === 'select-slide'),
  });
  
  // Skip type checking for mock data with any assertion
  // We know our data structure is compatible with what the components need
  const mockSlides: any[] = [
    {
      id: 10001,
      presentation_id: selectedPresentationId,
      title: "Introduction",
      content: "Welcome to the presentation",
      slide_number: 1,
      notes: "Greeting and overview",
      background_color: "#ffffff",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 10002,
      presentation_id: selectedPresentationId,
      title: "Key Points",
      content: "Main discussion points",
      slide_number: 2,
      notes: "Discuss key findings",
      background_color: "#ffffff",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 10003,
      presentation_id: selectedPresentationId,
      title: "Summary",
      content: "Recap and conclusion",
      slide_number: 3, 
      notes: "Summarize and thank audience",
      background_color: "#ffffff",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  const effectiveSlides: Slide[] = slides.length > 0 || !selectedPresentationId ? slides : mockSlides;

  // Get the selected presentation
  const selectedPresentation = selectedPresentationId 
    ? presentations.find(p => p.id === selectedPresentationId) || null
    : null;

  // Handler for practice setup completion
  const handlePracticeSetupComplete = (config: PracticeConfig) => {
    // Save practice config and move to slide selection step
    setSelectedPresentationId(config.presentationId);
    setPracticeConfig(config);
    setPracticeStep('select-slide');
  };
  
  // Handler for slide selection
  const handleSlideSelection = (slide: Slide, suggestedSpeech: string) => {
    setSelectedSlide(slide);
    setSuggestedSpeech(suggestedSpeech);
    setPracticeStep('suggested-speech');
  };
  
  // Handler for starting recording
  const handleStartRecording = () => {
    // Nothing specific to do here, just update UI
  };
  
  // Handler for transcript recording completion
  const handleTranscriptRecordingComplete = (data: {
    transcript: string;
    duration: number;
  }) => {
    // Save recording data with transcript focus
    setRecordingData({
      videoBlob: null,
      screenshot: null,
      transcript: data.transcript,
      duration: data.duration
    });
    
    // Start OpenAI analysis comparing transcript with selected slides
    performOpenAIAnalysis(data);
  };

  // OpenAI analysis function
  const performOpenAIAnalysis = async (data: {
    transcript: string;
    duration: number;
  }) => {
    if (!selectedSlide || !practiceConfig) {
      toast({
        title: "Analysis Error",
        description: "Missing slide or practice configuration",
        variant: "destructive",
      });
      return;
    }

    setIsComparingSpeeches(true);
    
    toast({
      title: "Analyzing Performance",
      description: "Comparing your speech with slide content using OpenAI...",
    });

    try {
      const response = await fetch('/api/coach/calculate-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-test-token'
        },
        body: JSON.stringify({
          selectedSlides: [selectedSlide.slide_number],
          allSlides: [selectedSlide],
          userTranscript: data.transcript,
          documentContent: selectedSlide.content + (selectedSlide.notes ? '\n\nNotes: ' + selectedSlide.notes : ''),
          language: 'english'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
        setPracticeStep('results');
        
        toast({
          title: "Analysis Complete",
          description: "Your presentation performance has been analyzed",
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      toast({
        title: "Analysis Error", 
        description: "Could not analyze performance. Please try again.",
        variant: "destructive",
      });
      setPracticeStep('recording');
    } finally {
      setIsComparingSpeeches(false);
    }
  };
  
  // Function to compare speech with suggested speech
  const compareSpeech = async (data: {
    videoBlob: Blob | null;
    transcript: string;
    duration: number;
    screenshot: string | null;
  }) => {
    if (!selectedSlide) return;
    
    try {
      setIsComparingSpeeches(true);
      
      // Show processing toast
      toast({
        title: "Analyzing your speech",
        description: "Comparing your delivery with the suggested speech...",
      });
      
      // Call the API to compare speeches
      const videoBlob = data.videoBlob ? data.videoBlob : undefined;
      const result = await coachService.compareSpeech(
        suggestedSpeech,
        selectedSlide.title || `Slide ${selectedSlide.slide_number}`,
        data.transcript,
        videoBlob
      );
      
      // Save the result
      setComparisonResult(result);
      
      // Move to comparison step
      setPracticeStep('comparison');
    } catch (error) {
      console.error("Error comparing speeches:", error);
      toast({
        title: "Analysis error",
        description: "There was an error analyzing your speech. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsComparingSpeeches(false);
    }
  };

  // Handler for recording completion
  const handleRecordingComplete = (result: {
    videoBlob: Blob | null;
    screenshot: string | null;
    transcript: string;
    duration: number;
    presentationId: number;
  }) => {
    setRecordingData(result);
    
    // Analyze the practice
    analyzePractice(result);
  };

  // Handler for analysis completion
  const handleAnalysisComplete = (analysis: PresentationAnalysis, isDemoData = false) => {
    setAnalysisResult(analysis);
    setIsDemoMode(isDemoData);
    setPracticeStep('results');
  };

  // Analyze a practice session using OpenAI
  const analyzePractice = async (data: {
    videoBlob: Blob | null;
    transcript: string;
    duration: number;
    presentationId: number;
  }) => {
    try {
      // Show processing message
      toast({
        title: "Analyzing presentation",
        description: "Processing your practice session with AI...",
      });
      
      // Use the real API for analysis
      const result = await coachService.analyzePractice(
        data.presentationId,
        data.transcript,
        data.videoBlob,
        data.duration
      );
      
      // If we get here, we have real analysis data
      handleAnalysisComplete(result, false); // Always use real data
    } catch (error) {
      console.error("Error analyzing practice:", error);
      
      // Show error message
      toast({
        title: "Analysis error",
        description: "There was an error analyzing your practice. Please try again.",
        variant: "destructive",
      });
      
      // Return to setup since we don't want to use demo mode anymore
      setPracticeStep('setup');
    }
  };

  // Handler for starting a new practice
  const handleStartNewPractice = () => {
    // Reset state for a new practice
    setPracticeStep('setup');
    setRecordingData(null);
    setAnalysisResult(null);
  };

  // Back button handler
  const handleBack = () => {
    if (practiceStep === 'select-slide') {
      setPracticeStep('setup');
    } else if (practiceStep === 'suggested-speech') {
      setPracticeStep('select-slide');
    } else if (practiceStep === 'comparison') {
      setPracticeStep('suggested-speech');
    } else if (practiceStep === 'results') {
      setPracticeStep('select-slide');
    } else {
      setPracticeStep(null);
    }
  };

  // Return to home view
  const handleReturnHome = () => {
    setPracticeStep(null);
    setSelectedPresentationId(null);
    setPracticeConfig(null);
    setRecordingData(null);
    setAnalysisResult(null);
    setViewingAllSessions(false);
  };
  
  // Toggle viewing all sessions
  const toggleViewAllSessions = () => {
    setViewingAllSessions(!viewingAllSessions);
  };
  
  // Handle viewing a session
  const handleViewSession = (sessionId: number) => {
    setSelectedSessionId(sessionId);
  };
  
  // Close selected session view
  const handleCloseSessionView = () => {
    setSelectedSessionId(null);
  };

  // Render practice setup step
  const renderPracticeSetup = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Button 
            onClick={handleReturnHome} 
            variant="ghost" 
            size="sm" 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-xl font-semibold text-white">Practice Setup</h2>
        </div>
        
        <PracticeSetup
          presentations={presentations}
          slides={effectiveSlides}
          isLoading={presentationsLoading || slidesLoading}
          onComplete={handlePracticeSetupComplete}
        />
      </div>
    );
  };

  // Render slide selection step
  const renderSlideSelection = () => {
    if (!selectedPresentation) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Button 
            onClick={handleBack} 
            variant="ghost" 
            size="sm" 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Setup
          </Button>
          <h2 className="text-xl font-semibold text-white">Select a Slide</h2>
        </div>
        
        <SlideSelection
          presentation={selectedPresentation}
          slides={effectiveSlides}
          isLoading={slidesLoading}
          onSelectSlide={handleSlideSelection}
          onBack={handleBack}
        />
      </div>
    );
  };
  
  // Render suggested speech step (now replaced with direct recording)
  const renderSuggestedSpeech = () => {
    if (!selectedSlide || !suggestedSpeech) return null;
    
    return (
      <div className="space-y-4">
        <SelfPracticeRecorder
          slide={selectedSlide}
          suggestedSpeech={suggestedSpeech}
          onRecordingComplete={handleTranscriptRecordingComplete}
          onBack={handleBack}
        />
      </div>
    );
  };
  
  // Render speech comparison step
  const renderSpeechComparison = () => {
    if (!selectedSlide || !suggestedSpeech || !recordingData || !comparisonResult) return null;
    
    return (
      <div className="space-y-4">
        <SpeechComparison
          slide={selectedSlide}
          suggestedSpeech={suggestedSpeech}
          recordingData={recordingData}
          comparisonResult={comparisonResult}
          isLoading={isComparingSpeeches}
          onBack={handleBack}
          onTryAgain={() => setPracticeStep('suggested-speech')}
          onFinish={handleStartNewPractice}
        />
      </div>
    );
  };

  // Render practice results step with OpenAI analysis
  const renderPracticeResults = () => {
    if (!analysisResult || !recordingData || !selectedSlide) return null;
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
            <p className="text-gray-400">OpenAI analysis of your practice session</p>
          </div>
          <Button onClick={handleStartNewPractice} variant="outline">
            Practice Again
          </Button>
        </div>

        {/* AI Analysis Results */}
        <PerformanceAnalysisDisplay 
          result={analysisResult}
          transcript={recordingData.transcript}
          selectedSlides={[selectedSlide]}
        />
        
        {/* Legacy Practice Results for additional metrics */}
        <PracticeResults
          videoBlob={null}
          videoUrl={null}
          screenshot={null}
          transcript={recordingData.transcript}
          metrics={{
            content_coverage: analysisResult.slideRelevancyScore || 0,
            pace_score: analysisResult.speechQualityScore || 0,
            clarity_score: analysisResult.speechQualityScore || 0,
            eye_contact_score: analysisResult.overallScore || 0,
            overall_score: analysisResult.overallScore || 0
          }}
        feedback={analysisResult.feedback}
        strengths={analysisResult.strengths || []}
        improvement_tips={analysisResult.improvement_tips}
        practice_exercises={analysisResult.practice_exercises || []}
        // Add the new outline-specific feedback if available
        slide_by_slide_feedback={analysisResult.slide_by_slide_feedback || []}
        structure_analysis={analysisResult.structure_analysis}
        coach_script={analysisResult.coach_script}
        delivery_recommendations={analysisResult.delivery_recommendations}
        presentationTitle={selectedPresentation?.title || 'Practice Session'}
        duration={recordingData.duration}
        date={new Date()}
        isDemoMode={isDemoMode}
        onBack={handleBack}
        onTryAgain={handleStartNewPractice}
        />
      </div>
    );
  };

  // Render session details
  const renderSessionDetails = () => {
    if (!selectedSessionId) return null;
    
    const session = coachSessions.find(s => s.id === selectedSessionId);
    if (!session) return null;
    
    const presentation = presentations.find(p => p.id === session.presentation_id);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            onClick={handleCloseSessionView} 
            variant="ghost" 
            size="sm" 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
          <h2 className="text-xl font-semibold">
            Session Details: {presentation?.title || "Untitled Presentation"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-gray-500">Content Coverage</h4>
                  <div className="text-2xl font-semibold">{session.content_coverage}%</div>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500">Clarity</h4>
                  <div className="text-2xl font-semibold">{session.clarity_score}%</div>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500">Pace</h4>
                  <div className="text-2xl font-semibold">{session.pace_score}%</div>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500">Eye Contact</h4>
                  <div className="text-2xl font-semibold">{session.eye_contact_score}%</div>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm text-gray-500">Overall Score</h4>
                  <div className="text-3xl font-semibold text-primary">
                    {Math.round((session.content_coverage || 0) * 0.3 + 
                             (session.pace_score || 0) * 0.25 + 
                             (session.clarity_score || 0) * 0.25 + 
                             (session.eye_contact_score || 0) * 0.2)}%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Session Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Date</span>
                  <div>{session.created_at ? new Date(session.created_at).toLocaleString() : 'N/A'}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Duration</span>
                  <div>
                    {/* Display session duration if available */}
                    {(session as any).seconds_duration ? 
                      `${Math.round((session as any).seconds_duration / 60)} minutes` : 
                      'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Feedback</h3>
              <p className="whitespace-pre-wrap">{session.feedback}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Strengths</h3>
              <ul className="list-disc pl-5 space-y-1">
                {session.strengths && session.strengths.length > 0 ? (
                  session.strengths.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))
                ) : (
                  <li>No strengths recorded</li>
                )}
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Improvement Tips</h3>
              <ul className="list-disc pl-5 space-y-1">
                {/* Check if we have improvement tips as an array in this session */}
                {Array.isArray((session as any).improvement_tips) && (session as any).improvement_tips.length > 0 ? (
                  // Type assert any to handle potential structure differences
                  (((session as any).improvement_tips as any[]).map((tip: any, idx: number) => (
                    <li key={idx}>
                      <strong>{tip.area || 'Improvement'}:</strong> {tip.tip || tip}
                    </li>
                  )))
                ) : (
                  <li>No improvement tips recorded</li>
                )}
              </ul>
            </div>
          </div>
        </div>
        <div className="text-center mt-6">
          <Button onClick={() => setPracticeStep('setup')} className="ml-2">
            Start New Practice
          </Button>
        </div>
      </div>
    );
  };

  // Render dashboard
  const renderDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Presentation Coach</h1>
          <Button onClick={() => setPracticeStep('setup')}>
            Start Practicing
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              {viewingAllSessions ? "All Practice Sessions" : "Recent Practice Sessions"}
            </h2>
            {sessionsLoading ? (
              <p className="text-gray-300">Loading sessions...</p>
            ) : coachSessions.length > 0 ? (
              <div className="space-y-4">
                {(viewingAllSessions ? coachSessions : coachSessions.slice(0, 3)).map((session) => (
                  <div 
                    key={session.id} 
                    className="bg-gray-800/50 border-gray-700 rounded-lg p-4 cursor-pointer hover:border-indigo-500 transition-colors backdrop-blur-sm"
                    onClick={() => handleViewSession(session.id)}
                  >
                    <div className="flex justify-between">
                      <h3 className="font-medium text-white">
                        {presentations.find(p => p.id === session.presentation_id)?.title || 
                          "Untitled Presentation"}
                      </h3>
                      <span className="text-sm text-gray-300">
                        {session.created_at ? new Date(session.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <span className="text-sm text-gray-400">Content Coverage</span>
                        <div className="font-medium text-white">{session.content_coverage}%</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Clarity</span>
                        <div className="font-medium text-white">{session.clarity_score}%</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Pace</span>
                        <div className="font-medium text-white">{session.pace_score}%</div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={toggleViewAllSessions}
                >
                  {viewingAllSessions ? "Show Recent Sessions" : "View All Sessions"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-800/50 border border-gray-700 rounded-lg backdrop-blur-sm">
                <p className="text-gray-300">No practice sessions yet</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                  <Button onClick={() => setPracticeStep('setup')} variant="outline">
                    <Mic className="h-4 w-4 mr-2" />
                    Classic Practice
                  </Button>
                  <Button onClick={() => setLocation('/ai-coach')}>
                    <Bot className="h-4 w-4 mr-2" />
                    AI Speech Coach
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Available Presentations</h2>
            {presentationsLoading ? (
              <p className="text-gray-300">Loading presentations...</p>
            ) : presentations.length > 0 ? (
              <div className="space-y-4">
                {presentations.slice(0, 5).map((presentation) => (
                  <div 
                    key={presentation.id} 
                    className="bg-gray-800/50 border-gray-700 rounded-lg p-4 cursor-pointer hover:border-indigo-500 transition-colors backdrop-blur-sm"
                    onClick={() => {
                      setSelectedPresentationId(presentation.id);
                      setPracticeStep('setup');
                    }}
                  >
                    <h3 className="font-medium text-white">{presentation.title}</h3>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-gray-300">
                        {presentation.slides_count || 0} slides
                      </span>
                      <span className="text-sm text-gray-300">
                        Last edited {presentation.lastEditedAgo || 'recently'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-800/50 border border-gray-700 rounded-lg backdrop-blur-sm">
                <p className="text-gray-300">No presentations available</p>
                <p className="text-sm text-gray-400 mt-2">
                  Create a presentation first to start practicing
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {practiceStep === 'setup' && renderPracticeSetup()}
        {practiceStep === 'select-slide' && renderSlideSelection()}
        {practiceStep === 'suggested-speech' && renderSuggestedSpeech()}
        {practiceStep === 'comparison' && renderSpeechComparison()}
        {practiceStep === 'results' && renderPracticeResults()}
        {!practiceStep && selectedSessionId && renderSessionDetails()}
        {!practiceStep && !selectedSessionId && (
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Enhanced Header Section */}
            <div className="text-center space-y-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10"></div>
              <div className="relative">
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                  Presentation Coach
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mb-6"></div>
                <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                  Master your presentation skills with AI-powered coaching and detailed performance analysis
                </p>
              </div>
            </div>

            {/* Enhanced Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
              {/* AI Speech Coach Card */}
              <Card 
                className="relative bg-gradient-to-br from-gray-800/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 hover:border-indigo-400/50 transition-all duration-500 cursor-pointer group overflow-hidden"
                onClick={() => setLocation('/ai-coach')}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
                
                <CardContent className="relative p-10 text-center">
                  {/* Icon with Enhanced Animation */}
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:from-indigo-400 group-hover:to-purple-500 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl group-hover:shadow-indigo-500/25">
                    <Bot className="h-12 w-12 text-white transform group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-indigo-100 transition-colors duration-300">
                    AI Speech Coach
                  </h3>
                  <p className="text-gray-400 mb-8 text-lg leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    Watch our AI avatar demonstrate your presentation with perfect delivery, timing, and multi-language support
                  </p>
                  
                  {/* Enhanced Features List */}
                  <div className="space-y-3 mb-6 text-left">
                    <div className="flex items-center justify-center space-x-3 text-gray-300 group-hover:text-white transition-colors duration-300">
                      <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
                      <CheckCircle className="h-5 w-5 text-indigo-400" />
                      <span className="font-medium">AI Avatar Demo</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3 text-gray-300 group-hover:text-white transition-colors duration-300">
                      <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
                      <CheckCircle className="h-5 w-5 text-indigo-400" />
                      <span className="font-medium">Bengali, Banglish & English</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3 text-gray-300 group-hover:text-white transition-colors duration-300">
                      <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
                      <CheckCircle className="h-5 w-5 text-indigo-400" />
                      <span className="font-medium">Real-time Speech Generation</span>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="pt-4 border-t border-gray-700/50 group-hover:border-indigo-500/30 transition-colors duration-300">
                    <span className="text-indigo-400 font-semibold group-hover:text-indigo-300 transition-colors duration-300">
                      Watch AI Demonstrate →
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Self Practice Card */}
              <Card 
                className="relative bg-gradient-to-br from-gray-800/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 hover:border-emerald-400/50 transition-all duration-500 cursor-pointer group overflow-hidden"
                onClick={() => setLocation('/ai-coach-self-practice')}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
                
                <CardContent className="relative p-10 text-center">
                  {/* Icon with Enhanced Animation */}
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:from-emerald-400 group-hover:to-green-500 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl group-hover:shadow-emerald-500/25">
                    <User className="h-12 w-12 text-white transform group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-emerald-100 transition-colors duration-300">
                    Self Practice
                  </h3>
                  <p className="text-gray-400 mb-8 text-lg leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    Record yourself practicing and receive detailed AI-powered performance analysis with slide relevancy scoring
                  </p>
                  
                  {/* Enhanced Features List */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-center space-x-3 text-gray-300 group-hover:text-white transition-colors duration-300">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full"></div>
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                      <span className="font-medium">Video Recording & Analysis</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3 text-gray-300 group-hover:text-white transition-colors duration-300">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full"></div>
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                      <span className="font-medium">Slide Relevancy Scoring</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3 text-gray-300 group-hover:text-white transition-colors duration-300">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full"></div>
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                      <span className="font-medium">Multi-language Support</span>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="pt-4 border-t border-gray-700/50 group-hover:border-emerald-500/30 transition-colors duration-300">
                    <span className="text-emerald-400 font-semibold group-hover:text-emerald-300 transition-colors duration-300">
                      Start Practicing →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Features Section */}
            <div className="text-center pt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Document Processing</h4>
                  <p className="text-gray-400 text-sm">Upload PDFs, PPTX, and DOCX files for AI-powered content extraction</p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Performance Metrics</h4>
                  <p className="text-gray-400 text-sm">Get detailed scores for content coverage, fluency, and engagement</p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Cultural Context</h4>
                  <p className="text-gray-400 text-sm">Specialized feedback for Bengali and Banglish speakers</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}