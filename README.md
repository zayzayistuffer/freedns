# freedns — Prototype Domain Registrar Frontend

This repository contains a working prototype of a domain registrar frontend with:

- Domain availability search (mock)
- Domain registration (MockRegistrar) — simulates real registrations
- Simple DNS management via Cloudflare API (optional — provide CLOUDFLARE_API_TOKEN)
- Simple web UI and REST API
- Docker + docker-compose for easy local run

Warning: This is a prototype. To register real domains you must plug a real reseller/registrar API and configure Stripe for payments.

Quick start (local)

1. Clone the repo and cd into it.
2. Copy .env.example to .env and edit values as needed.
3. Install dependencies and start (requires Node 18+):

   npm install
   npm start

4. Open http://localhost:3000

Environment variables (.env)

- PORT=3000
- DATA_FILE=./data/domains.json
- CLOUDFLARE_API_TOKEN= (optional — required for Cloudflare DNS operations)

What I pushed

- A simple Express server (server.js) that serves a basic UI and implements API endpoints:
  - GET /api/search?domain=example.com  — check availability (mock)
  - POST /api/register  — register a domain (mock)
  - GET /api/domains  — list registered domains
  - POST /api/dns/:domain  — add a DNS record via Cloudflare (requires CLOUDFLARE_API_TOKEN)

- A mock registrar adapter (lib/mockRegistrar.js) and a Cloudflare helper (lib/cloudflare.js).
- Dockerfile and docker-compose.yml for local testing.

Next steps I can take for you

- Replace MockRegistrar with a real reseller adapter (OpenProvider, Namecheap, eNom, ResellerClub). I can implement a chosen adapter and wire real registration flows.
- Add Stripe Checkout for real payments and webhooks.
- Add user accounts, auth, and a full Next.js frontend.

If you want me to continue, tell me which reseller to integrate (or I can pick one) and whether to add Stripe now.
