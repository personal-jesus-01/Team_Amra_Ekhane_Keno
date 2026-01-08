import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import VideoWithTranscriptRecorder from '@/components/video-with-transcript-recorder';
import PerformanceAnalysisDisplay from '@/components/performance-analysis-display';

export default function SimplePracticePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [recordedData, setRecordedData] = useState<any>(null);
  const [performanceResult, setPerformanceResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRecordingComplete = async (data: { transcript: string; duration: number }) => {
    setRecordedData(data);
    
    toast({
      title: "Recording Complete",
      description: "Analyzing your speech transcript with AI...",
    });

    // Perform AI analysis
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/coach/calculate-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-test-token'
        },
        body: JSON.stringify({
          selectedSlides: [1, 2, 3],
          allSlides: [
            { title: 'Introduction', content: 'Welcome to our presentation about innovation and technology' },
            { title: 'Main Content', content: 'Key points include market analysis, competitive advantages, and strategic implementation' },
            { title: 'Conclusion', content: 'Summary of findings and next steps for moving forward' }
          ],
          userTranscript: data.transcript,
          documentContent: 'Presentation about innovation and technology with market analysis',
          language: 'english'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPerformanceResult(result);
        
        toast({
          title: "Analysis Complete",
          description: "Your speech has been analyzed successfully",
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

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/practice')}
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Working Practice Recording</h1>
        </div>

        {!performanceResult ? (
          <>
            {/* Recording Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Practice Recording & Transcription</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoWithTranscriptRecorder 
                  onRecordingComplete={handleRecordingComplete}
                />
              </CardContent>
            </Card>

            {/* Recording Status */}
            {recordedData && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recording Complete</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Your Transcript</h4>
                      <p className="text-gray-300 text-sm">
                        {recordedData.transcript || 'No speech detected'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Duration: {recordedData.duration?.toFixed(1)}s</span>
                      <span className="text-gray-300">Video Size: {(recordedData.videoBlob?.size / 1024)?.toFixed(1)} KB</span>
                    </div>

                    {isAnalyzing && (
                      <div className="text-center py-4">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-300">Analyzing your performance...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Performance Results */
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Performance Analysis Results</h2>
            
            <PerformanceAnalysisDisplay 
              result={performanceResult}
              transcript={recordedData?.transcript || ''}
              selectedSlides={[]}
            />

            <div className="flex space-x-4">
              <Button 
                onClick={() => {
                  setRecordedData(null);
                  setPerformanceResult(null);
                }}
                variant="outline"
                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              >
                Record Again
              </Button>
              <Button onClick={() => setLocation('/practice')}>
                Back to Practice Setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}