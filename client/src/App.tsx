import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/admin/Dashboard";
import Users from "@/pages/admin/Users";
import UserDetails from "@/pages/admin/UserDetails";
import Subscriptions from "@/pages/admin/Subscriptions";
import Slides from "@/pages/admin/Slides";
import AIUsage from "@/pages/admin/AIUsage";
import Assessments from "@/pages/admin/Assessments";
import Payments from "@/pages/admin/Payments";
import Settings from "@/pages/admin/Settings";
import Support from "@/pages/admin/Support";
import Logs from "@/pages/admin/Logs";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/admin/dashboard" />
      </Route>
      <Route path="/admin/dashboard" component={Dashboard} />
      <Route path="/admin/users" component={Users} />
      <Route path="/admin/users/:id" component={UserDetails} />
      <Route path="/admin/subscriptions" component={Subscriptions} />
      <Route path="/admin/slides" component={Slides} />
      <Route path="/admin/ai-usage" component={AIUsage} />
      <Route path="/admin/assessments" component={Assessments} />
      <Route path="/admin/payments" component={Payments} />
      <Route path="/admin/settings" component={Settings} />
      <Route path="/admin/support" component={Support} />
      <Route path="/admin/logs" component={Logs} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;