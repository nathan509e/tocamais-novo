# TOCAMAIS PROJECT EXPLORATION REPORT
## Comprehensive Codebase Analysis for Tips Implementation

---

## PROJECT OVERVIEW

### Technology Stack
- **Frontend Framework**: React 18.2.0
- **Build Tool**: Vite 6.1.0  
- **Routing**: React Router DOM 6.26.0
- **State Management**: TanStack React Query 5.84.1
- **Styling**: TailwindCSS 3.4.17 with custom Neon theme
- **UI Components**: Radix UI primitives + shadcn/ui
- **Animations**: Framer Motion 11.16.4
- **Backend/Database**: Supabase (PostgreSQL)
- **Payment Integration**: Stripe + Mercado Pago (PIX)
- **Authentication**: Supabase Auth + Google OAuth

---

## 1. ARTIST PROFILE PAGE

**Main File**: C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\pages\artist\ArtistProfile.jsx
**Lines**: 649 lines
**Export**: Default export - ArtistProfile component

### Features
- Artist profile display with cover and avatar
- Profile editing form
- Presentation video upload
- Song repertório display
- Statistics cards (followers, rating, shows, cachê)
- CTA buttons (Hire, Share, Like)
- **Tips Card** - Already implemented!
- Mini player widget
- Portfolio and reviews tabs
- Dark/Light theme switcher

---

## 2. ROUTING STRUCTURE

**Router File**: C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\App.jsx

### Artist Routes
- /artist → ArtistDashboard
- /artist/agenda → ArtistAgenda
- /artist/metrics → ArtistMetrics
- /artist/profile → ArtistProfile (MAIN PROFILE PAGE)
- /artist/proposals → ArtistProposals
- /artist/messages → MessagesPage
- /artist/tip/{artistId} → ArtistTip (TIPS PAGE - PUBLIC)
- /artist/requests → ArtistRequests
- /admin/orders → AdminOrders

### Public Routes (No Auth)
- / → Landing
- /login → Login
- /artist/tip/{artistId} → ArtistTip (Publicly accessible for giving tips)

---

## 3. ARTIST PROFILE COMPONENTS

### Component Structure
```
ArtistProfile
├── AppLayout (sidebar + header wrapper)
├── Cover image section
├── Avatar + artist info
├── Edit profile form
├── Theme switcher
├── Biography
├── Presentation video section
├── Repertório display
├── Statistics grid
├── CTA buttons
├── Tips Card (EXISTING - lines 536-557)
├── Mini player widget
└── Tabs (portfolio / reviews)
```

### Key Hooks
- useState - Multiple state variables
- useEffect - Data fetching
- useTheme() - Theme context
- useAuth() - User authentication

### Related Components
- AppLayout.jsx - Main layout wrapper
- ArtistCard.jsx - Compact card version
- ArtistProfileModal.jsx - Modal version
- WaveIcon.jsx - Animated wave
- ParticleBackground.jsx - Background animation

---

## 4. TIPS/GORJETA IMPLEMENTATION - ALREADY EXISTS!

**File**: C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\pages\artist\ArtistTip.jsx
**Lines**: 742 lines
**Status**: FULLY IMPLEMENTED

### Features Implemented
1. Two Flow Options
   - "Apenas Pedido" (Music Request Only)
   - "Pedido com Gorjeta" (Request with Tip)

2. Multi-Stage Flow
   - PRESENTATION - Intro with artist info
   - FORM - Collect data, song selection, message
   - ORDER_ONLY_THANKS - Thank you confirmation
   - TIP_VALUE - Tip amount input
   - PIX_PAYMENT - QR code display
   - FINAL_THANKS - Success confirmation
   - TIP_ONLY - Tip without request

3. Payment System
   - PIX payment via Stripe/Mercado Pago
   - QR code generation
   - Copy PIX code functionality
   - Automatic payment polling (5-second intervals)
   - Minimum tip: R$ 5,00

