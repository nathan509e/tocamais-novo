import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from './pages/Login';

// Page imports
import Landing from './pages/Landing';
import VenueDashboard from './pages/venue/VenueDashboard';
import VenueArtists from './pages/venue/VenueArtists';
import VenueSchedule from './pages/venue/VenueSchedule';
import ArtistDashboard from './pages/artist/ArtistDashboard';
import ArtistAgenda from './pages/artist/ArtistAgenda';
import ArtistMetrics from './pages/artist/ArtistMetrics';
import ArtistProfile from './pages/artist/ArtistProfile';
import ContractorDashboard from './pages/contractor/ContractorDashboard';
import ContractorSearch from './pages/contractor/ContractorSearch';
import ContractorFavorites from './pages/contractor/ContractorFavorites';
import Search from './pages/Search';
import Live from './pages/Live';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import ContractorProfile from './pages/contractor/ContractorProfile';
import MessagesPage from './pages/shared/MessagesPage';

const AuthenticatedApp = () => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#08041A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7B2EFF] to-[#39FF6A] flex items-center justify-center animate-pulse">
            <span className="text-white font-black text-lg">T</span>
          </div>
          <div className="w-8 h-8 border-4 border-[#7B2EFF]/30 border-t-[#7B2EFF] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Redirect to Login if not authenticated
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Determine user dashboard landing page
  const userRole = user?.user_metadata?.role || user?.role || 'artist';
  const defaultDashboard = userRole === 'artist' 
    ? '/artist' 
    : userRole === 'venue' 
      ? '/venue' 
      : '/contractor';

  return (
    <Routes>
      {/* Root lands user on the landing page as requested */}
        <Route path="/" element={<Navigate to={defaultDashboard} replace />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Navigate to={defaultDashboard} replace />} />

{/* Artist Routes */}
      <Route path="/artist" element={<ArtistDashboard />} />
      <Route path="/artist/agenda" element={<ArtistAgenda />} />
      <Route path="/artist/metrics" element={<ArtistMetrics />} />
      <Route path="/artist/profile" element={<ArtistProfile />} />
      <Route path="/artist/messages" element={<MessagesPage role="artist" />} />

      {/* Venue Routes */}
      <Route path="/venue" element={<VenueDashboard />} />
      <Route path="/venue/artists" element={<VenueArtists />} />
      <Route path="/venue/schedule" element={<VenueSchedule />} />
      <Route path="/venue/messages" element={<MessagesPage role="venue" />} />

      {/* Contractor Routes */}
      <Route path="/contractor" element={<ContractorDashboard />} />
      <Route path="/contractor/search" element={<ContractorSearch />} />
      <Route path="/contractor/favorites" element={<ContractorFavorites />} />
      <Route path="/contractor/messages" element={<MessagesPage role="contractor" />} />
      <Route path="/contractor/profile" element={<ContractorProfile />} />

      {/* General Shared Views */}
      <Route path="/search" element={<Search />} />
      <Route path="/live" element={<Live />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

import { ThemeProvider } from '@/lib/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;