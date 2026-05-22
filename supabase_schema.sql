-- Supabase Database Schema for TocaMais App
-- PostgreSQL Database setup with users, roles, messaging, events, payments, reviews, and favorites.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('artist', 'venue', 'contractor')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ARTISTS PROFILE TABLE
CREATE TABLE IF NOT EXISTS public.artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    artistic_name TEXT NOT NULL,
    genre TEXT NOT NULL,
    city TEXT NOT NULL,
    bio TEXT,
    base_fee NUMERIC(10, 2) DEFAULT 0.00,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    followers INTEGER DEFAULT 0,
    photo_url TEXT,
    verified BOOLEAN DEFAULT false,
    live_now BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    video_portfolio_urls TEXT[], -- Array of video URLs
    music_playlist_urls TEXT[], -- Array of audio/playlist URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. VENUES PROFILE TABLE (CASA DE SHOW)
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    venue_name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    capacity INTEGER DEFAULT 100,
    bio TEXT,
    average_budget NUMERIC(10, 2) DEFAULT 0.00,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CONTRACTORS PROFILE TABLE (CONTRATANTE PARTICULAR)
CREATE TABLE IF NOT EXISTS public.contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    phone TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. EVENTS / SHOWS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER DEFAULT 120, -- in minutes
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proposed', 'confirmed', 'completed', 'cancelled')),
    fee_proposed NUMERIC(10, 2) NOT NULL,
    fee_agreed NUMERIC(10, 2),
    address TEXT NOT NULL,
    venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    contractor_id UUID REFERENCES public.contractors(id) ON DELETE SET NULL,
    artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID UNIQUE NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    digital_signature_artist TEXT,
    digital_signature_employer TEXT,
    signed_at_artist TIMESTAMP WITH TIME ZONE,
    signed_at_employer TIMESTAMP WITH TIME ZONE,
    content TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    payee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
    method TEXT,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. MESSAGES TABLE (CHAT SYSTEM)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    type TEXT, -- e.g., 'proposal', 'payment', 'message', 'alert'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. ARTIST AGENDAS (BUSY DATES)
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    busy_date DATE NOT NULL,
    note TEXT,
    UNIQUE(artist_id, busy_date)
);

-- 12. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, artist_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_artists_genre ON public.artists(genre);
CREATE INDEX IF NOT EXISTS idx_artists_city ON public.artists(city);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);

-- Seed Initial Mock Data
-- Insert mock user profiles
INSERT INTO public.users (id, email, name, role, avatar_url) VALUES
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', 'lucas@gmail.com', 'Lucas Volta', 'artist', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'joao@gmail.com', 'João Silva', 'venue', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3', 'maria@gmail.com', 'Maria Santos', 'contractor', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop')
ON CONFLICT (email) DO NOTHING;

-- Insert artist metadata
INSERT INTO public.artists (id, user_id, artistic_name, genre, city, bio, base_fee, rating, followers, photo_url, verified) VALUES
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', 'Lucas Volta', 'Sertanejo', 'São Paulo', 'Cantor solo de sertanejo universitário, tocando o melhor do modão e hits atuais.', 2800.00, 4.9, 103000, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', true)
ON CONFLICT DO NOTHING;

-- Insert venue metadata
INSERT INTO public.venues (id, user_id, venue_name, city, address, capacity, bio, average_budget, logo_url) VALUES
('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c1', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'Bar do João', 'São Paulo', 'Rua das Flores, 123 - Pinheiros', 250, 'O melhor bar com música ao vivo da região de Pinheiros.', 8000.00, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop')
ON CONFLICT DO NOTHING;

-- Insert contractor metadata
INSERT INTO public.contractors (id, user_id, phone, preferences) VALUES
('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d1', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3', '+5511999999999', '{"preferred_genre": "Pop", "event_type": "Casamento"}')
ON CONFLICT DO NOTHING;
