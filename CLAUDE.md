@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Next.js dev server (Turbopack)
npm run build    # Production build — run this + lint before considering any change done
npm run lint     # ESLint (eslint-config-next); no separate typecheck script, but
                  # `npm run build` runs the TypeScript compiler as part of the build
npm run start    # Serve a production build locally
```

There is no test framework configured (no `test` script, no test files). Correctness is
verified via `npm run build` (typechecks the whole project) and `npm run lint`.

Database schema changes go through Supabase MCP tools (`apply_migration`, `execute_sql`),
not local tooling — see "Database & migrations" below.

## Architecture

Next.js 16 (App Router, Turbopack, React 19) + Supabase (Postgres, Auth, Storage, RLS),
deployed on Vercel. This is a SaaS platform for amateur golf clubs/associations to run
their tournament calendar, registrations, payments, tee-time sheets, and results/rankings
— **multi-tenant**: each client organization is a row in `organizadores`, and almost every
content table (`torneos`, `ligas_pool`, `jugadores`, `patrocinadores`, `configuracion`,
`usuarios_admin`, `consultas_contacto`) carries an `organizador_id`.

### Tenant resolution

`src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`; the exported function is
`proxy`, not `middleware` — see `AGENTS.md`) resolves which organizador a request belongs
to by matching the request's `Host` header against `organizadores.dominio`, with a
hard-coded fallback organizador so unmatched hosts (localhost, Vercel preview URLs) still
render something. The resolved id is passed downstream via an `x-organizador-id` request
header; `src/lib/data/organizador.ts` reads it (`obtenerOrganizadorActual`) for
Server Components/actions that need "the current tenant" without a more specific context
(e.g. the public contact form). Where a row already has its own `organizador_id` (a
torneo, a consulta), prefer joining/selecting that directly over re-resolving from the
request — it's the authoritative value.

The bare parent domain (`DOMINIOS_LANDING` in `proxy.ts`) serves a product landing page
(`/producto`) instead of any tenant's site — rewritten via the proxy, not a real route at
`/`. `proxy.ts` also 308-redirects the auto-generated Vercel preview alias to the
canonical custom domain so it's never the one people see/share.

`organizadores` has a public SELECT policy for active rows (name/logo/color/contact email
are meant to be shown), separate from the super-admin-only INSERT/UPDATE policies.

### Auth & three admin surfaces

- Public users: Supabase Auth (Google OAuth + magic link). `src/lib/supabase/{server,client,middleware}.ts`
  are the three client constructors (server components/actions, browser, proxy — each
  needs its own cookie handling).
- `/admin/*`: per-organizador staff, gated by a row in `usuarios_admin` (`getUsuarioAdmin()`
  in `src/lib/auth`). This is where tournaments, leagues, results, sponsors, and inquiries
  are managed for *your* organizador.
- `/god/*`: cross-tenant super-admin, gated by `super_admins` (`is_super_admin()` in
  Postgres, used in RLS policies), manages the `organizadores` table itself.
- Guest registration (no account) bypasses normal RLS via `src/lib/supabase/admin.ts`
  (service-role client) since there's no `auth.uid()` to authorize against — used
  specifically for the no-account signup path in
  `src/app/torneos/[slug]/inscripcion/actions.ts`.

### Domain modules under `src/lib/`

- `salidas/generar.ts` — tee-sheet group generator: balances group sizes (3-4), assigns by
  handicap or manually, and honors "quiero jugar con" requests
  (`inscripciones.juega_con_licencias`) by first computing connected-component blocks of
  players who must stay together, then packing blocks into groups.
- `resultados/extraer-pdf.ts` — parses an uploaded results PDF/photo (`pdf-parse`) into
  candidate rows, fuzzy-matched against confirmed entrants
  (`src/lib/data/resultados.ts` → `emparejarConInscritos`) to prefill the manual results
  table instead of requiring the admin to retype everything.
- `clasificacion/recalcular.ts` — recomputes a league's `clasificacion_global` from scratch
  from all its tournaments' published `resultados`. A results row with no `posicion` (no
  score recorded — withdrawn, no-show, still pending) is excluded entirely; it must never
  contribute a 0-point ranked entry. Two league scoring modes
  (`ligas_pool.modo_puntuacion`): `tabla_puntos` (points-per-finishing-position table) or
  `suma_stableford` (raw Stableford points summed, no table).
- `pagos/index.ts` — payment method abstraction; only Bizum (manual, admin-confirmed) is
  implemented today, kept separate so another provider can be added without touching
  registration flow code.
- `email/index.ts` — all outbound mail goes through nodemailer using one shared SMTP
  account (`SMTP_HOST/PORT/USER/PASSWORD/FROM` env vars — sending silently returns `false`
  if any are missing, checked by callers to warn admins rather than claim success). The
  visible sender **name** and reply-to are personalized per organizador
  (`OrganizadorEmailInfo`), but the envelope address stays the one verified SMTP account —
  most providers reject/spam-flag a From address outside the authenticated domain, so
  don't try to send "as" an arbitrary organizador's own address without a real per-tenant
  SMTP credential.

### Tournament results & standings

Results have two independent input paths that converge on the same `resultados` table:
manual entry (`src/app/admin/torneos/[id]/resultados/resultados-form.tsx`) and PDF/photo
upload + parsing. The manual table also supports round-tripping through XLSX (download
current rows, edit offline, re-upload to bulk-update by `licencia_federativa`) — useful
when scoring happens away from a reliable connection. A tournament's `formato_puntuacion`
(stableford/medal_play/mejor_bola/scramble/matchplay) plus `modo_juego`
(individual/parejas — constrains which formats are offered together in the admin form)
decides whether the scoring column is Stableford points (higher wins) or strokes/golpes
(lower wins); classification generation breaks ties by handicap in the direction that
matches the format (lowest handicap wins Stableford ties, highest wins stroke-play ties),
computed per handicap category when the tournament defines categories.

A tournament's prize structure has two independent shapes in `torneos`: `premios` (an
array of handicap-range categories, each with its own prize list) and `premios_hoyo`
(flat list of per-hole prizes like longest drive / closest-to-pin, no handicap category).
Both feed into `premios_ganadores` (a single JSONB map) with different key schemes
(`{categoryIndex}-{prizeIndex}` vs `hoyo-{index}`) — don't conflate them.

### Database & migrations

`supabase/migrations/*.sql` is the source of truth for schema, applied in numeric-prefix
order; there's no local Postgres — changes are made directly against the hosted Supabase
project via MCP tools (`apply_migration` for DDL, `execute_sql` for one-off data fixes),
and the same SQL is saved into `supabase/migrations/` for history/reproducibility rather
than relying on `supabase db push`. `src/types/database.ts` is a **hand-maintained**
TypeScript mirror of the schema (not generated) — update it in the same change as any
migration that adds/renames a column or table.

RLS is the actual authorization boundary; `getUsuarioAdmin()`/`is_admin()`/
`is_super_admin()` gate app-level convenience checks on top of it, not instead of it.
