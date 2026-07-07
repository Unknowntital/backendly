# Backendly — Marketing Website PRD

## Problem Statement
Premium, production-ready marketing website for Backendly, a modern BaaS platform. Positioned alongside Vercel/Supabase/Firebase but with a distinct teal + amber glassmorphic identity on a deep dark base. Multi-page: Home, About, Contact, Docs.

## Architecture
- Frontend: React 19 + React Router v7 + Tailwind + Framer Motion + shadcn/ui
- Backend: FastAPI + MongoDB (Motor)
- Fonts: Outfit (display), Inter (body), JetBrains Mono (code)
- Theme: Dark-only base #08090C, teal #2DD4BF primary, amber #F59E0B accent

## Implemented (Dec 2025)
- Sticky glass Navbar with mobile overlay
- Hero with animated typing terminal + gradient glow drift
- Logos marquee, Bento Features grid (11 items, AI card featured 2x2)
- Tabbed Code Examples (JS/Python/Go/cURL) with copy-to-clipboard
- AI Showcase (prompt → arrow → generated output panel)
- Integrations grid, Docs preview (functional sidebar + content)
- Pricing (single $0 forever card with gradient border)
- Testimonials dual marquee, Blog preview 3-card grid
- FAQ accordion, Final CTA, Multi-column Footer with newsletter
- About page (story, values, animated stats count-up, team grid)
- Contact page (form + alt contact cards, MongoDB persistence)
- Docs standalone page
- Backend endpoints: POST /api/contact, POST /api/newsletter (dedup), GET /api/contact
- SEO meta tags, OG tags, WCAG-friendly focus rings

## Backlog
- P1: Working light-mode toggle (currently dark-only, scaffold ready)
- P2: Real blog CMS, docs full pages, sitemap.xml, structured data
- P2: Admin dashboard for contact/newsletter submissions
