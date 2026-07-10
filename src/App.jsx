import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { GoogleOAuthProvider } from '@/lib/GoogleOAuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
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
import ArtistProposals from './pages/artist/ArtistProposals';
import ContractorDashboard from './pages/contractor/ContractorDashboard';
import ContractorSearch from './pages/contractor/ContractorSearch';
import ContractorFavorites from './pages/contractor/ContractorFavorites';
import Search from './pages/Search';
import Live from './pages/Live';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import ContractorProfile from './pages/contractor/ContractorProfile';
import MessagesPage from './pages/shared/MessagesPage';
import ArtistTip from './pages/artist/ArtistTip';
import ArtistRequests from './pages/artist/ArtistRequests';
import AdminOrders from './pages/admin/AdminOrders';
import AdminDashboard from './pages/admin/AdminDashboard';
import ArtistMiniProfile from './pages/artist/ArtistMiniProfile';

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

  // Redirect to Landing if not authenticated
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/artist/tip/:artistId" element={<ArtistTip />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Determine user dashboard landing page
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || user?.user_metadata?.role || user?.role || 'artist';
  const defaultDashboard = userRole === 'admin'
    ? '/admin'
    : userRole === 'artist' 
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
      <Route path="/artist/proposals" element={<ArtistProposals />} />
      <Route path="/artist/messages" element={<MessagesPage role="artist" />} />
      <Route path="/artist/tip/:artistId" element={<ArtistTip />} />
      <Route path="/artist/requests" element={<ArtistRequests />} />

      {/* Venue Routes */}
      <Route path="/venue" element={<VenueDashboard />} />
      <Route path="/venue/artists" element={<VenueArtists />} />
      <Route path="/venue/schedule" element={<VenueSchedule />} />
      <Route path="/venue/messages" element={<MessagesPage role="venue" />} />

      {/* Contractor Routes */}
      <Route path="/contractor" element={<ContractorDashboard />} />
      <Route path="/contractor/search" element={<ContractorSearch />} />
      <Route path="/contractor/favorites" element={<ContractorFavorites />} />
      <Route path="/contractor/profile" element={<ContractorProfile />} />
      <Route path="/contractor/messages" element={<MessagesPage role="contractor" />} />

      {/* Shared Routes */}
      <Route path="/search" element={<Search />} />
      <Route path="/live" element={<Live />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/orders" element={<AdminOrders />} />

      {/* Mini profile */}
      <Route path="/artist/mini-profile" element={<ArtistMiniProfile />} />

      {/* Catch all */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <GoogleOAuthProvider>
        <ThemeProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
              <AuthenticatedApp />
              <Toaster />
            </QueryClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </Router>
  );
};

export default App;
