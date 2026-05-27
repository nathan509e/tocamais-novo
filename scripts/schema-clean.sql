-- =============================================================
-- TocaMais - Complete Schema Reset
-- Drop all old tables, create correct tables, disable RLS.
-- NO seed data (handled via API).
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all existing tables (old + new schemas)
DROP TABLE IF EXISTS public.artist_profiles CASCADE;
DROP TABLE IF EXISTS public.proposals CASCADE;
DROP TABLE IF EXISTS public.setlists CASCADE;
DROP TABLE IF EXISTS public.setlist_musicas CASCADE;
DROP TABLE IF EXISTS public.pedidos CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.tips CASCADE;
DROP TABLE IF EXISTS public.maismais CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.contractors CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.agendas CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.musicas_repertorio CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;
DROP TABLE IF EXISTS public.artists CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. USERS (mirrors auth.users for FK compatibility)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('artist', 'venue', 'contractor')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. ARTISTS
CREATE TABLE public.artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    artistic_name TEXT NOT NULL,
    genre TEXT NOT NULL,
    city TEXT NOT NULL,
    bio TEXT,
    base_fee NUMERIC(10,2) DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 5,
    followers INTEGER DEFAULT 0,
    photo_url TEXT,
    cover_url TEXT,
    verified BOOLEAN DEFAULT false,
    live_now BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    video_portfolio_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    music_playlist_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    presentation_video_url TEXT,
    selected_musicas_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. VENUES
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    venue_name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    capacity INTEGER DEFAULT 100,
    bio TEXT,
    average_budget NUMERIC(10,2) DEFAULT 0,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. CONTRACTORS
CREATE TABLE public.contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    phone TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. EVENTS
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER DEFAULT 120,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','proposed','confirmed','completed','cancelled')),
    fee_proposed NUMERIC(10,2) NOT NULL,
    fee_agreed NUMERIC(10,2),
    address TEXT NOT NULL,
    venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    contractor_id UUID REFERENCES public.contractors(id) ON DELETE SET NULL,
    artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. CONTRACTS
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID UNIQUE NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    digital_signature_artist TEXT,
    digital_signature_employer TEXT,
    signed_at_artist TIMESTAMPTZ,
    signed_at_employer TIMESTAMPTZ,
    content TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','signed')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. PAYMENTS
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    payee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded')),
    method TEXT,
    transaction_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. REVIEWS
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. MESSAGES
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. AGENDAS
CREATE TABLE public.agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    busy_date DATE NOT NULL,
    note TEXT,
    UNIQUE(artist_id, busy_date)
);

-- 12. MUSICAS REPERTORIO
CREATE TABLE public.musicas_repertorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artista_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    artista_nome TEXT NOT NULL,
    genero TEXT DEFAULT 'Sertanejo',
    duracao_seg INTEGER,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 13. FAVORITES
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, artist_id)
);

-- Disable RLS for development
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.musicas_repertorio DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites DISABLE ROW LEVEL SECURITY;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_artists_genre ON public.artists(genre);
CREATE INDEX IF NOT EXISTS idx_artists_city ON public.artists(city);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
