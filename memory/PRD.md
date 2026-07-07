# Backendly — Product Requirements

## Problem Statement
Premium BaaS platform for developers. Marketing site + real working multi-tenant backend.

## Architecture
- FastAPI + MongoDB (Motor). React + Tailwind + Framer Motion + Router v7. Fonts: Outfit / Inter / JetBrains Mono.
- Auth: Emergent Google OAuth + JWT-style email/password with bcrypt. Session cookie httpOnly, SameSite=None, 7 days.
- Password reset: Gmail SMTP (smtplib SSL 465, GMAIL_USER + GMAIL_APP_PASSWORD env), 30-min single-use token.
- **Multi-tenant real backend**: single Mongo DB, per-project isolation enforced at app layer. Every query filters by project_id. API keys are hashed (sha256), plaintext returned once.

## Implemented (Dec 2025)
### Marketing site
- 13-section landing page (Hero, Logos, Bento Features, Code Examples w/ syntax highlighter, Integrations, Docs preview, Pricing, Testimonials, Blog, FAQ, Final CTA, Footer)
- /about, /contact, /docs, all responsive, WCAG accessible
- Newsletter + contact form persist to Mongo

### Auth
- /login /signup /forgot-password /reset-password + OAuth callback
- Nav swaps between Sign in/Sign out based on session state

### Real BaaS backend
- Projects: /api/projects CRUD (session-authed, user_id scoped)
- Tables: /api/projects/{id}/tables — schema builder (fields: string, integer, float, boolean, datetime, json; required + default)
- API keys: /api/projects/{id}/api-keys — mint, list (masked prefix+last4), revoke
- Record CRUD: /api/v1/{table} GET/POST + /api/v1/{table}/{id} GET/PATCH/DELETE. API-key authed, X-API-Key header
- Middleware logs every /api/v1/* request into request_logs collection (with 40-day TTL)
- Real metered usage: /api/usage + /api/projects/{id}/usage (30-day series, API requests / rows stored / write ops / bandwidth)
- Mongo indexes: api_keys.key_hash unique, project_tables.(project_id,name) unique, project_records.(project_id,table_id), request_logs TTL

### Dashboard UI
- /dashboard (Projects list), clickable cards
- /dashboard/projects/:id — 4 tabs: Tables (schema builder), API Keys (mint with one-time reveal banner), Usage (real numbers), API (copy-pasteable cURL/fetch examples)
- /dashboard/team (invite/remove)
- /dashboard/usage (aggregated across all projects, real data)

## Backlog
- P1: Custom domains per project
- P2: Row-level security rules per table (currently owner-only via API key)
- P2: SDKs (JS/Python) that wrap /api/v1/*
- P2: Webhook subscriptions (row change → external URL)
