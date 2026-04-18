import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NomadAI from "@/components/NomadAI";
import MobileNav from "@/components/MobileNav";
import BackToTop from "@/components/BackToTop";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import Communities from "./pages/Communities";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Settings from "./pages/Settings";
import Feed from "./pages/Feed";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import SearchPage from "./pages/SearchPage";
import Messages from "./pages/Messages";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import Opportunities from "./pages/Opportunities";
import Resources from "./pages/Resources";
import Leaderboard from "./pages/Leaderboard";
import Discover from "./pages/Discover";
import Mentors from "./pages/Mentors";
import Admin from "./pages/Admin";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public */}
              <Route path="/"               element={<Index />} />
              <Route path="/auth/signup"    element={<SignUp />} />
              <Route path="/auth/signin"    element={<SignIn />} />
              <Route path="/pricing"        element={<Pricing />} />
              <Route path="*"              element={<NotFound />} />

              {/* Public profiles */}
              <Route path="/profile/:username" element={<Profile />} />

              {/* Browse (public but enhanced when logged in) */}
              <Route path="/communities"             element={<Communities />} />
              <Route path="/:community/feed"         element={<Feed />} />
              <Route path="/feed"                    element={<Feed />} />
              <Route path="/:community/events"       element={<Events />} />
              <Route path="/events"                  element={<Events />} />
              <Route path="/events/:id"              element={<EventDetail />} />
              <Route path="/:community/challenges"   element={<Challenges />} />
              <Route path="/challenges"              element={<Challenges />} />
              <Route path="/challenges/:id"          element={<ChallengeDetail />} />
              <Route path="/:community/opportunities" element={<Opportunities />} />
              <Route path="/opportunities"           element={<Opportunities />} />
              <Route path="/:community/resources"    element={<Resources />} />
              <Route path="/resources"               element={<Resources />} />
              <Route path="/:community/leaderboard"  element={<Leaderboard />} />
              <Route path="/leaderboard"             element={<Leaderboard />} />
              <Route path="/:community/discover"     element={<Discover />} />
              <Route path="/discover"                element={<Discover />} />
              <Route path="/:community/mentors"      element={<Mentors />} />
              <Route path="/mentors"                 element={<Mentors />} />
              <Route path="/:community/groups"       element={<Groups />} />
              <Route path="/groups"                  element={<Groups />} />
              <Route path="/groups/:id"              element={<GroupDetail />} />
              <Route path="/search"                  element={<SearchPage />} />

              {/* Protected */}
              <Route path="/onboarding"    element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile/edit"  element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
              <Route path="/settings"      element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/messages"      element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/admin"         element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            </Routes>
            <NomadAI />
            <MobileNav />
            <BackToTop />
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
