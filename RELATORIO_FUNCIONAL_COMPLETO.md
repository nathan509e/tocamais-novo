# TocaMais — Relatório Funcional Completo

> Gerado em 31/07/2026. Cobre funcionalidades, painéis/dashboards, navegação, telas e botões do app **como ele existe hoje** no código-fonte (`/home/david/tocamais-novo`, commit `dce5f01`). Serve como mapa de referência para decidir evolução do produto. Complementa `ESTADO_ATUAL_E_RESTAURACAO.md` (arquitetura técnica e pontos de restauração).

---

## 1. Visão geral

TocaMais conecta 4 perfis de usuário numa mesma plataforma:

- **Artista/DJ** — recebe pedidos de música com gorjeta via PIX durante o show, gerencia agenda e repertório, recebe propostas de shows.
- **Casa de Show (venue)** — contrata artistas, gerencia propostas enviadas e shows confirmados.
- **Contratante** — pessoa física que contrata artistas pra eventos privados (casamento, aniversário, etc.).
- **Admin** — gestão de usuários da plataforma e visão financeira de pagamentos.

Cada perfil tem seu próprio dashboard e conjunto de telas, todos dentro do mesmo `AppLayout` (navegação compartilhada que muda conforme o `role` do usuário logado).

---

## 2. Navegação geral

```
ENTRADA NO APP ("/")
  │
  ├─ carregando sessão → tela de loading (spinner "T")
  │
  ├─ NÃO autenticado
  │     ├─ app nativo (Capacitor) OU PWA instalado → redireciona direto pra /login
  │     └─ navegador comum → mostra Landing (marketing)
  │
  │     rotas públicas: /login · /artist/tip/:artistId (pedido+gorjeta sem login)
  │                     /privacidade · /termos · /landing
  │
  └─ autenticado → redireciona pro dashboard padrão do role:
        admin → /admin · artist → /artist · venue → /venue · contractor → /contractor
```

⚠️ **Todas as rotas de todos os perfis ficam registradas ao mesmo tempo** — não há bloqueio de role-guard. Um artista digitando `/admin` na URL consegue navegar lá manualmente (a separação é só por redirecionamento de dashboard padrão + itens de menu, não por permissão real de rota).

### Rotas por perfil

**Artista**: `/artist` (painel) · `/artist/agenda` · `/artist/proposals` · `/artist/requests` · `/artist/repertorio` · `/artist/messages` · `/artist/profile` · `/artist/onboarding` · `/artist/tip/:id` (pública) · `/artist/mini-profile` · `/artist/metrics` (existe mas fora do menu)

**Casa de Show**: `/venue` (painel) · `/venue/artists` · `/venue/schedule` · `/venue/messages`

**Contratante**: `/contractor` (painel) · `/contractor/search` · `/contractor/favorites` · `/contractor/profile` · `/contractor/messages`

**Admin**: `/admin` (painel) · `/admin/orders`

**Compartilhadas**: `/search` `/live` `/profile` (placeholders vazios, não usados) · `/messages` · `*` → 404

---

## 3. Autenticação

- **Login/Cadastro** (`Login.jsx`): um único formulário alterna entre os dois modos. Cadastro pede Nome, Telefone (opcional), E-mail, Senha, e escolha visual de perfil (Artista/Casa Show/Contratante — 3 botões). **Não há recuperação de senha nem login social**, apesar de existir infraestrutura OAuth Google no projeto (usada só pra Google Calendar).
- Perfil é criado automaticamente na tabela correspondente (`artists`/`venues`/`contractors`) no primeiro login, com valores padrão.
- **Logout**: botão "Sair da Conta" no menu lateral/drawer, ou botão de logout no header mobile.
- **Ser Pro expira sem checagem automática**: existe uma coluna `pro_expires_at` no banco pra isso, mas **não há verificação client-side no login** — a revogação só acontece de forma reativa via webhook do Asaas quando a assinatura é cancelada do lado deles. Ver seção de gaps.

---

## 4. Sistema "Ser Pro" (assinatura, cross-perfil)

