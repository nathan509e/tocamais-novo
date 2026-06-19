CREATE TABLE music_requests (
  id BIGSERIAL PRIMARY KEY,
  artist_id UUID NOT NULL,
  user_name TEXT,
  musica_id UUID,
  musica_titulo TEXT NOT NULL,
  musica_artista TEXT,
  status TEXT DEFAULT 'pending',
  pix_payment_id TEXT,
  pix_status TEXT,
  amount NUMERIC DEFAULT 0,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  message TEXT,
  rating INTEGER
);

ALTER TABLE music_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_anyone" ON music_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "select_artist" ON music_requests
  FOR SELECT USING (artist_id = auth.uid());

CREATE POLICY "update_artist" ON music_requests
  FOR UPDATE USING (artist_id = auth.uid());

CREATE POLICY "delete_artist" ON music_requests
  FOR DELETE USING (artist_id = auth.uid());
