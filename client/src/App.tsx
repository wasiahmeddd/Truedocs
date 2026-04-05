import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { StorageModeProvider } from "@/lib/storage-mode";

import Home from "@/pages/Home";
import PeopleList from "@/pages/PeopleList";
import PersonDetail from "@/pages/PersonDetail";
import CardsList from "@/pages/CardsList";
import CardsByType from "@/pages/CardsByType";
import LoginPage from "@/pages/LoginPage";
import FileViewer from "@/pages/FileViewer";
import ErrorPage from "@/pages/ErrorPage";


import AdminDashboard from "@/pages/AdminDashboard";
import AuthPage from "@/pages/Auth.tsx";
import PasswordRecovery from "@/pages/PasswordRecovery";

function PrivateRoute({ component: Component, adminOnly, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">Loading vault...</div>;

  if (!user) return <Redirect to="/auth" />;

  if (adminOnly && !user.isAdmin) {
    return <Redirect to="/home" />;
  }

  return <Component {...rest} />;
}

import Landing from "@/pages/Landing";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={() => <Redirect to="/auth" />} />
      <Route path="/admin" component={() => <PrivateRoute component={AdminDashboard} adminOnly={true} />} />
      <Route path="/home" component={() => <PrivateRoute component={Home} />} />
      <Route path="/people" component={() => <PrivateRoute component={PeopleList} />} />
      <Route path="/people/:id" component={(params) => <PrivateRoute component={PersonDetail} params={params} />} />
      <Route path="/cards" component={() => <PrivateRoute component={CardsList} />} />
      <Route path="/cards/:type" component={(params) => <PrivateRoute component={CardsByType} params={params} />} />
      <Route path="/view/:id" component={(params) => <PrivateRoute component={FileViewer} params={params} />} />
      <Route path="/error" component={ErrorPage} />
      <Route path="/password-recovery-tool" component={PasswordRecovery} />
      <Route component={NotFound} />
    </Switch>
  );
}


import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StorageModeProvider>
          <AuthProvider>
            <ThemeToggle />
            <Toaster />
            <Router />
            <MobileNav />
          </AuthProvider>
        </StorageModeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
