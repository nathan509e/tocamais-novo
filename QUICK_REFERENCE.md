# QUICK REFERENCE GUIDE - TIPS IMPLEMENTATION

## KEY FINDINGS SUMMARY

### 1. Artist Profile Page Location
- **File**: src/pages/artist/ArtistProfile.jsx (649 lines)
- **Route**: /artist/profile
- **Status**: Fully functional

### 2. Tips System Status
- **ALREADY FULLY IMPLEMENTED!**
- Tips page file: src/pages/artist/ArtistTip.jsx (742 lines)
- Route: /artist/tip/{artistId}
- Fully public access (no auth required)

### 3. Tips Button in Profile
- **ALREADY EXISTS** at lines 536-557 of ArtistProfile.jsx
- Wallet icon with "Dar Gorjeta" text
- Links to /artist/tip/{userId}
- Shows only if artist has PIX key set

### 4. Payment System
- Integrated with Stripe + Mercado Pago
- PIX payment generation and QR codes
- Automatic payment polling
- Minimum tip: R$ 5.00

### 5. Database Setup
- music_requests table exists (or will be created by functions)
- artists table has pix_key field
- All necessary fields for tips already defined

## File Locations (Absolute Paths)

| Component | Path |
|-----------|------|
| Router | C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\App.jsx |
| Artist Profile | C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\pages\artist\ArtistProfile.jsx |
| Tips Page | C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\pages\artist\ArtistTip.jsx |
| Main Layout | C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\components\shared\AppLayout.jsx |
| Theme Config | C:\Users\Nathan\Documents\GitHub\tocamais-novo\tailwind.config.js |
| Auth Context | C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\lib/AuthContext.jsx |
| Theme Context | C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\lib/ThemeContext.jsx |
| Supabase Client | C:\Users\Nathan\Documents\GitHub\tocamais-novo\src\lib/supabaseClient.js |

## Tech Stack Quick Reference

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router v6
- **State**: TanStack React Query + Context API
- **Styling**: TailwindCSS 3 + custom theme
- **Icons**: lucide-react (v0.475)
- **Animations**: Framer Motion 11
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe + Mercado Pago (PIX)
- **Build**: Vite 6

## Color Scheme

- Primary: #7B2EFF (neon-purple)
- Accent: #39FF6A (neon-green)
- Dark BG: #08041A (app-dark)
- Card: #0F0926 (card-dark)

## Component Hierarchy

```
AppLayout
├── Header (with theme toggle, notifications)
├── Desktop Sidebar
├── Mobile Bottom Nav
└── Main Content
    └── ArtistProfile
        ├── Cover image
        ├── Avatar section
        ├── Edit form
        ├── Theme switcher
        ├── Bio
        ├── Video section
        ├── Repertório
        ├── Stats (4 cols)
        ├── CTA buttons (Hire, Share, Like)
        ├── Tips Card ← BUTTON IS HERE
        ├── Mini player
        └── Tabs (Portfolio, Reviews)
```

## Route Parameters

- Artist own profile: /artist/tip/{user.id}
- Other artist profile: /artist/tip/{artistProfile.user_id}

## Tips Flow (Multi-stage)

1. PRESENTATION - Show artist info, choose flow
2. FORM - Get user data, song, message
3. ORDER_ONLY_THANKS - Confirm (if order only)
4. TIP_VALUE - Input amount, CPF
5. PIX_PAYMENT - Show QR code
6. FINAL_THANKS - Success

## Database Fields Used

### artists table
- pix_key (TEXT) - For receiving tips
- presentation_video_url (TEXT)
- selected_musicas_ids (UUID[])

### music_requests table (inferred)
- artist_id, musica_id, user_name, message
- status, amount, requested_at

## Supabase Functions Called

1. stripe-create-pix - Generate PIX
2. stripe-check-payment - Poll status
3. stripe-process-tip - Process payment

## Next Steps for Enhancement

1. Customize tip button styling/position
2. Add quick-tip amounts (R$ 5, 10, 20) to profile
3. Add tips dashboard/statistics
4. Add tips received badge/counter
5. Create in-profile tip modal variant

