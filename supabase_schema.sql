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
    rating NUMERIC(3, 2) DEFAULT 3.00,
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
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proposed', 'confirmed', 'completed', 'cancelled', 'rejected', 'pending_artist_approval')),
    fee_proposed NUMERIC(10, 2) NOT NULL,
    fee_agreed NUMERIC(10, 2),
    address TEXT NOT NULL,
    precisa_equipamento BOOLEAN DEFAULT false,
    quantidade_pessoas INTEGER DEFAULT 0,
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

-- 12. MUSICAS REPERTORIO TABLE (Banco global de músicas - artistas escolhem do repertório)
CREATE TABLE IF NOT EXISTS public.musicas_repertorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS precisa_equipamento BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS quantidade_pessoas INTEGER DEFAULT 0;
-- Update status CHECK constraint to include rejected and pending_artist_approval
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check CHECK (status IN ('pending', 'proposed', 'confirmed', 'completed', 'cancelled', 'rejected', 'pending_artist_approval'));

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
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'joao@gmail.com', 'João Silva', 'venue', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3', 'maria@gmail.com', 'Maria Santos', 'contractor', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e4', 'laxy@gmail.com', 'Laxy Music', 'artist', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e5', 'novaera@gmail.com', 'Banda Nova Era', 'artist', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e6', 'sofia@gmail.com', 'Sofia Neon', 'artist', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e7', 'matteus@gmail.com', 'Dj Matteus', 'artist', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e8', 'samba@gmail.com', 'Trio Samba Amor', 'artist', 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=200&h=200&fit=crop')
ON CONFLICT (email) DO NOTHING;

-- Insert artist metadata
INSERT INTO public.artists (id, user_id, artistic_name, genre, city, bio, base_fee, rating, followers, photo_url, verified, live_now, featured, video_portfolio_urls, music_playlist_urls, presentation_video_url) VALUES
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', 'Lucas Volta', 'Sertanejo', 'São Paulo', 'Cantor solo de sertanejo universitário, tocando o melhor do modão e hits atuais.', 2800.00, 4.9, 103000, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', true, false, true, ARRAY['https://www.youtube.com/watch?v=mock1', 'https://www.youtube.com/watch?v=mock2'], ARRAY['https://open.spotify.com/playlist/mock'], 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-41712-large.mp4'),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b2', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e4', 'Laxy Music', 'Pop', 'Rio de Janeiro', 'Show pop acústico e eletrizante para animar noites de estabelecimentos e festas.', 2200.00, 4.7, 89000, 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop', true, true, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://assets.mixkit.co/videos/preview/mixkit-musician-playing-acoustic-guitar-41584-large.mp4'),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b3', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e5', 'Banda Nova Era', 'Rock', 'Belo Horizonte', 'Banda cover de clássicos do rock nacional e internacional.', 4500.00, 4.8, 67000, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', true, false, true, ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://assets.mixkit.co/videos/preview/mixkit-guitarist-performing-on-stage-at-a-concert-41589-large.mp4'),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b4', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e6', 'Sofia Neon', 'Pop', 'São Paulo', 'Cantora e compositora pop, ideal para bares refinados e eventos intimistas.', 1800.00, 4.6, 54000, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', true, false, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-41712-large.mp4'),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b5', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e7', 'Dj Matteus', 'Eletrônico', 'São Paulo', 'Set moderno de house music, deep house e hits remixados.', 3200.00, 4.8, 112000, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', true, true, true, ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://assets.mixkit.co/videos/preview/mixkit-electronic-music-producer-working-in-his-studio-41724-large.mp4'),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b6', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e8', 'Trio Samba Amor', 'Samba', 'Rio de Janeiro', 'A essência do samba carioca e pagode noventista para animar seu final de semana.', 2500.00, 4.9, 78000, 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&h=400&fit=crop', true, false, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://assets.mixkit.co/videos/preview/mixkit-musician-playing-acoustic-guitar-41584-large.mp4')
ON CONFLICT DO NOTHING;