Botão "Ser Pro" no header (coroa, gradiente roxo→verde), some quando o usuário já é Pro. Abre modal com dois caminhos:

- **iOS (nativo)**: StoreKit 2 via `cordova-plugin-purchase`. Botões "Assinar Mensal" e "Restaurar Compras". Recibo validado no backend (edge function `apple-iap`).
- **Web/Android**: exige CPF válido, botão "Assinar Agora" gera PIX (Asaas, modo assinatura) com QR code + código copia-e-cola. Confirmação por tempo real + polling a cada 3s; ao confirmar, mostra confete 🎉 e tela de sucesso.

Preço: R$49,90/mês. Benefício principal pro artista: recebe 100% das gorjetas direto na própria chave PIX (não-Pro recebe 70%, TocaMais fica com 30% via split Asaas).

---

## 5. Perfil Artista — painéis e telas

### Painel (`/artist` — ArtistDashboard)
Toggle "Ao Vivo" · card de gorjetas do dia/mês · card "Maior Doador da Noite" · fila de pedidos pendentes com botões **Tocar** / **Arquivar** / **Excluir** · auto-refresh liga/desliga · auto-arquivamento de pedidos tocados após 1 minuto.

### Agenda (`/artist/agenda`) — a tela mais complexa do app
Calendário mensal colorido por status (verde=confirmado, amarelo=proposta pendente, vermelho=bloqueio manual, azul=bloqueio do Google) · botão **Bloquear/Desbloquear Data** com tipo (dia inteiro ou horário específico) + nota · painel de **sincronização bidirecional com Google Calendar** (conectar, escolher agenda de destino, importar bloqueios, exportar shows confirmados, sincronizar automaticamente) · modal de detalhes de cada show.

### Propostas (`/artist/proposals`)
Cards de propostas recebidas com botões **Aceitar** / **Recusar** / **Mostrar Detalhes**.

### Pedidos (`/artist/requests`)
Versão completa da fila de pedidos, com filtros (status/gorjeta/período), métricas (total recebido, pendente, quantidade de gorjetas), som de notificação em novos pedidos durante auto-refresh.

### Repertório (`/artist/repertorio`)
Gestão de setlists nomeadas (criar, ativar uma por vez, editar músicas de cada uma, excluir) + banco geral de músicas com busca e seleção por toggle + importação em massa via `.txt`.

### Perfil (`/artist/profile`)
Edição de foto/capa (com crop), nome, bio, gênero, cidade, cachê base, chave PIX · botão **Meu QR Code** · card de recebimento (chave PIX direta se Pro, ou conexão Asaas Wallet se não-Pro) · vídeo de apresentação (upload ou link) · checklist de verificação com botão **Reivindicar Selo de Verificado** · botão **Excluir Minha Conta Permanentemente**.

### Pedido + Gorjeta (`/artist/tip/:artistId`) — pública, sem login
A tela mais importante do ponto de vista de negócio. Fluxo: nome → escolher música do repertório → mensagem opcional → **Adicionar Gorjeta** ou **Fazer Apenas o Pedido sem Gorjeta** → valor (botões rápidos R$5/10/20/50/100) → PIX (QR code + copia-e-cola) → confirmação (automática via Asaas ou manual "Já fiz a transferência" se artista Pro) → agradecimento final.

### Onboarding (`/artist/onboarding`)
Wizard de 4 etapas (3 se Pro): conectar Asaas Wallet ID → fotos → vídeo → repertório. Ao completar tudo, marca `verified: true` automaticamente.

### Métricas (`/artist/metrics`) — existe mas não está no menu
Cards de seguidores/cachês/avaliação/shows, gráfico de cidades, "músicas mais tocadas" e "score de performance" — ⚠️ **parcialmente com dados simulados**, não refletem uso real.

---

## 6. Perfil Casa de Show — painéis e telas

