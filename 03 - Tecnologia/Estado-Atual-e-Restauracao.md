# TocaMais — Estado Atual e Pontos de Restauração

> Documento gerado em 30/07/2026 como mapa de referência do projeto e registro dos pontos de restauração disponíveis. Sempre que uma alteração relevante for feita, crie um novo ponto de restauração e atualize este documento.

---

## 1. Pontos de restauração disponíveis AGORA

| O quê | Onde | Identificador |
|---|---|---|
| **Produção (arquivos ao vivo)** | `/var/www/tocamais-backup-20260801-item4b/` | Cópia completa de `/var/www/tocamais/` feita em 01/08/2026, logo após o deploy da consolidação dos 3 fluxos de contratação (item 4) (backups anteriores de 30/07, 31/07, `-item2`, `-item2b`, `-item3` e `-item4` também preservados) |
| **Código-fonte (repositório)** | Git local | Commit `67b0d6a` ("refactor: consolida os 3 fluxos de contratação de artista em um só (item 4)", 01/08/2026) — working tree limpo |
| **Edge Functions no Supabase** | Painel Supabase → Functions | `asaas-webhook` e `apple-iap` publicadas em 31/07/2026 com a correção de `pro_expires_at` (ver seção "Ser Pro" no Documento 02 - Product) |
| **GitHub remoto** | `https://github.com/nathan509e/tocamais-novo` (branch `main`) | Ainda **não sincronizado** — permissão de push pendente (ver seção 5) |

**Como restaurar a produção**, se algo der errado:
```bash
rm -rf /var/www/tocamais
cp -a /var/www/tocamais-backup-20260801-item4b /var/www/tocamais
```

Qualquer commit do histórico também pode virar produção a qualquer momento via `git checkout <commit>` + `npm run build`, já que a produção é 100% gerada a partir do repositório.

**Como restaurar o código-fonte** a este ponto exato, se necessário:
```bash
cd /home/david/tocamais-novo
git checkout 67b0d6a
```

**Supabase CLI**: instalado nesta VPS (`supabase` global via npm, v2.111.0), já vinculado ao projeto (`byghtatgozsthshmxaem`) usando o `SUPABASE_ACCESS_TOKEN` do `.env`. Pronto pra publicar novas Edge Functions no futuro via `supabase functions deploy <nome>`.

---

## 2. O que é o projeto

App de pedido de música ao vivo estilo jukebox/DJ, com apps para 4 perfis de usuário: **artista/DJ**, **casa de show**, **contratante** e **admin**. Fãs pedem músicas com gorjeta em PIX numa página pública (sem precisar de conta); o artista vê a fila de pedidos ordenada por valor de gorjeta.

- **App ID nativo**: `com.tocamais.app` ("Toca Mais")
- **Produção web**: `tocamais.app` (nginx, estático, `/var/www/tocamais`)
- **Apps nativos**: iOS (bundle 10) e Android (versão 2.0, defasado — não recebeu updates recentes)

---

## 3. Stack real (⚠️ diferente do que o README.md descreve)

O `README.md` do projeto é boilerplate do Base44 e está **desatualizado** — sugere que o app depende do backend hospedado no Base44. Isso não é verdade hoje:

- **Frontend**: React + Vite, Tailwind, componentes shadcn/Radix, TanStack Query.
- **Backend real**: **Supabase** (auth, banco de dados, Edge Functions em Deno) — não Base44.
- **Base44 SDK**: ainda está no `package.json` e em `src/api/base44Client.js`, mas é **vestigial** — o único lugar que ainda o usa é a página 404 (`src/lib/PageNotFound.jsx`), só pra mostrar uma nota administrativa de boilerplate. Pode ser considerado morto na prática.
- **Pagamento ativo**: **Asaas** (PIX, split 70% artista / 30% plataforma, assinatura recorrente). Existem também Edge Functions de **Stripe** e **Mercado Pago** no código — são **legado morto**, não usados (confirmado em `.mimo-context.md`, que documenta a migração/reversão pra Asaas). Cuidado pra não mexer nas integrações erradas achando que estão ativas.
- **Assinatura "Ser Pro"** (R$49,90/mês): dois caminhos coexistindo — Asaas (PIX recorrente) e **Apple In-App Purchase via StoreKit 2** (via `cordova-plugin-purchase`). O trabalho mais recente do repositório (últimos commits) foi justamente implementar esse fluxo de IAP da Apple.
- **Modo mock**: o app pode rodar sem Supabase real (`VITE_USE_MOCK=true`), usando um banco fake em memória/localStorage já com usuários de teste (`src/lib/supabaseClient.js`).

---

## 4. Mapa de páginas/funcionalidades (`src/App.jsx`)

| Perfil | Rota | Arquivo | O que faz |
|---|---|---|---|
| Público | `/artist/tip/:artistId` | `pages/artist/ArtistTip.jsx` | Página pública de pedido de música + gorjeta via PIX (sem login) |
| Artista | `/artist` | `pages/artist/ArtistDashboard.jsx` | Painel geral, ganhos, toggle "ao vivo" |
| Artista | `/artist/agenda` | `pages/artist/ArtistAgenda.jsx` (maior arquivo de UI, 1246 linhas) | Calendário, bloqueio de datas, sincronização Google Calendar |
| Artista | `/artist/requests` | `pages/artist/ArtistRequests.jsx` | Fila de pedidos de música ao vivo (pending→approved→playing→completed) |
| Artista | `/artist/proposals` | `pages/artist/ArtistProposals.jsx` | Propostas de shows recebidas |
| Artista | `/artist/repertorio` | `pages/artist/ArtistRepertorio.jsx` | Gestão de repertório/setlists |
| Artista | `/artist/onboarding` | `pages/artist/ArtistOnboarding.jsx` | Wizard: conectar Asaas → fotos → vídeo → repertório |
| Casa de show | `/venue` | `pages/venue/VenueDashboard.jsx` (maior página do repo, 1676 linhas) | Painel executivo, propostas, contratação de artistas |
| Contratante | `/contractor/*` | `pages/contractor/*` | Busca e contratação de artistas |
| Admin | `/admin`, `/admin/orders` | `pages/admin/*` | Gestão de usuários e pedidos PIX |

