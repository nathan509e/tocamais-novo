import { Toaster } from "@/components/ui/toaster"
import { Capacitor } from '@capacitor/core';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { GoogleOAuthProvider } from '@/lib/GoogleOAuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import Login from './pages/Login';

// Detecta se o app está rodando "instalado" via navegador (PWA — Adicionar à Tela de
// Início), diferente do app nativo compilado (Capacitor.isNativePlatform()). Sem isso,
// quem instala o PWA pelo Chrome/Safari continua vendo a Landing normalmente, igual a
// uma visita comum de navegador.
const checkStandalonePwa = () => {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem('tocamais_is_pwa') === 'true') return true;

  const params = new URLSearchParams(window.location.search);
  const isPwaParam = params.get('pwa') === 'true';

  const matchesStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    isPwaParam;

  if (matchesStandalone) {
    try {
      localStorage.setItem('tocamais_is_pwa', 'true');
    } catch {
      /* ignore */
    }
    return true;
  }
  return false;
};

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
import ArtistRepertorio from './pages/artist/ArtistRepertorio';
import ContractorDashboard from './pages/contractor/ContractorDashboard';
import ContractorSearch from './pages/contractor/ContractorSearch';
import ContractorFavorites from './pages/contractor/ContractorFavorites';
import Search from './pages/Search';
import Live from './pages/Live';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import ContractorProfile from './pages/contractor/ContractorProfile';
import VenueProfile from './pages/venue/VenueProfile';
import MessagesPage from './pages/shared/MessagesPage';
import ArtistTip from './pages/artist/ArtistTip';
import ArtistRequests from './pages/artist/ArtistRequests';
import AdminOrders from './pages/admin/AdminOrders';
import AdminDashboard from './pages/admin/AdminDashboard';
import ArtistMiniProfile from './pages/artist/ArtistMiniProfile';
import ArtistOnboarding from './pages/artist/ArtistOnboarding';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

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
    const isApp = Capacitor.isNativePlatform() || checkStandalonePwa();
    return (
      <Routes>
        <Route path="/" element={isApp ? <Navigate to="/login" replace /> : <Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/artist/tip/:artistId" element={<ArtistTip />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/termos" element={<TermsOfService />} />
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

  // Guarda de rota por papel: RLS no banco já bloqueia acesso a dados de
  // outro usuário, mas isso evita que alguém logado com um papel (ex.
  // contratante) sequer carregue a casca de UI de outro painel (ex. admin)
  // navegando direto pela URL.
  const RoleRoute = ({ allowed, children }) =>
    allowed.includes(userRole) ? children : <Navigate to={defaultDashboard} replace />;

  return (
    <Routes>
      {/* Root lands user on the landing page as requested */}
        <Route path="/" element={<Navigate to={defaultDashboard} replace />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Navigate to={defaultDashboard} replace />} />

{/* Artist Routes */}
      <Route path="/artist" element={<RoleRoute allowed={['artist']}><ArtistDashboard /></RoleRoute>} />
      <Route path="/artist/agenda" element={<RoleRoute allowed={['artist']}><ArtistAgenda /></RoleRoute>} />
      <Route path="/artist/metrics" element={<RoleRoute allowed={['artist']}><ArtistMetrics /></RoleRoute>} />
      <Route path="/artist/profile" element={<RoleRoute allowed={['artist']}><ArtistProfile /></RoleRoute>} />
      <Route path="/artist/proposals" element={<RoleRoute allowed={['artist']}><ArtistProposals /></RoleRoute>} />
      <Route path="/artist/messages" element={<RoleRoute allowed={['artist']}><MessagesPage role="artist" /></RoleRoute>} />
      <Route path="/artist/tip/:artistId" element={<ArtistTip />} />
      <Route path="/artist/requests" element={<RoleRoute allowed={['artist']}><ArtistRequests /></RoleRoute>} />
      <Route path="/artist/repertorio" element={<RoleRoute allowed={['artist']}><ArtistRepertorio /></RoleRoute>} />
      <Route path="/artist/onboarding" element={<RoleRoute allowed={['artist']}><ArtistOnboarding /></RoleRoute>} />

      {/* Venue Routes */}
      <Route path="/venue" element={<RoleRoute allowed={['venue']}><VenueDashboard /></RoleRoute>} />
      <Route path="/venue/artists" element={<RoleRoute allowed={['venue']}><VenueArtists /></RoleRoute>} />
      <Route path="/venue/schedule" element={<RoleRoute allowed={['venue']}><VenueSchedule /></RoleRoute>} />
      <Route path="/venue/messages" element={<RoleRoute allowed={['venue']}><MessagesPage role="venue" /></RoleRoute>} />
      <Route path="/venue/profile" element={<RoleRoute allowed={['venue']}><VenueProfile /></RoleRoute>} />

      {/* Contractor Routes */}
      <Route path="/contractor" element={<RoleRoute allowed={['contractor']}><ContractorDashboard /></RoleRoute>} />
      <Route path="/contractor/search" element={<RoleRoute allowed={['contractor']}><ContractorSearch /></RoleRoute>} />
      <Route path="/contractor/favorites" element={<RoleRoute allowed={['contractor']}><ContractorFavorites /></RoleRoute>} />
      <Route path="/contractor/profile" element={<RoleRoute allowed={['contractor']}><ContractorProfile /></RoleRoute>} />
      <Route path="/contractor/messages" element={<RoleRoute allowed={['contractor']}><MessagesPage role="contractor" /></RoleRoute>} />

      {/* Shared Routes */}
      <Route path="/search" element={<Search />} />
      <Route path="/live" element={<Live />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/admin" element={<RoleRoute allowed={['admin']}><AdminDashboard /></RoleRoute>} />
      <Route path="/admin/orders" element={<RoleRoute allowed={['admin']}><AdminOrders /></RoleRoute>} />

      {/* Mini profile */}
      <Route path="/artist/mini-profile" element={<ArtistMiniProfile />} />

      {/* Policy and Terms */}
      <Route path="/privacidade" element={<PrivacyPolicy />} />
      <Route path="/termos" element={<TermsOfService />} />

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
