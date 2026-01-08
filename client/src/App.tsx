import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import PresentationsPage from "@/pages/presentations-page";
import EditorPage from "@/pages/editor-page";
import CoachPage from "@/pages/coach-page";
import AICoachPage from "@/pages/ai-coach-page";
import PracticePage from "@/pages/practice-page";
import SimplePracticePage from "@/pages/simple-practice-page";
import AICoachSelfPractice from "@/pages/ai-coach-self-practice";
import SubscriptionPage from "@/pages/subscription-page";
import ApiTestPage from "@/pages/api-test-page";
import OcrTestPage from "@/pages/ocr-test-page";
import CanvaPage from "@/pages/canva-page";
import GoogleSlidesPage from "@/pages/google-slides-page";
import TestTranscriptionPage from "@/pages/test-transcription-page";
import SharedPage from "@/pages/shared-page";
import SettingsPage from "@/pages/settings-page";
import AnalyticsDashboard from "@/pages/analytics-page";
import CollaborationPage from "@/pages/collaboration-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/presentations" component={PresentationsPage} />
      <ProtectedRoute path="/presentations/:id" component={EditorPage} />
      <ProtectedRoute path="/editor/:id" component={EditorPage} />
      <ProtectedRoute path="/editor" component={EditorPage} />
      <ProtectedRoute path="/shared" component={SharedPage} />
      <ProtectedRoute path="/google-slides" component={GoogleSlidesPage} />
      <ProtectedRoute path="/coach" component={CoachPage} />
      <ProtectedRoute path="/ai-coach" component={AICoachPage} />
      <ProtectedRoute path="/practice" component={PracticePage} />
      <ProtectedRoute path="/simple-practice" component={SimplePracticePage} />
      <ProtectedRoute path="/ai-coach-self-practice" component={AICoachSelfPractice} />
      <ProtectedRoute path="/canva" component={CanvaPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboard} />
      <ProtectedRoute path="/collaboration" component={CollaborationPage} />
      <ProtectedRoute path="/api-test" component={ApiTestPage} />
      <ProtectedRoute path="/ocr-test" component={OcrTestPage} />
      <ProtectedRoute path="/test-transcription" component={TestTranscriptionPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