⚠️ **Páginas órfãs** (existem mas não são usadas em nenhuma rota): `pages/ArtistDashboard.jsx`, `pages/BarOwnerDashboard.jsx`, `pages/ContractorDashboard.jsx`, `pages/Dashboard.jsx` (na raiz de `pages/`, diferentes das versões dentro de `pages/artist|venue|contractor` que são as realmente usadas). Candidatas a limpeza, mas não foram tocadas.

---

## 5. ⚠️ Repositório local está atrás do GitHub

O commit local (`85279af`) está **2 commits atrás** de `origin/main` (`31915d8`). As mudanças que faltam puxar:
- `fix: codesign settings in Fastfile for SPM dependencies and gallery only flow`
- mudanças em `ios/App/App.xcodeproj/project.pbxproj`, `ios/App/App/Info.plist`, `ios/App/CapApp-SPM/Package.swift`, `ios/App/fastlane/Fastfile`, `package.json`, `src/components/shared/AppLayout.jsx`, `src/pages/artist/ArtistProfile.jsx`, `src/pages/artist/ArtistTip.jsx`

**A produção atual (`/var/www/tocamais`) reflete o commit local (`85279af`), não o do GitHub.** Ou seja: o site ao vivo está OK e consistente com o que temos localmente, mas existe trabalho no GitHub (provavelmente de outra máquina/colaborador) ainda não incorporado aqui. Antes de fazer `git pull`, vale confirmar com quem fez esses commits se é seguro trazer pra este ambiente.

---

## 6. Documentação existente no repo — confiabilidade

| Arquivo | Confiabilidade |
|---|---|
| `.mimo-context.md` | ✅ Mais confiável — changelog técnico detalhado, mas só vai até 02/07/2026 (não cobre Apple IAP, que é mais recente) |
| `README.md` | ❌ Desatualizado — descreve dependência do Base44 que não existe mais na prática |
| `CODEBASE_EXPLORATION.md`, `EXPLORATION_SUMMARY.txt`, `QUICK_REFERENCE.md` | ⚠️ Parcialmente desatualizados — descrevem Stripe/Mercado Pago como ativos (foram substituídos por Asaas) |
| `GOOGLE_CALENDAR_INTEGRATION.md`, `README_GOOGLE_CALENDAR.md`, `BACKEND_IMPLEMENTATION.md` | ⚠️ Descrevem a integração corretamente em termos de código, mas não confirmam se está de fato ativa em produção (precisa checar Supabase) |
| `RELATORIO_IMPLEMENTACAO.md/.pdf` | ⚠️ Relatório de cliente, não cobre "Ser Pro" nem Apple IAP |

---

## 7. Variáveis de ambiente esperadas (sem expor valores reais)

**Frontend (`.env`, prefixo `VITE_`)**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_SECRET`, `VITE_USE_MOCK`, `VITE_BASE44_APP_ID`/`VITE_BASE44_APP_BASE_URL`/`VITE_BASE44_FUNCTIONS_VERSION` (legado, provavelmente dispensável).

**Edge Functions (Secrets do Supabase, não no `.env` local)**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ASAAS_API_KEY`, `ASAAS_DEFAULT_CUSTOMER`, `ASAAS_WEBHOOK_TOKEN`, `STRIPE_SECRET_KEY` (legado), `MERCADO_PAGO_ACCESS_TOKEN` (legado), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PUBLIC_APP_URL`.

O `.env` local existe e está corretamente no `.gitignore` — não foi lido.

---

## 8. Build, deploy e apps nativos

- **Build web**: `npm run build` → `dist/`. **Não há script de deploy automatizado no repo** — a cópia de `dist/` para `/var/www/tocamais` (produção) é manual/externa ao repositório.
- **CI** (`.github/workflows/build.yml`): builda os apps nativos (Android APK/AAB, iOS via Fastlane+match ou fallback não assinado) a cada push — **não publica o site**.
- **iOS**: bundle version 10, Team ID declarado em `Appfile`/`Matchfile` é `H4HH45TYS2`, mas o `Fastfile` referencia `JLSP4RM3GL` num passo — **inconsistência a confirmar** antes de builds de produção iOS.
- **Android**: versionCode 2 / versionName "2.0" — defasado frente ao iOS, não recebeu updates recentes. Keystore de assinatura já configurado (`android/app/tocamais-release.jks`) — `.mimo-context.md` alerta para trocar a senha antes de produção.

---

## 9. Lixo/resíduos identificados (não removidos, só registrados)

- `build_err.txt`, `build_log.txt`, `build_out.txt`, `build_output.txt` — todos vazios (0 bytes)
- `dev/null` — arquivo de 2,3MB com nome estranho, provável erro de redirecionamento de shell
- `RELATORIO_IMPLEMENTACAO.pdf` — duplicata binária do `.md` equivalente
- Dezenas de `.sql` soltos em `scripts/` (migrations manuais aplicadas via SQL Editor do Supabase, fora do mecanismo formal `supabase/migrations/`) — risco de deriva entre ambientes
