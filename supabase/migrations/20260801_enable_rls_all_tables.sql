-- Habilita Row Level Security em todas as tabelas públicas que estavam
-- desprotegidas (confirmado via `supabase db advisors` em 01/08/2026:
-- agendas, artists, contractors, events, favorites, messages,
-- musicas_repertorio, notifications, reviews, users, venues).
-- Sem isso, a chave anon (pública, embutida no bundle do site) tinha
-- acesso irrestrito de leitura E escrita a todas essas tabelas, sem
-- necessidade de login.
--
-- Políticas desenhadas a partir do mapeamento real de uso no código
-- (todo `.from('tabela')` em src/ e supabase/functions/), para não
-- quebrar nenhum fluxo existente. Edge functions usam
-- SUPABASE_SERVICE_ROLE_KEY e ignoram RLS, não são afetadas.

-- Helper: checa se o usuário autenticado é admin, sem recursão de RLS
-- (SECURITY DEFINER roda com privilégio elevado, ignorando a própria
-- política de SELECT de `users` ao fazer essa checagem interna).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- agendas — bloqueios de agenda do artista
-- ============================================================
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;

-- Leitura ampla necessária: venue/contractor precisam checar
-- disponibilidade de um artista terceiro antes de enviar proposta
-- (src/lib/useHireArtist.js).
CREATE POLICY "agendas_select_authenticated" ON public.agendas
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "agendas_insert_own" ON public.agendas
  FOR INSERT TO authenticated
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "agendas_update_own" ON public.agendas
  FOR UPDATE TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "agendas_delete_own" ON public.agendas
  FOR DELETE TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

-- ============================================================
-- artists — perfil público de artista (vitrine)
-- ============================================================
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- Público mesmo (inclusive anon): ArtistTip.jsx é página sem login.
CREATE POLICY "artists_select_public" ON public.artists
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "artists_insert_own" ON public.artists
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin pode atualizar qualquer artista (AdminDashboard: is_pro, verified).
CREATE POLICY "artists_update_own_or_admin" ON public.artists
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "artists_delete_own" ON public.artists
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- contractors — perfil de contratante particular
-- ============================================================
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

-- Leitura ampla: artista lê dados do contratante que lhe enviou
-- proposta (ArtistProposals.jsx, ArtistAgenda.jsx, MessagesPage.jsx).
CREATE POLICY "contractors_select_authenticated" ON public.contractors
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "contractors_insert_own" ON public.contractors
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "contractors_update_own" ON public.contractors
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "contractors_delete_own" ON public.contractors
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- venues — perfil de casa de show
-- ============================================================
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Leitura ampla: artista lê dados da venue que lhe enviou proposta.
CREATE POLICY "venues_select_authenticated" ON public.venues
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "venues_insert_own" ON public.venues
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "venues_update_own" ON public.venues
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "venues_delete_own" ON public.venues
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- events — propostas/shows (artist_id, venue_id, contractor_id)
-- ============================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Só as partes envolvidas enxergam o evento.
CREATE POLICY "events_select_involved" ON public.events
  FOR SELECT TO authenticated
  USING (
    artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid())
    OR venue_id IN (SELECT id FROM public.venues WHERE user_id = auth.uid())
    OR contractor_id IN (SELECT id FROM public.contractors WHERE user_id = auth.uid())
  );

-- Quem contrata (venue ou contractor) cria o evento; artist_id é de
-- um terceiro (o artista sendo contratado), só precisa ser válido.
CREATE POLICY "events_insert_hirer" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    venue_id IN (SELECT id FROM public.venues WHERE user_id = auth.uid())
    OR contractor_id IN (SELECT id FROM public.contractors WHERE user_id = auth.uid())
  );