4. Data Collection
   - User name
   - Message/dedication
   - CPF (required for PIX)
   - Star rating (1-5)
   - Music selection from repertório

5. Supabase Integration
   - Inserts into `music_requests` table
   - Calls edge functions:
     - stripe-create-pix
     - stripe-check-payment
     - stripe-process-tip

### Tips Button in Profile
**Location**: ArtistProfile.jsx, lines 536-557

Shows a card with:
- Wallet icon (Neon green)
- Title: "Dar Gorjeta"
- Subtitle: "Acompanhe esse artista no seu.show"
- Links to: /artist/tip/{userId}
- Only shows if artist has pix_key OR user viewing own profile

---

## 5. PROJECT DIRECTORY STRUCTURE

```
tocamais-novo/
├── src/
│   ├── api/ → base44Client.js
│   ├── assets/ → Images (includes feature-gorjetas.jpg)
│   ├── components/
│   │   ├── shared/
│   │   │   ├── AppLayout.jsx (MAIN LAYOUT)
│   │   │   ├── ArtistProfileModal.jsx
│   │   │   ├── ArtistCard.jsx
│   │   │   ├── WaveIcon.jsx
│   │   │   └── ParticleBackground.jsx
│   │   └── ui/ → 80+ Radix UI components
│   ├── hooks/ → use-mobile.jsx
│   ├── lib/
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   ├── supabaseClient.js
│   │   ├── GoogleOAuthContext.jsx
│   │   ├── googleCalendarService.js
│   │   └── query-client.js
│   ├── pages/
│   │   ├── artist/
│   │   │   ├── ArtistProfile.jsx ← TARGET
│   │   │   ├── ArtistTip.jsx ← TIPS PAGE
│   │   │   ├── ArtistDashboard.jsx
│   │   │   ├── ArtistAgenda.jsx
│   │   │   ├── ArtistMetrics.jsx
│   │   │   ├── ArtistProposals.jsx
│   │   │   ├── ArtistRequests.jsx
│   │   ├── venue/
│   │   ├── contractor/
│   │   └── [other pages]
│   ├── utils/
│   ├── App.jsx (ROUTER)
│   └── main.jsx
├── supabase/
├── public/
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 6. STYLING & DESIGN SYSTEM

### Colors (from tailwind.config.js)
- Primary: neon-purple (#7B2EFF)
- Accent: neon-green (#39FF6A)
- Dark bg: app-dark (#08041A)
- Card bg: card-dark (#0F0926)

### Custom Animations
- pulse-glow - Purple/green glow
- float - Floating motion
- shimmer - Shimmer effect
- wave - Wave animation

### Theme System
- Context: ThemeContext
- Storage: localStorage
- Implementation: isDark ternaries in className

### Icons
- Library: lucide-react (v0.475.0)
- Examples: Music, Star, Wallet, Edit3, Sparkles, Check

---

## 7. DATABASE SCHEMA

### Key Tables
1. users - Auth + user data
2. artists - Artist profiles
   - pix_key - For receiving tips
   - presentation_video_url
   - selected_musicas_ids
3. music_requests - Music requests and tips
   - artist_id, musica_id, musica_titulo
   - user_name, message, status, amount, requested_at
4. musicas_repertorio - Global music library
5. payments - Payment records
6. reviews - Artist ratings
7. notifications - System notifications
8. messages - Chat
9. events - Show bookings
10. contracts - Digital contracts
11. favorites - Favorite artists
12. agendas - Busy dates

---

## 8. AUTHENTICATION & PROVIDERS

### Auth Context
- File: src/lib/AuthContext.jsx
- Provides: user, isAuthenticated, isLoadingAuth, userProfile, logout, refreshProfile
- Source: Supabase Auth

### Theme Context
- File: src/lib/ThemeContext.jsx
- Provides: theme, setTheme, toggleTheme
- Storage: localStorage

### Root App Wrapper
```jsx
<ThemeProvider>
  <GoogleOAuthProvider>
    <AuthProvider>
      <QueryClientProvider>
        <Router>
          <AuthenticatedApp />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
