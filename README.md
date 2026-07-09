<div align="center">

# PeerX

### The next-generation peer-to-peer crypto trading platform.

[![CI](https://github.com/OpenPeerX/Peerx-Web/actions/workflows/tests.yml/badge.svg)](https://github.com/OpenPeerX/Peerx-Web/actions/workflows/tests.yml)
[![GitHub release](https://img.shields.io/github/v/release/OpenPeerX/Peerx-Web?include_prereleases&sort=semver)](https://github.com/OpenPeerX/Peerx-Web/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node 20+](https://img.shields.io/badge/node-20%2B-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org)

[Live](https://peerx.com) · [Releases](https://github.com/OpenPeerX/Peerx-Web/releases) · [Discord](https://discord.gg/peerx) · [Telegram](https://t.me/peerx)

</div>

---

## About PeerX

PeerX is a peer-to-peer crypto trading platform built around
**waitlist-driven launch access**, **referral-based growth loops**, and
**premium tiering**. Early adopters earn priority access, exclusive
content, and bonus points by referring friends; verified users unlock
real-time simulated trading, deep analytics, and leaderboards.

This repository holds the **PeerX web app** — a Next.js 14 application
with a SQLite-backed API, magic-link authentication, multi-language
content, a service-worker–backed PWA, and a complete email + push
notification pipeline.

The site is currently at **v0.1.0** — a CI-green, alpha-stage launch
of the brand migration. Subsequent releases add the live trading
engine, the on-chain wallet bridge, and the public beta.

---

## Features

### Waitlist & onboarding
- **Email-implicit signup** with magic-link authentication via
  [`/api/auth/magic`](src/app/api/auth/magic).
- **Email verification flow** with single-use tokens
  ([`/api/email/verify`](src/app/api/waitlist/verify)) and resend.
- **Tiered waitlist UI** with real-time countdown to launch,
  premium tier indicators, and exclusive-content unlocks.
- **8-step onboarding email sequence** dispatched over 34 days
  (welcome → features → market sample → lead-trader interview →
  community invite → early-access guide → final reminder →
  premium bonus content for premium tier).

### Referrals & growth
- **Per-user referral codes** stored in `referral_codes` and surfaced
  via [`QRCodeDisplay`](src/components/QRCodeDisplay.tsx).
- **Bonus-point accrual**: refers earn 1 point per successful
  verification, surfaced in
  [`BonusDashboard`](src/components/BonusDashboard.tsx).
- **Premium waitlist** with 500-spot cap and configurable
  price-increase date.

### Internationalization
- **6 locales** (English, French, German, Spanish, Arabic, Chinese)
  via [`next-intl`](https://next-i18n.com/) with full RTL support
  for Arabic.
- **LocaleSwitcher** for in-app language rotation.

### Performance & UX
- **PWA-ready** with [`public/sw.js`](public/sw.js) cache
  strategies for static assets, dynamic pages, and images.
- **Offline page** ([`/offline`](src/app/offline/page.tsx)) for
  graceful service-worker fallback.
- **Optimized image pipeline** with
  [`OptimizedImage`](src/components/ui/OptimizedImage.tsx) handling
  LCP-picture fallback and reduced-motion swaps.
- **Dark-mode** theme via [`ThemeContext`](src/components/context/ThemeContext.tsx).

### Telemetry & analytics
- **GDPR/CCPA-compliant consent banner**
  ([`AnalyticsProvider`](src/app/(landing)/waitlist/components/AnalyticsProvider.tsx))
  with GA4 + Mixpanel integration, PII redaction, and event queueing.
- **Push notifications** via
  [`useNotifications`](src/hooks/useNotifications.ts).

---

## Tech stack

| Layer       | Library / Tool                                 |
| ----------- | ---------------------------------------------- |
| Framework   | [Next.js 14.2.18](https://nextjs.org) (App Router) |
| Language    | [TypeScript 5](https://www.typescriptlang.org) |
| UI          | [React 18.3](https://react.dev) + [Tailwind CSS 4](https://tailwindcss.com) + [MUI 9](https://mui.com) (selective) |
| State       | [Redux Toolkit 2](https://redux-toolkit.js.org) |
| Database    | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (WAL mode, FK-enabled) |
| i18n        | [next-intl 4](https://next-i18n.com) |
| Charts      | [Recharts 2](https://recharts.org) |
| Auth        | Custom magic-link flow with HMAC + CSRF cookies |
| Payments    | [Stripe 22](https://stripe.com) (premium tier) |
| Testing     | [Jest 29](https://jestjs.io) + [Playwright 1.43](https://playwright.dev) + [jest-axe](https://github.com/nickcolley/jest-axe) |
| Visualization | [qrcode.react](https://github.com/zpao/qrcode.react) |
| Linting     | [ESLint 8.57](https://eslint.org) + [`next/core-web-vitals`](https://nextjs.org/docs/app/building-your-application/configuring/eslint) |

---

## Quick start

### Prerequisites

- **Node.js 20+**
- **npm 10+** (or [`pnpm`](https://pnpm.io) / [`yarn`](https://yarnpkg.com))
- A POSIX shell (Linux/macOS/WSL); the SQLite native module is built
  automatically by `better-sqlite3` on install.

### Install

```bash
git clone https://github.com/OpenPeerX/Peerx-Web.git
cd Peerx-Web
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is required because some transitive
> dependencies (notably `qrcode.react@1.0.1`) declare peer ranges that
> npm 7+ refuses to resolve against newer React. The project ships a
> project-level `.npmrc` so this is automatic for any consumer of the
> repo; the flag is mentioned here for global `npm install` invocations.

### Run the dev server

```bash
npm run dev
```

The app serves on **http://localhost:3000**.

### Build & start in production mode

```bash
npm run build
npm run start
```

### Bundle analysis

To inspect bundle composition for performance work:

```bash
npm run build:analyze
```

This produces an interactive report at
`http://localhost:8888` via [`webpack-bundle-analyzer`].

---

## Configuration

Environment variables are read by the API routes at runtime. Place
them in a `.env` file at the repository root (never commit).

| Name                              | Purpose                                          | Default                  |
| --------------------------------- | ------------------------------------------------ | ------------------------ |
| `PEERX_DATA_DIR`                  | Directory where the SQLite database lives        | `.data/` (cwd-relative)  |
| `PEERX_SQLITE_PATH`               | Path to the SQLite file                          | `<PEERX_DATA_DIR>/peerx.sqlite` |
| `PEERX_DATA_KEY`                  | HMAC secret for hashing email/PII at rest        | _required_               |
| `NEXT_PUBLIC_BASE_URL`            | Absolute origin used in email links and OG tags  | `http://localhost:3000`  |
| `SENDGRID_API_KEY`                | Provider key for transactional email             | _(falls back to dev log)_ |
| `SENDER_EMAIL`                    | From-address for outbound mail                   | `noreply@peerx.com`      |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID`  | GA4 measurement ID                               | _(analytics disabled)_   |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`  | Cloudflare Turnstile site key (form captcha)     | _(captcha disabled)_     |
| `TURNSTILE_SECRET_KEY`            | Cloudflare Turnstile server-side secret          | _(captcha bypassed)_     |
| `STRIPE_SECRET_KEY`               | Stripe API key for the premium tier checkout    | _(checkout disabled)_    |
| `STRIPE_WEBHOOK_SECRET`           | Stripe webhook signing secret                    | _(webhooks disabled)_    |

---

## Available scripts

| Script                  | What it does                                       |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Start the Next.js dev server on `:3000`            |
| `npm run build`         | Produce a production build to `.next/`             |
| `npm run build:analyze` | Profile the production build with bundle-analyzer  |
| `npm run start`         | Serve the production build on `:3000`              |
| `npm run lint`          | Run ESLint across the workspace via `next lint`    |
| `npm test`              | Run the Jest suite (15 suites, 61 tests)           |
| `npm run test:coverage` | Same as above with coverage reporting              |
| `npm run test:e2e`      | Run the Playwright e2e suite locally               |

---

## Testing

```bash
npm test                  # Jest unit + integration
npm run test:coverage     # + coverage report
npm run test:e2e          # Playwright end-to-end (requires chromium install)
```

The CI pipeline ([`.github/workflows/tests.yml`](.github/workflows/tests.yml))
runs **lint**, **jest + coverage**, and **playwright e2e** in parallel
on every push to `main`. Coverage thresholds in `jest.config.js`
serve as a regression guard; intentionally downgraded `@typescript-eslint`
and `react` rules act as warnings so the gate is firm on the
receiving side and forgiving on the contributing side.

To install Playwright browsers once:

```bash
npx playwright install --with-deps chromium
```

---

## Project structure

```
.
├── public/                 # Static assets + service worker
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (landing)/      # Public marketing pages
│   │   ├── api/            # REST routes (waitlist, auth, email, leaderboard, …)
│   │   ├── auth/           # Magic-link verify page
│   │   ├── dashboard/      # Authed dashboard
│   │   ├── premium/        # Premium tier landing
│   │   └── signup/         # Signup handoff
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks (useABTest, useNotifications, …)
│   ├── i18n/               # next-intl config + locale bundles
│   ├── lib/                # Domain logic (auth, db, email, referral, …)
│   └── store/              # Redux store slices
├── e2e/                    # Playwright specs
├── scripts/                # Maintenance + dispatch scripts
└── .data/                  # Runtime SQLite database (gitignored)
```

---

## Deployment

The app is a standard Next.js 14 build and ships cleanly to
**Vercel**, **Netlify**, **AWS Amplify**, or any container host that
supports the Node 20 runtime. The `better-sqlite3` native binding is
pre-built automatically by `npm install`; if you ship to a serverless
provider that doesn't support native modules, swap the DB layer in
[`src/lib/db.ts`](src/lib/db.ts) for a hosted Postgres / Turso /
Neon equivalent using the same `getDb()` contract.

For most teams, the simplest path is:

```bash
npm run build
vercel deploy --prod
```

---

## Contributing

We welcome pull requests from the community. To get started:

1. Fork the repository and clone your fork.
2. `git checkout -b feat/your-feature-name`
3. Make your change. The CI gate (`lint + jest + coverage + e2e`)
   must pass.
4. Run `npm run lint && npm test` locally before pushing.
5. Open a pull request against `main` with a clear description of
   the change and a link to any issue it closes.

### Ground rules

- Match the existing code style (TypeScript strict, functional React
  components, named exports preferred).
- Don't introduce new lint errors; the downgraded rules in
  `.eslintrc.json` are intentional placeholders for follow-up
  cleanup PRs, not a license to add more.
- Update tests for any behavior change. Coverage threshold is
  intentionally low right now (`20%` global) while the test surface
  grows toward the project's long-term target.

### Code of conduct

Be excellent to each other. Disagreement on technical direction is
welcome; disrespect of contributors is not.

---

## Community

- **Discord** — [discord.gg/peerx](https://discord.gg/peerx)
- **Telegram** — [t.me/peerx](https://t.me/peerx)
- **GitHub Discussions** — come for design RFCs and feature
  proposals.

## License

[MIT](./LICENSE) © PeerX contributors.

---

<div align="center">

Built with care by the PeerX team and 36 open-source contributors.

</div>