-- UPDATE/DELETE: o client hoje filtra só por `id` em vários lugares
-- (ArtistProposals.jsx, VenueDashboard.jsx, ContractorDashboard.jsx)
-- sem repetir o dono — a RLS é a única barreira real aqui.
CREATE POLICY "events_update_involved" ON public.events
  FOR UPDATE TO authenticated
  USING (
    artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid())
    OR venue_id IN (SELECT id FROM public.venues WHERE user_id = auth.uid())
    OR contractor_id IN (SELECT id FROM public.contractors WHERE user_id = auth.uid())
  )
  WITH CHECK (
    artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid())
    OR venue_id IN (SELECT id FROM public.venues WHERE user_id = auth.uid())
    OR contractor_id IN (SELECT id FROM public.contractors WHERE user_id = auth.uid())
  );

CREATE POLICY "events_delete_involved" ON public.events
  FOR DELETE TO authenticated
  USING (
    artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid())
    OR venue_id IN (SELECT id FROM public.venues WHERE user_id = auth.uid())
    OR contractor_id IN (SELECT id FROM public.contractors WHERE user_id = auth.uid())
  );

-- ============================================================
-- messages — chat direto entre duas partes
-- ============================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "messages_insert_as_sender" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Sem UPDATE/DELETE: não usados em nenhum lugar do app hoje.

-- ============================================================
-- notifications — sempre endereçadas a um destinatário (user_id)
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT precisa ficar aberto: proposta de show (venue/contractor ->
-- artista) e pedido de música na página pública sem login
-- (ArtistTip.jsx) sempre criam notificação para OUTRA pessoa.
CREATE POLICY "notifications_insert_anyone" ON public.notifications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- users — perfil base (id = auth.users.id)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ler outros usuários (nome/role aparecem
-- em MessagesPage.jsx e nos joins de busca de artista) — email fica
-- tecnicamente visível também; ainda assim é uma redução drástica
-- frente ao estado anterior (tabela 100% pública, sem exigir login).
CREATE POLICY "users_select_authenticated" ON public.users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own_or_admin" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- AdminDashboard.jsx deleta usuários e NÃO tem guarda de rota no
-- front-end — isso precisa ser admin-only de verdade, via RLS.
CREATE POLICY "users_delete_admin_only" ON public.users
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================
-- favorites — órfã (app usa localStorage hoje), trava por precaução
-- ============================================================
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_all_own" ON public.favorites
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- reviews — órfã (funcionalidade de avaliação não implementada ainda)
-- ============================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- ============================================================
-- musicas_repertorio — catálogo global compartilhado (sem dono)
-- ============================================================
ALTER TABLE public.musicas_repertorio ENABLE ROW LEVEL SECURITY;

-- Público: ArtistTip.jsx (pedido de música) lê sem login.
CREATE POLICY "musicas_repertorio_select_public" ON public.musicas_repertorio
  FOR SELECT TO anon, authenticated
  USING (true);

-- Catálogo compartilhado: qualquer autenticado pode adicionar música
-- nova (artistas fazem isso ao montar repertório). Sem UPDATE/DELETE,
-- não usados em nenhum lugar do app.
CREATE POLICY "musicas_repertorio_insert_authenticated" ON public.musicas_repertorio
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- Correção de bug pré-existente: music_requests já tinha RLS
-- habilitado, mas as políticas comparavam `artist_id = auth.uid()`.
-- artist_id referencia artists.id (UUID própria), não o user_id do
-- login — a política nunca batia e bloqueava o próprio artista.
-- ============================================================
DROP POLICY IF EXISTS "select_artist" ON public.music_requests;
DROP POLICY IF EXISTS "update_artist" ON public.music_requests;
DROP POLICY IF EXISTS "delete_artist" ON public.music_requests;

CREATE POLICY "music_requests_select_own_artist" ON public.music_requests
  FOR SELECT TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "music_requests_update_own_artist" ON public.music_requests
  FOR UPDATE TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "music_requests_delete_own_artist" ON public.music_requests
  FOR DELETE TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));