### Painel Executivo (`/venue` — VenueDashboard, a maior tela do app)
Duas abas (Painel / Shows Agendados). Edição de perfil inline · card "Investimento ao Vivo" · métricas (algumas reais, algumas simuladas) · lista de propostas enviadas com status · painel de filtros avançados (gênero, cidade, avaliação, cachê, verificados) · gráficos (⚠️ dados **mockados fixos**, não refletem o negócio real) · carrossel de artistas em destaque · lista de artistas recomendados com botões **Ver Perfil** / **Contratar Show**.

**Fluxo de contratação de 5 etapas** (modal): Detalhes do evento → Negociação/Chat (⚠️ simulado, não persiste) → Assinatura digital (nome) → Pagamento (PIX/Cartão/Boleto via Asaas) → Sucesso. ⚠️ Este fluxo **não verifica conflito de agenda** do artista antes de criar o evento (diferente dos outros dois fluxos de contratação do app).

### Encontrar Artistas (`/venue/artists`)
Busca com filtros (gênero, avaliação, cachê). Modal de contratação **simples** (1 etapa: formulário → enviar → sucesso) — este sim valida conflito de agenda contra bloqueios e outros eventos do artista.

### Agenda de Shows (`/venue/schedule`)
Lista somente-leitura de eventos, filtro por status. ⚠️ Botão "Novo evento" existe visualmente mas **não tem ação implementada**.

---

## 7. Perfil Contratante — painéis e telas

### Painel (`/contractor` — ContractorDashboard)
Busca de artistas · seleção de "Tipo de Evento" (6 categorias — ⚠️ selecionar não filtra a lista de artistas, é só decorativo/contextual) · propostas enviadas e shows agendados · "Playlist do Evento" (⚠️ mock local, não persiste no banco) · "Meus Favoritos" (via localStorage) · modal de booking simples (mesma validação de conflito de agenda do `VenueArtists`).

### Buscar Artistas (`/contractor/search`)
Busca dedicada; ao contratar, navega de volta pro Painel que abre o modal automaticamente.

### Favoritos (`/contractor/favorites`)
⚠️ **Bug**: nunca carrega os favoritos salvos no `localStorage` (diferente do Painel, que usa a mesma chave) — a tela fica sempre vazia na prática, mesmo com favoritos salvos.

### Perfil (`/contractor/profile`)
Edição de foto/nome/telefone/endereço/cidade. ⚠️ Stats (contratações, avaliações, total gasto) são **fixos em zero**, não vêm do banco. Botão **Excluir Minha Conta Permanentemente**.

---

## 8. Perfil Admin — painéis e telas

### Painel de Gestão (`/admin` — AdminDashboard)
Lista de todos os usuários com busca/filtro por papel. Ficha do usuário selecionado com botões: **Tornar Artista PRO** / remover, **Atribuir Selo Verificado** / remover, **Ver Gorjetas** (leva pra AdminOrders com busca pré-preenchida), **Excluir Conta Permanentemente**.

### Pedidos e Pagamentos (`/admin/orders`)
Duas abas: Gorjetas Recebidas e Assinantes PRO. Stats (total gorjetas, repassado, aguardando repasse). Filtros por status/busca/ordenação. Cada gorjeta mostra o split 70/30 (artista/plataforma) e botão **Copiar** chave PIX. Paginação de 25 itens.

---

## 9. Telas compartilhadas

- **Mensagens** (`MessagesPage`, usada por todos os perfis): lista de conversas + chat interno (bolhas de mensagem, envio por Enter). Alimentada automaticamente sempre que uma proposta de contratação é enviada.
- **Search / Live / Profile** (rotas genéricas na raiz): ⚠️ **placeholders vazios** ("Search Page (Placeholder)" etc.) — não implementados. As versões reais e funcionais de busca/perfil vivem dentro de cada perfil (`venue/VenueArtists`, `contractor/ContractorSearch` etc.); "Live" (transmissão ao vivo) não tem nenhuma tela implementada.
- **Landing** (marketing, não logado): hero, "Como Funciona", planos (Grátis/Artista Pro/Estabelecimento), FAQ, seção de experiência física (table tents). ⚠️ Botão "App Store" é só um alerta "Em breve"; botões "Web App" e "Fale com a gente" navegam pra `/explore`, **rota que não existe** no roteador atual.
- **Política de Privacidade** e **Termos de Uso**: conteúdo institucional completo, cobre uso de dados do Google Calendar.
- **404**: usa um sistema de autenticação antigo (Base44) que não é mais o real do projeto — a "nota de admin" que deveria aparecer nela provavelmente nunca dispara.

