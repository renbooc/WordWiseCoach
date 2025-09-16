import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { queryClient } from "./lib/queryClient";
import { ProtectedRoute } from "@/components/protected-route";
import Header from "@/components/layout/header";
import Dashboard from "@/pages/dashboard";
import Study from "@/pages/study";
import Practice from "@/pages/practice";
import Plan from "@/pages/plan";
import WordBank from "@/pages/wordbank";
import { LoginPage } from "@/pages/login";
import { SignupPage } from "@/pages/signup";
import SessionSummary from "@/pages/session-summary";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Switch>
                <Route path="/login" component={LoginPage} />
                <Route path="/signup" component={SignupPage} />

                <Route path="/dashboard">
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </Route>
                <Route path="/study">
                  <ProtectedRoute>
                    <Study />
                  </ProtectedRoute>
                </Route>
                <Route path="/practice">
                  <ProtectedRoute>
                    <Practice />
                  </ProtectedRoute>
                </Route>
                <Route path="/plan">
                  <ProtectedRoute>
                    <Plan />
                  </ProtectedRoute>
                </Route>
                <Route path="/wordbank">
                  <ProtectedRoute>
                    <WordBank />
                  </ProtectedRoute>
                </Route>
                <Route path="/session-summary">
                  <ProtectedRoute>
                    <SessionSummary />
                  </ProtectedRoute>
                </Route>

                <Route path="/">
                  <Redirect to="/dashboard" />
                </Route>

                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
