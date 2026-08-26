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
hard-coded fallback organizador (AJAG) so unmatched hosts (localhost, Vercel preview URLs,
a club domain not yet configured) still render something. The lookup hits Supabase's REST
API directly (no supabase-js, to avoid depending on cookies there) and is cached in-memory
per host for 5 minutes (`cacheOrganizador` in `proxy.ts`) — this was the biggest
contributor to slow TTFB before the cache was added, since the middleware runs on every
navigation. The resolved id is passed downstream via an `x-organizador-id` request header;
`src/lib/data/organizador.ts` reads it (`obtenerOrganizadorActual`) for Server
Components/actions that need "the current tenant" without a more specific context (e.g.
the public contact form). Where a row already has its own `organizador_id` (a torneo, a
consulta), prefer joining/selecting that directly over re-resolving from the request —
it's the authoritative value.

The bare parent domain (`DOMINIO_PLATAFORMA` = `torneos.aftergolf.es`, checked via
`DOMINIOS_LANDING` in `proxy.ts`) serves a product landing page (`/producto`) instead of
any tenant's site — rewritten via the proxy, not a real route at `/`. `proxy.ts` also
308-redirects the auto-generated Vercel preview alias to the canonical custom domain so
it's never the one people see/share.

`/god` (super-admin, see below) is likewise not any organizador's site: visiting it from a
client subdomain (`*.torneos.aftergolf.es`, e.g. `ajag.torneos.aftergolf.es/god`)
308-redirects to the same path on `DOMINIO_PLATAFORMA`; `localhost` and Vercel preview
hosts are exempt so `/god` stays testable pre-deploy. The root layout also skips rendering
`SiteHeader`/`SiteFooter` (AJAG's tenant chrome) for both the landing and `/god`, via an
`x-show-landing`/`x-show-god` request header set in the proxy and read in
`src/app/layout.tsx`. Because Supabase Auth cookies are host-scoped (no shared
`domain: '.torneos.aftergolf.es'` configured), a session started on a client subdomain
does **not** carry over to `DOMINIO_PLATAFORMA` — a super-admin must log in directly on
`torneos.aftergolf.es` to reach `/god` without an extra login bounce.

`organizadores` has a public SELECT policy for active rows (name/logo/color/contact email
are meant to be shown), separate from the super-admin-only INSERT/UPDATE policies.

### Auth & three admin surfaces

- Public users: Supabase Auth (Google OAuth + magic link). `src/lib/supabase/{server,client,middleware}.ts`
  are the three client constructors (server components/actions, browser, proxy — each
  needs its own cookie handling).
- `/admin/*`: per-organizador staff, gated by a row in `usuarios_admin` (`getUsuarioAdmin()`
  in `src/lib/auth`). This is where tournaments, leagues, results, sponsors, and inquiries
  are managed for *your* organizador. `/admin/administradores` lets an existing admin add
  more admins for their own organizador self-service (by email, once that person has
  logged in at least once — there's no `getUserByEmail` in this SDK version, so it does a
  paginated linear scan of `auth.admin.listUsers()`), instead of requiring a SQL insert for
  every admin after the first. `usuarios_admin`'s RLS policies are scoped by
  `organizador_id_actual()` (an admin can only see/manage admins of their own
  organizador) — this was a real gap fixed alongside that panel: earlier policies checked
  `is_admin()` globally, so any admin from any organizador could manage any other's admins.
  Other multi-tenant tables (`torneos`, `ligas_pool`, `jugadores`, `patrocinadores`, etc.)
  have not been audited for the same unscoped-RLS gap.
- `/god/*`: cross-tenant super-admin, gated by `super_admins` (`is_super_admin()` in
  Postgres, used in RLS policies), manages the `organizadores` table itself. Forced onto
  its own domain rather than any organizador's — see "Tenant resolution" above.
- Guest registration (no account) bypasses normal RLS via `src/lib/supabase/admin.ts`
  (service-role client) since there's no `auth.uid()` to authorize against — used
  specifically for the no-account signup path in
  `src/app/torneos/[slug]/inscripcion/actions.ts`. A guest with no real federated license
  can check "no tengo licencia federativa"; `generarLicenciaUnica` (`src/lib/data/jugadores.ts`)
  mints a unique `AJAG######` placeholder so `jugadores.licencia_federativa` (a partial
  unique index, `where licencia_federativa is not null`) still has a natural key for
  matching that player across future admin classification edits/imports.

### Domain modules under `src/lib/`

- `salidas/generar.ts` — tee-sheet group generator: balances group sizes (3-4), assigns by
  handicap or manually, and honors "quiero jugar con" requests
  (`inscripciones.juega_con_licencias`) by first computing connected-component blocks of
  players who must stay together, then packing blocks into groups. `modo_salida` is
  `consecutivo` (staggered tee times), `shotgun`, or `shotgun_silencioso` (shotgun with no
  announcement/ceremony).
- `resultados/extraer-pdf.ts` — parses an uploaded results PDF/photo (`pdf-parse`) into
  candidate rows, fuzzy-matched against confirmed entrants
  (`src/lib/data/resultados.ts` → `emparejarConInscritos`) to prefill the manual results
  table instead of requiring the admin to retype everything.
- `clasificacion/recalcular.ts` — recomputes a league's `clasificacion_global` from scratch
  from all its tournaments' published `resultados`. A results row with no real score
  (`posicion`/`puntos`/`golpes` unfilled) or with `estado_juego` set (retirado/no
  presentado) is excluded entirely via `puntuacion.ts`'s `calcularPuntosPorTorneo`; it must
  never contribute a 0-point ranked entry. Three league scoring modes
  (`ligas_pool.modo_puntuacion`): `tabla_puntos` (points-per-finishing-position table),
  `suma_stableford` (raw Stableford points summed), or `suma_medal_handicap` (golpes −
  hándicap, lower is better). If `ligas_pool.mejores_n_torneos` is set, only the player's
  best N results count toward `clasificacion_global.puntos_totales` (the value that
  decides ranking order) — `puntos_totales_brutos` stores the uncapped sum of everything
  played, shown as a second "Mejores Resultados" column alongside "Puntos totales" only
  when a league has that cap configured (otherwise the two would just be duplicates). Both
  columns get recomputed together, from scratch, on every call — there is no "manual
  override" mode: `/admin/ligas/[id]/clasificacion` lets an admin hand-edit the table and
  round-trip it through XLS (same pattern as tournament results, below), but any edits
  made there are silently overwritten the next time a tournament in that league has
  results (re)published, since `recalcularClasificacionGlobal` always runs unconditionally
  on save/publish. That tradeoff is intentional (scope/time), not a bug — flagged clearly
  in that panel's own UI text rather than gated behind a schema flag.
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

`resultados.estado_juego` (`retirado`/`no_presentado`/`null`) marks a player who didn't
finish. In the manual results form this forces the Stableford points cell to show `"0"`
(golpes-based formats are left blank — there's no sensible zero-equivalent), but that's
purely a display convenience: `calcularPuntosPorTorneo` checks `estado_juego` first and
always returns `null` for these rows regardless of the stored value, so they never count
as a real 0-point league result. **Gotcha**: an `<input>` in a dynamic per-row admin table
must use `readOnly`, never `disabled`, if the intent is "visually locked but must still
submit" — a `disabled` field is excluded from `FormData` entirely, and since these forms
read parallel arrays via `formData.getAll(name)` zipped by index across same-named inputs
per row, one disabled row silently shifts every subsequent row's values onto the wrong
player. This bit the results form once already; it's a live trap for any similar
dynamic-table form in this codebase (e.g. the league classification admin panel).

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
