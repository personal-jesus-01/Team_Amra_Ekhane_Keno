import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import WebcamRecorder from '@/components/webcam-recorder';

export default function TestTranscriptionPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleRecordingStop = (recordedBlob: Blob | null) => {
    setIsRecording(false);
    if (recordedBlob) {
      // Convert blob to file
      const file = new File([recordedBlob], 'recorded-video.webm', {
        type: recordedBlob.type
      });
      setVideoFile(file);
      toast({
        title: 'Recording complete',
        description: `Video size: ${(file.size / 1024).toFixed(2)} KB`
      });
    }
  };

  const submitForTranscription = async () => {
    if (!videoFile) {
      toast({
        title: 'No video selected',
        description: 'Please select or record a video first',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('videoFile', videoFile);

    try {
      // Use our test endpoint
      const response = await fetch('/api/coach/test-transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer dev-test-token'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription failed: ${errorText}`);
      }

      const result = await response.json();
      setTranscript(result.transcript || 'No transcription returned');
      
      toast({
        title: 'Transcription successful',
        description: `Processed ${(result.size / 1024).toFixed(2)} KB of video data`
      });
    } catch (error) {
      console.error('Error during transcription:', error);
      toast({
        title: 'Transcription failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Whisper Transcription Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Record or Upload Video</CardTitle>
            <CardDescription>
              Record a video or upload an existing one to test the Whisper transcription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label htmlFor="video-file">Upload Video</Label>
                <Input 
                  ref={fileInputRef}
                  id="video-file" 
                  type="file" 
                  accept="video/*" 
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>
              
              <div className="mt-4">
                <Label>Or Record Video</Label>
                <div className="mt-1">
                  <WebcamRecorder
                    isRecording={isRecording}
                    onStart={() => setIsRecording(true)}
                    onStop={handleRecordingStop}
                    className="mt-2"
                  />
                </div>
              </div>
              
              {videoFile && (
                <div className="mt-4">
                  <Label>Selected Video</Label>
                  <div className="mt-1 text-sm">
                    {videoFile.name} ({(videoFile.size / 1024).toFixed(2)} KB)
                  </div>
                  
                  {videoFile.type.includes('video') && (
                    <video 
                      className="mt-2 w-full rounded-md" 
                      controls
                      src={URL.createObjectURL(videoFile)}
                    />
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={submitForTranscription}
              disabled={!videoFile || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transcribing...
                </>
              ) : 'Transcribe Video'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Transcription Result</CardTitle>
            <CardDescription>
              The transcribed text from your video will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Transcription will appear here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px]"
              readOnly={!transcript}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setTranscript('')}
              disabled={!transcript}
            >
              Clear
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                if (transcript) {
                  navigator.clipboard.writeText(transcript);
                  toast({
                    title: 'Copied to clipboard',
                    description: 'Transcription text has been copied to clipboard'
                  });
                }
              }}
              disabled={!transcript}
            >
              Copy to Clipboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}