-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.agendas CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.musicas_repertorio CASCADE;
DROP TABLE IF EXISTS public.contractors CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;
DROP TABLE IF EXISTS public.artists CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

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
    presentation_video_url TEXT,
    selected_musicas_ids UUID[] DEFAULT '{}',
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

-- 12. MUSICAS REPERTORIO TABLE
CREATE TABLE IF NOT EXISTS public.musicas_repertorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artista_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    artista_nome TEXT NOT NULL,
    genero TEXT DEFAULT 'Sertanejo',
    duracao_seg INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, artist_id)
);

-- Add missing columns to existing tables (safe to run if columns already exist)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS artistic_name TEXT;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS base_fee NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 5.00;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS followers INTEGER DEFAULT 0;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS presentation_video_url TEXT;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS selected_musicas_ids UUID[] DEFAULT '{}';
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS live_now BOOLEAN DEFAULT false;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS video_portfolio_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS music_playlist_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS pix_key TEXT;

ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS venue_name TEXT;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 100;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS average_budget NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.musicas_repertorio ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.musicas_repertorio ADD COLUMN IF NOT EXISTS artista_id UUID REFERENCES public.artists(id) ON DELETE CASCADE;
ALTER TABLE public.musicas_repertorio ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE public.musicas_repertorio ADD COLUMN IF NOT EXISTS artista_nome TEXT;
ALTER TABLE public.musicas_repertorio ADD COLUMN IF NOT EXISTS genero TEXT DEFAULT 'Sertanejo';
ALTER TABLE public.musicas_repertorio ADD COLUMN IF NOT EXISTS duracao_seg INTEGER;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.agendas ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE public.agendas ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE;
ALTER TABLE public.agendas ADD COLUMN IF NOT EXISTS busy_date DATE;
ALTER TABLE public.agendas ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS time TIME;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 120;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fee_proposed NUMERIC(10, 2);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fee_agreed NUMERIC(10, 2);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS contractor_id UUID REFERENCES public.contractors(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS event_id UUID UNIQUE REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS digital_signature_artist TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS digital_signature_employer TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_at_artist TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_at_employer TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payer_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payee_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS method TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_hash TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewee_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

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
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'joao@gmail.com', 'JoÃ£o Silva', 'venue', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3', 'maria@gmail.com', 'Maria Santos', 'contractor', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e4', 'laxy@gmail.com', 'Laxy Music', 'artist', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e5', 'novaera@gmail.com', 'Banda Nova Era', 'artist', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e6', 'sofia@gmail.com', 'Sofia Neon', 'artist', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e7', 'matteus@gmail.com', 'Dj Matteus', 'artist', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e8', 'samba@gmail.com', 'Trio Samba Amor', 'artist', 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=200&h=200&fit=crop')
ON CONFLICT (email) DO NOTHING;

-- Insert artist metadata
INSERT INTO public.artists (id, user_id, artistic_name, genre, city, bio, base_fee, rating, followers, photo_url, verified, live_now, featured, video_portfolio_urls, music_playlist_urls, presentation_video_url) VALUES
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', 'Lucas Volta', 'Sertanejo', 'SÃ£o Paulo', 'Cantor solo de sertanejo universitÃ¡rio, tocando o melhor do modÃ£o e hits atuais.', 2800.00, 4.9, 103000, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', true, false, true, ARRAY['https://www.youtube.com/watch?v=mock1', 'https://www.youtube.com/watch?v=mock2'], ARRAY['https://open.spotify.com/playlist/mock'], 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-41712-large.mp4'),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b2', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e4', 'Laxy Music', 'Pop', 'Rio de Janeiro', 'Show pop acÃºstico e eletrizante para animar noites de estabelecimentos e festas.', 2200.00, 4.7, 89000, 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop', true, true, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://assets.mixkit.co/videos/preview/mixkit-musician-playing-acoustic-guitar-41584-large.mp4'),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b3', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e5', 'Banda Nova Era', 'Rock', 'Belo Horizonte', 'Banda cover de clÃ¡ssicos do rock nacional e internacional.', 4500.00, 4.8, 67000, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', true, false, true, ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://assets.mixkit.co/videos/preview/mixkit-guitarist-performing-on-stage-at-a-concert-41589-large.mp4'),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b4', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e6', 'Sofia Neon', 'Pop', 'SÃ£o Paulo', 'Cantora e compositora pop, ideal para bares refinados e eventos intimistas.', 1800.00, 4.6, 54000, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', true, false, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-41712-large.mp4'),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b5', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e7', 'Dj Matteus', 'EletrÃ´nico', 'SÃ£o Paulo', 'Set moderno de house music, deep house e hits remixados.', 3200.00, 4.8, 112000, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', true, true, true, ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://assets.mixkit.co/videos/preview/mixkit-electronic-music-producer-working-in-his-studio-41724-large.mp4'),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b6', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e8', 'Trio Samba Amor', 'Samba', 'Rio de Janeiro', 'A essÃªncia do samba carioca e pagode noventista para animar seu final de semana.', 2500.00, 4.9, 78000, 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&h=400&fit=crop', true, false, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://assets.mixkit.co/videos/preview/mixkit-musician-playing-acoustic-guitar-41584-large.mp4')
ON CONFLICT DO NOTHING;

-- Seed musicas_repertorio
INSERT INTO public.musicas_repertorio (artista_id, titulo, artista_nome, duracao_seg) VALUES
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Erro Planejado', 'Luan Santana', 210),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Namorando Ou NÃ£o', 'Luan Santana', 195),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Zona de Perigo', 'Luan Santana', 200),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Aquela Pessoa', 'Henrique & Juliano', 185),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Rancorosa', 'Henrique & Juliano', 190),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'A Maior Saudade', 'Henrique & Juliano', 205),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Vai Dar PT', 'Guilherme & Benuto', 215),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'CoraÃ§Ã£o Na Cama', 'Hugo & Guilherme', 198),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'LeÃ£o', 'MarÃ­lia MendonÃ§a', 175),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Amava Nada', 'MarÃ­lia MendonÃ§a', 188),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Folgado', 'MarÃ­lia MendonÃ§a', 192),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'NÃ£o Me Envergonha', 'Gusttavo Lima', 202),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Bloqueado', 'Gusttavo Lima', 195),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Ficha Limpa', 'ZÃ© Neto & Cristiano', 210),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'NotificaÃ§Ã£o Preferida', 'ZÃ© Neto & Cristiano', 185),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Meu Bem', 'Jorge & Mateus', 178),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Cheirosa', 'Jorge & Mateus', 195),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Hackearam-Me', 'Jorge & Mateus', 200),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Canudinho', 'Simone Mendes', 188),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'Erro Gostoso', 'Simone Mendes', 192)
ON CONFLICT DO NOTHING;

-- Insert venue metadata
INSERT INTO public.venues (id, user_id, venue_name, city, address, capacity, bio, average_budget, logo_url) VALUES
('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c1', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'Bar do JoÃ£o', 'SÃ£o Paulo', 'Rua das Flores, 123 - Pinheiros', 250, 'O melhor bar com mÃºsica ao vivo da regiÃ£o de Pinheiros.', 8000.00, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop')
ON CONFLICT DO NOTHING;

-- Insert contractor metadata
INSERT INTO public.contractors (id, user_id, phone, preferences) VALUES
('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d1', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3', '+5511999999999', '{"preferred_genre": "Pop", "event_type": "Casamento"}')
ON CONFLICT DO NOTHING;