</ThemeProvider>
```

---

## 9. TIPS BUTTON CURRENT CODE

**Location**: ArtistProfile.jsx, lines 536-557

```jsx
{(artistProfile?.pix_key || user?.id === artistProfile?.user_id) && (
  <a
    href={user?.id === artistProfile?.user_id ? '/artist/tip/' + user.id : '/artist/tip/' + artistProfile?.user_id}
    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
      isDark ? 'bg-white/5 border-white/5 hover:border-neon-green/30' : 'bg-white border-gray-200 hover:border-neon-green/30'
    }`}
  >
    <div className="w-12 h-12 rounded-xl bg-neon-green/20 flex items-center justify-center">
      <Wallet className="w-6 h-6 text-neon-green" />
    </div>
    <div className="flex-1">
      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Dar Gorjeta
      </p>
      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Acompanhe esse artista no seu.show
      </p>
    </div>
    <div className="text-neon-green text-2xl">→</div>
  </a>
)}
```

### Key Points
- Shows only if artist has PIX key OR user viewing own profile
- Uses Wallet icon from lucide-react
- Links to /artist/tip/{artistId}
- Styled with neon-green color scheme
- Dark/Light mode support

---

## 10. MUSIC REQUESTS TABLE STRUCTURE

**Inferred from ArtistTip.jsx line 181**

Fields:
- artist_id (UUID)
- musica_id (UUID)
- musica_titulo (TEXT)
- musica_artista (TEXT)
- user_name (TEXT)
- message (TEXT)
- status (TEXT: 'pending')
- requested_at (TIMESTAMP)
- amount (NUMERIC: tip amount, 0 for requests only)

---

## 11. SUPABASE EDGE FUNCTIONS

Called from ArtistTip.jsx:

1. stripe-create-pix
   - Input: amount, description, customerName, customerEmail, customerTaxId
   - Output: qrCodeBase64, qrCode, paymentIntentId

2. stripe-check-payment
   - Input: payment_intent_id
   - Output: mpStatus (approved/pending/failed)

3. stripe-process-tip
   - Input: payment_intent_id, artist_id, amount, user_name, message, musica_id, rating
   - Output: success, error

---

## 12. CUSTOM COMPONENTS & UTILITIES

### UI Components
- NeonButton.jsx - Custom button with variants
- StatCard.jsx - Statistics display
- 80+ Radix UI wrappers in ui/ folder

### Utilities
- ThemeContext.jsx - Theme management
- AuthContext.jsx - Authentication state
- supabaseClient.js - Database client
- query-client.js - React Query config

---

## ABSOLUTE FILE PATHS FOR IMPLEMENTATION

1. **Router**: C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\App.jsx
2. **Artist Profile**: C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\pages\artist\ArtistProfile.jsx
3. **Tips Page**: C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\pages\artist\ArtistTip.jsx
4. **Layout Wrapper**: C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\components\shared\AppLayout.jsx
5. **Tailwind Config**: C:\Users\Nathan\Documents\GitHub\tocamais-novo\tailwind.config.js
6. **Theme Context**: C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\lib\ThemeContext.jsx
7. **Auth Context**: C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\lib\AuthContext.jsx
8. **Supabase Client**: C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\lib\supabaseClient.js

---

## IMPLEMENTATION RECOMMENDATIONS

### Current State
- Artist profile page: Fully functional
- Tips system: Already fully implemented
- Tips button: Already visible in profile
- Payment gateway: Integrated with Stripe + Mercado Pago
- Database: Ready with all necessary tables

### Enhancement Opportunities
1. Add quick-tip buttons (R$ 5, 10, 20) directly in profile
2. Add tips history/leaderboard in artist metrics
3. Add animation/badge showing tips received
4. Implement in-profile mini payment modal
5. Add quick PIX key copy-to-clipboard in profile
6. Create dashboard widget showing tip statistics