-- Seed musicas_repertorio (banco global - todos os artistas escolhem do mesmo repertório)
INSERT INTO public.musicas_repertorio (titulo, artista_nome, genero, duracao_seg) VALUES
('Erro Planejado', 'Luan Santana', 'Sertanejo', 210),
('Namorando Ou Não', 'Luan Santana', 'Sertanejo', 195),
('Zona de Perigo', 'Luan Santana', 'Sertanejo', 200),
('Mordaça', 'Luan Santana', 'Sertanejo', 198),
('Lua Cheia', 'Luan Santana', 'Sertanejo', 205),
('Aquela Pessoa', 'Henrique & Juliano', 'Sertanejo', 185),
('Rancorosa', 'Henrique & Juliano', 'Sertanejo', 190),
('A Maior Saudade', 'Henrique & Juliano', 'Sertanejo', 205),
('Vai Dar PT', 'Guilherme & Benuto', 'Sertanejo', 215),
('3 da Manhã', 'Guilherme & Benuto', 'Sertanejo', 188),
('Coração Na Cama', 'Hugo & Guilherme', 'Sertanejo', 198),
('Leão', 'Marília Mendonça', 'Sertanejo', 175),
('Amava Nada', 'Marília Mendonça', 'Sertanejo', 188),
('Folgado', 'Marília Mendonça', 'Sertanejo', 192),
('Todo Mundo Menos Você', 'Marília Mendonça', 'Sertanejo', 195),
('Agora É Tarde', 'Marília Mendonça', 'Sertanejo', 202),
('Não Me Envergonha', 'Gusttavo Lima', 'Sertanejo', 202),
('Bloqueado', 'Gusttavo Lima', 'Sertanejo', 195),
('Cem Anos', 'Gusttavo Lima', 'Sertanejo', 210),
('Balada', 'Gusttavo Lima', 'Sertanejo', 205),
('Alô', 'Gusttavo Lima', 'Sertanejo', 198),
('Lancinho', 'Gusttavo Lima', 'Sertanejo', 188),
('Nota de Real', 'Zé Neto & Cristiano', 'Sertanejo', 195),
('Foto de Couchê', 'Zé Neto & Cristiano', 'Sertanejo', 188),
('Fake News', 'Zé Neto & Cristiano', 'Sertanejo', 202),
('Manifesto', 'Zé Neto & Cristiano', 'Sertanejo', 198),
('Largadouro', 'Zé Neto & Cristiano', 'Sertanejo', 185),
('Recairei', 'Zé Neto & Cristiano', 'Sertanejo', 192),
('Meu Bem', 'Jorge & Mateus', 'Sertanejo', 178),
('Cheirosa', 'Jorge & Mateus', 'Sertanejo', 195),
('Hackearam-Me', 'Jorge & Mateus', 'Sertanejo', 200),
('Da Vontade', 'Jorge & Mateus', 'Sertanejo', 185),
('Insalubre', 'Jorge & Mateus', 'Sertanejo', 192),
('Controle Remoto', 'Jorge & Mateus', 'Sertanejo', 198),
('Propaganda', 'Jorge & Mateus', 'Sertanejo', 205),
('Canudinho', 'Simone Mendes', 'Sertanejo', 188),
('Erro Gostoso', 'Simone Mendes', 'Sertanejo', 192),
('Inesquecível', 'Simone Mendes', 'Sertanejo', 195),
('Graveto', 'Simone Mendes', 'Sertanejo', 188),
('Volta Com Você', 'Simone Mendes', 'Sertanejo', 202),
('Mequetrefe', 'Simone Mendes', 'Sertanejo', 190),
('Oi Tchau', 'João Gomes', 'Sertanejo', 195),
('Dói', 'João Gomes', 'Sertanejo', 188),
('Jardim', 'João Gomes', 'Sertanejo', 202),
('Rapadura', 'João Gomes', 'Sertanejo', 198),
('Coração Dividido', 'Kayky', 'Sertanejo', 185),
('Corno Forte', 'Kayky', 'Sertanejo', 192),
('Agora eu sei', 'Kayky', 'Sertanejo', 188),
('Malvado', 'Kayky', 'Sertanejo', 195),
('Bebas', 'Mari Fernandez', 'Sertanejo', 188),
('Manda', 'Mari Fernandez', 'Sertanejo', 195),
('Eu Vousso', 'Mari Fernandez', 'Sertanejo', 202),
('Vontade de Morder', 'Mari Fernandez', 'Sertanejo', 190),
('Fala Malandra', 'Luísa Sonza', 'Sertanejo', 195),
('Penhasco', 'Luísa Sonza', 'Sertanejo', 202),
('Bombonzinho', 'Luísa Sonza', 'Sertanejo', 188),
('A Usina', 'Teto', 'Sertanejo', 195),
('Quando Eu Era Belo', 'Teto', 'Sertanejo', 202),
('Bebida e Console', 'Teto', 'Sertanejo', 198),
('Barbie', 'Teto', 'Sertanejo', 185),
('Deu Onde?', 'Lula', 'Sertanejo', 192),
('Mete a Mão', 'Lula', 'Sertanejo', 188),
('Tremendo', 'Lula', 'Sertanejo', 195),
('Sextou', 'Tiago Nova', 'Sertanejo', 202),
('Pedaço de mim', 'Tiago Nova', 'Sertanejo', 198),
('Maldivas', 'Ana Castela', 'Sertanejo', 195),
('Surtida', 'Ana Castela', 'Sertanejo', 188),
('Bipolar', 'Ana Castela', 'Sertanejo', 192),
('Larguei', 'Ana Castela', 'Sertanejo', 185),
('Campo de Batata', 'Japarote', 'Sertanejo', 198),
('Xote das Maid', 'Wesley Safadão', 'Sertanejo', 205),
('Garota Vip', 'Wesley Safadão', 'Sertanejo', 195),
('Ninguém É de Nadie', 'Wesley Safadão', 'Sertanejo', 188),
('O Business', 'MC Don Juan', 'Funk', 210),
('Raia D''Agua', 'MC Don Juan', 'Funk', 195),
('Tubarões', 'Raffael', 'Funk', 202),
('Bumbum', 'Mc Jhow', 'Funk', 185),
('Evidências', 'Chitãozinho & Xororó', 'Sertanejo', 195),
('Fio Dental', 'Ricky Martin', 'Sertanejo', 188),
('Coração Maldito', 'Wesley Safadão', 'Sertanejo', 202),
('Atrasadinha', 'Ferrugem', 'Sertanejo', 195),
('Deixa Comigo', 'Wesley Safadão', 'Sertanejo', 198),
('Tô Lorado', 'Pablo', 'Sertanejo', 210),
('Nega', 'Pablo', 'Sertanejo', 185),
('Beijinho no Ombro', 'Wesley Safadão', 'Sertanejo', 188),
('Quer Namorar Comigo', 'Hugo & Guilherme', 'Sertanejo', 195),
('Sinal dos Jogos', 'Marília Mendonça', 'Sertanejo', 202),
('Todo Mundo Vai Gritar', 'Wesley Safadão', 'Sertanejo', 195),
('Chamegot', 'Wesley Safadão', 'Sertanejo', 198),
('Chora no Corote', 'Wesley Safadão', 'Sertanejo', 202),
('Paredão', 'Wesley Safadão', 'Sertanejo', 188),
('Sereia', 'Wesley Safadão', 'Sertanejo', 195),
('Resenha', 'Wesley Safadão', 'Sertanejo', 202),
('Minha Sereira', 'Wesley Safadão', 'Sertanejo', 198),
('Louca', 'Jesse & Mc', 'Sertanejo', 185),
('Gordinha', 'Gusttavo Lima', 'Sertanejo', 192),
('10 Anos', 'César Menotti & Fabiano', 'Sertanejo', 198),
('adeira do Meu Pai', 'Bruno & Marrone', 'Sertanejo', 195),
('Vou Rangá', 'Hugo & Guilherme', 'Sertanejo', 188),
('Coração Errante', 'Eduardo Costa', 'Sertanejo', 205),
('Guitarra e Violão', 'Daniel', 'Sertanejo', 192),
('Eu Sem Você', 'Leonardo', 'Sertanejo', 198),
('Tá Rindo de Quê', 'Marília Mendonça', 'Sertanejo', 185),
('Banda do João', 'João Gomes', 'Sertanejo', 190),
('Meteori', 'João Gomes', 'Sertanejo', 195)
ON CONFLICT DO NOTHING;

-- Insert venue metadata
INSERT INTO public.venues (id, user_id, venue_name, city, address, capacity, bio, average_budget, logo_url) VALUES
('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c1', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'Bar do João', 'São Paulo', 'Rua das Flores, 123 - Pinheiros', 250, 'O melhor bar com música ao vivo da região de Pinheiros.', 8000.00, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop')
ON CONFLICT DO NOTHING;

-- Insert contractor metadata
INSERT INTO public.contractors (id, user_id, phone, preferences) VALUES
('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d1', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3', '+5511999999999', '{"preferred_genre": "Pop", "event_type": "Casamento"}')
ON CONFLICT DO NOTHING;