---

## 10. Observações e gaps — o que considerar para evoluir o app

Esta seção consolida tudo que as 3 investigações encontraram como **incompleto, simulado, quebrado ou inconsistente** — é o ponto de partida mais direto para decidir prioridades de evolução:

### Dados simulados/mockados (parecem reais mas não são)
- Gráficos financeiros do `VenueDashboard` (Fluxo de Caixa, Ocupação) — dados fixos, não vêm do banco.
- "Gorjetas Extras" e parte das métricas do `VenueDashboard`.
- "Músicas Mais Tocadas" e "Score de Performance" em `ArtistMetrics`.
- Stats do `ContractorProfile` (Contratações/Avaliações/Total gasto sempre zero).
- Chat de "Negociação" na etapa 2 do fluxo de 5 etapas do venue — simulado, não persiste.
- "Playlist do Evento" no painel do contratante — só local, não salva no banco.
- `budgetTiers` (faixas de orçamento por tipo de evento) definido no código do `ContractorDashboard` mas nunca conectado à UI.

### Bugs/inconsistências encontradas
- `ContractorFavorites.jsx` nunca lê o `localStorage`, fica sempre vazia mesmo com favoritos salvos.
- Botão "Novo evento" em `VenueSchedule.jsx` sem ação.
- Landing page linka pra `/explore`, rota que não existe.
- Botão "App Store" na Landing é só um alerta, sem link real.
- `ArtistMiniProfile.jsx` tem um modal de QR Code com imports faltando (`QRCodeSVG`, `X`) — quebraria se fosse alcançável, mas parece código morto sem botão que o ative.
- Fluxo de contratação de 5 etapas do `VenueDashboard` não valida conflito de agenda antes de criar o evento — diferente dos outros 2 fluxos de contratação do app, que validam.
- Expiração do "Ser Pro" (`pro_expires_at`) não é checada no login — só reage a webhook do Asaas.

### Funcionalidade duplicada/fragmentada
- **3 fluxos de contratação diferentes** coexistindo: modal simples (VenueArtists/ContractorDashboard), e o fluxo completo de 5 etapas (VenueDashboard) — mesma ação, jornadas materialmente diferentes.
- Lógica de verificação de conflito de agenda copiada quase idêntica em 2 lugares (`VenueArtists`, `ContractorDashboard`).
- Página `ArtistMiniProfile.jsx` parece uma versão antiga/alternativa do perfil público, não referenciada no menu — provável vestígio.
- Páginas órfãs na raiz de `src/pages/` (ArtistDashboard, BarOwnerDashboard, ContractorDashboard, Dashboard) que duplicam nome com as versões reais dentro de `artist/venue/contractor/` — não são usadas em nenhuma rota.
- `Search.jsx`, `Live.jsx`, `Profile.jsx` são stubs vazios não conectados a nada.

### Não implementado / faltando
- Recuperação de senha ("esqueci minha senha") na tela de Login.
- Login social (Google/Apple) apesar da infraestrutura OAuth já existir no projeto (hoje só usada pra Google Calendar).
- Tela "Live" (transmissão ao vivo) — rota existe, tela não.
- Verificação client-side de expiração do plano Pro.
- Papel/role-guard real nas rotas (hoje é só redirecionamento de conveniência, não bloqueio de acesso).

---

## 11. Como usar este documento

Junto com `ESTADO_ATUAL_E_RESTAURACAO.md` (arquitetura técnica, stack real, pontos de restauração), este relatório dá o quadro completo pra decidir prioridades: o que consertar (bugs/gaps), o que finalizar (dados mockados que precisam virar reais), o que é redundante (fluxos duplicados, código morto) e o que falta criar do zero (Live, recuperação de senha, etc.) antes de tratar o app como pronto para escala de mercado.
