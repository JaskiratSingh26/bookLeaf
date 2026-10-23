# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Backend (from backend/)
npm start           # start Express server (add "start": "node server.js" to package.json)
npm run dev         # nodemon for dev (add "dev": "nodemon server.js")
npm run seed        # seed DB (add "seed": "node seed.js")

# Frontend (from frontend/my-project/)
npm start           # dev server on port 3000
npm run build       # production build
npm test            # Jest test runner
```

## Project layout (target structure — build into this)

```
backend/
├── server.js           # express app + middleware setup
├── routes/             # thin route files: auth.js, books.js, tickets.js, admin.js

├── services/           # business logic: ticketService.js, aiService.js
├── db/
│   ├── pool.js         # pg Pool singleton
│   ├── schema.sql
│   └── seed.js
├── middleware/         # auth.js (JWT verify), rbac.js
└── .env / .env.example

frontend/my-project/src/
├── api/                # axios/fetch wrappers per resource
├── components/         # shared UI (Button, Badge, etc.)
├── pages/              # Login, MyBooks, MyTickets, TicketDetail, AdminQueue, AdminTicket
└── hooks/              # usePolling.js (5s interval for ticket threads)
```

## Current state

Backend `server.js` is empty — nothing is implemented yet. Frontend `App.js` is a placeholder. Database schema and seed script do not exist.

---

# BookLeaf Author Support & Communication Portal — Project Context

Technical assignment for Full Stack Developer role at BookLeaf Publishing.
Deadline: 4 days. After submission there is a 45–60 min technical walkthrough, so every line must be explainable. Keep code simple and readable.

## Coding conventions
- Prefer flat, function-based code. No class-based abstractions unless truly needed.
- Small modules with clear separation: routes → controllers → services → db.
- All secrets in `.env` (never hardcoded, never sent to frontend). Commit a `.env.example`.
- Meaningful error responses with proper status codes (400/401/403/404/409/422/503), never generic 500s.
- Clean, incremental commits with descriptive messages.

## Tech stack (decided)
- Frontend: React (deploy on Vercel)
- Backend: Node.js + Express (deploy on Render free tier — note cold start ~30s in README)
- Database: PostgreSQL on Neon (free). Library: `pg` (plain SQL, `$1` placeholders)
- Auth: JWT + bcrypt
- Validation: zod (or express-validator)
- AI: Claude Haiku or gpt-4o-mini (cheap, fast; justify in README)
- Real-time: polling every 5s (simple, reliable on Render free). Mention SSE/WebSocket as production upgrade.
- API docs: Swagger/OpenAPI or Postman collection

## Requirements summary

### Author portal
1. Login (email + password). Author sees only own data.
2. My Books: title, ISBN, genre, publication date, status, MRP, copies sold, royalty earned / paid / pending.
3. Submit ticket: book dropdown (+ "General / Account Level" = book_id NULL), subject, description, file attachment (UI only; upload is bonus).
4. My Tickets: list with status (Open, In Progress, Resolved, Closed), full message thread, admin replies appear without page refresh (polling). Author can reply in the same thread, or create a new ticket for a new issue.

### Admin portal
1. Ticket queue across all authors, filter by status, category, priority, date. Default sort: open tickets first, priority (critical → low), then oldest first. Resolved/Closed go to the bottom.
2. AI auto-classification into: Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, General Inquiry. Admin can override.
3. AI priority: Critical / High / Medium / Low. Admin can override.
4. AI-drafted response using query + knowledge base + book data. Admin edits before sending. Sent reply shows in author's thread.
5. Ticket management: change status, internal notes (hidden from author), "Assign to me".

### API layer
- RESTful, consistent naming, auth middleware on all routes, role-based access control, input validation, meaningful errors, documentation.

## Key design decisions

### Login / identity
- Single login form for both roles. NO role selector on frontend — role comes from DB.
- JWT payload: `{ user_id, role, author_id }` (author_id is null for admins).
- Author rows are created by the seed script, NOT at login. Login only verifies.
- Never take `author_id` from request body. Always use `req.user.author_id` from JWT.
- Ticket owner = `author_id`. Message sender = `user_id` (because admins have no author_id).
- RBAC: author requesting a book/ticket that isn't theirs → 404 (don't leak existence).

### Ticket thread model
- `tickets` = one row per ticket. `ticket_messages` = the reply chain (email-thread style).
- On ticket creation, the description is inserted as the first message.
- Author or admin replies append rows to `ticket_messages` with same `ticket_id`.
- Internal notes = `ticket_messages.is_internal = true`. Author APIs always filter `is_internal = false`.
- Update `tickets.updated_at = NOW()` on every reply/status change (polling depends on this).

### AI flow
**Classification (on ticket create only, not on replies):**
1. Insert ticket immediately with defaults: category `general`, priority `medium`, ai_status `pending`. Return success to author right away.
2. Then run AI classification in background (fire-and-forget after response).
3. On success: set `category`, `priority`, `ai_category`, `ai_priority`, `ai_status = 'done'`.
4. On failure (timeout, rate limit, API down, bad JSON): `ai_status = 'failed'`. Ticket stays safe; admin sees "AI unavailable — classify manually".
- Keep `ai_category`/`ai_priority` separate from final values so overrides are auditable.

**Draft response (admin side only, never shown to author):**
1. When admin opens a ticket and `ai_draft` is NULL → call AI, save result to `tickets.ai_draft` (cache).
2. Reopening uses cached draft — no new AI call.
3. "Regenerate" button forces a new draft (e.g. after author's new reply).
4. If AI fails → empty textbox, admin writes manually.

**Cost awareness (document in README):**
- Send only the KB section relevant to the ticket's category + tone guidelines, not the whole KB.
- Send only the selected book's data, not all books.
- Send only the last 4–5 messages of the thread.
- Classification: short prompt, JSON-only output, low max_tokens.
- Draft caching avoids repeat calls.

**Prompt quality:**
- Responses must sound like a BookLeaf support rep: empathetic, acknowledge concern first, specific numbers/dates/statuses, own BookLeaf's mistakes, clear timelines (e.g. "within 48 hours"), always end with a clear next step.
- Use the book's real data (pending amount, last payout date, status) in drafts.

## Database schema (PostgreSQL)
See `schema.sql`. Tables:
- `users` (id SERIAL, email UNIQUE, password_hash, name, role CHECK author/admin, created_at)
- `authors` (id VARCHAR e.g. 'AUTH001', user_id FK UNIQUE, phone, city, joined_date)
- `books` (id VARCHAR e.g. 'BK001', author_id FK, title, isbn, genre, publication_date, status, mrp NULLABLE, author_royalty_per_copy NULLABLE, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date NULLABLE, print_partner NULLABLE, available_on JSONB)
- `tickets` (id SERIAL, author_id FK, book_id FK NULLABLE, subject, status CHECK open/in_progress/resolved/closed, category CHECK royalty/isbn/printing/distribution/production/general, priority CHECK critical/high/medium/low, ai_category, ai_priority, ai_status CHECK pending/done/failed, ai_draft TEXT, assigned_to FK users NULLABLE, attachment_name, created_at, updated_at)
- `ticket_messages` (id SERIAL, ticket_id FK, sender_user_id FK, sender_role, body, is_internal BOOLEAN, created_at)
- Category codes are short in DB; frontend maps them to display names.

## Seed data
- Source: `bookleaf_sample_data.json` — 10 authors, 18 books. Evaluators test with these exact records, keep IDs (AUTH001, BK001…) unchanged.
- Seed script: for each author → insert into `users` (bcrypt hashed default password) → insert into `authors` → insert books.
- Create 2 admin users (only in `users`, no `authors` row).
- Put all test credentials in README.

## Edge cases from sample data (must handle gracefully)
- BK013 and BK015 are "In Production" with null MRP, royalty, publication date, empty available_on → show "—" / "In Production", no crashes.
- AUTH003 (BK005) and AUTH006 (BK010) have never received a payout (last_royalty_payout_date null) → royalty tickets from them should rank higher.
- BK016 pending is ₹850, below ₹1,000 minimum payout threshold → AI should explain it rolls over to next quarter.
- AUTH009 has one published and one in-production book (mixed state).
- BK017 title contains a Unicode apostrophe (Durga’s Daughters) — ensure UTF-8 everywhere.
- Empty states: author with no tickets, admin queue with no matching filters.

## BookLeaf Knowledge Base (use as AI context)

### Company overview
- Self-publishing company operating in India and the US.
- Packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid, with marketing and distribution add-ons).
- Handles cover design, typesetting, ISBN assignment, printing, distribution, royalty management.
- In-house printing facility and warehouse in Delhi. Print partners: Repro India, Epitome Books.

### Royalty policy
- 80/20 split: 80% of net profit per book to author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), shipping charges.
- Royalties calculated quarterly, paid within 45 days of quarter end.
- Minimum payout threshold ₹1,000; below that rolls over to next quarter.
- Paid via bank transfer to account linked in author's dashboard.
- Authors can view detailed royalty breakdown per platform in dashboard.

### ISBN policy
- Every book gets a unique ISBN assigned by BookLeaf, registered under BookLeaf's imprint.
- Author wanting own imprint must obtain ISBN independently.
- ISBN errors (duplicate, wrong book linked) = high priority, escalated to production team.

### Printing & quality
- In-house printing for most orders; overflow/specific formats go to Repro India or Epitome Books.
- Standard print turnaround: 5–7 business days from order confirmation.
- Quality issues (misprints, binding defects, color inconsistency) → free reprint after verification; author may need to share photos.

### Distribution & availability
- Listed on Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store.
- New listings go live within 7–10 business days after publication completes.
- "Unavailable" on a platform usually = stock sync issue; team can trigger re-sync within 24–48 hours.

### Production stages
Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
- Authors updated by email at each stage. Common delays: Cover Design (waiting for author approval), Proofreading (revision rounds).

### Tone guidelines
- Always empathetic and professional. Authors are partners, not customers to be managed.
- Acknowledge the concern before solutions.
- Be specific: actual numbers, dates, statuses.
- If BookLeaf's fault, own it directly. No corporate deflection.
- Escalations get a clear timeline ("within 48 hours"), not open-ended promises.
- Always end with a clear next step.

### Sample query → expected response
- Royalty, "no royalty after 4 months": acknowledge frustration, explain quarterly cycle + 45-day window, check bank details linked, give specific next payout date, if overdue escalate with 48-hour timeline.
- Royalty, "amount too low, 200 copies only ₹3,000": explain net profit calculation, offer line-by-line breakdown, transparent not defensive.
- ISBN, "different ISBN on Amazon vs physical copy": high priority, acknowledge serious data issue, escalate to production immediately, 48-hour timeline.
- Printing, "blurry images, misaligned pages": apologise sincerely, ask for photos, confirm free reprint once verified, 5–7 business days.
- Distribution, "Currently Unavailable on Amazon": stock sync issue, triggering re-sync, 24–48 hours.
- Production, "3 weeks still in typesetting": check actual status, be honest about delay reason, give updated timeline, never blame author, frame collaboratively.
- General, "update description on Amazon after live": yes, via dashboard or email, reflects in 3–5 business days.

## Build order
1. DB schema + seed script
2. Backend auth (login, JWT, role middleware)
3. Author APIs: books, create ticket, list tickets, reply
4. Admin APIs: queue with filters/sort, update ticket (status/category/priority/assign), reply, internal note
5. AI service (separate module): `classifyTicket`, `generateDraft`, with timeout + fallback
6. React frontend: Login, My Books, New Ticket, My Tickets (thread), Admin Queue, Admin Ticket Detail
7. Deploy (Vercel + Render + Neon), README, 1-page write-up

## Submission checklist
- Public GitHub repo with clean commit history
- Live URL, pre-seeded, test credentials in README
- README: local setup, architecture decisions, AI integration (prompt strategy, error handling, cost management), model choice justification, API docs link, known limitations / improvements
- 1-page write-up: priorities, trade-offs, how to evolve to production
- Verify no API keys in frontend or repo








GET  http://localhost:5000/api/health          ✅ DB check
POST http://localhost:5000/api/auth/login
GET  http://localhost:5000/api/books
GET  http://localhost:5000/api/tickets
POST http://localhost:5000/api/tickets
GET  http://localhost:5000/api/tickets/:id
POST http://localhost:5000/api/tickets/:id/messages
GET  http://localhost:5000/api/admin/tickets
GET  http://localhost:5000/api/admin/tickets/:id
PATCH http://localhost:5000/api/admin/tickets/:id
POST http://localhost:5000/api/admin/tickets/:id/messages
POST http://localhost:5000/api/admin/tickets/:id/notes
POST http://localhost:5000/api/admin/tickets/:id/draftGET  http://localhost:5000/api/health          ✅ DB check
POST http://localhost:5000/api/auth/login
GET  http://localhost:5000/api/books
GET  http://localhost:5000/api/tickets
POST http://localhost:5000/api/tickets
GET  http://localhost:5000/api/tickets/:id
POST http://localhost:5000/api/tickets/:id/messages
GET  http://localhost:5000/api/admin/tickets
GET  http://localhost:5000/api/admin/tickets/:id
PATCH http://localhost:5000/api/admin/tickets/:id
POST http://localhost:5000/api/admin/tickets/:id/messages
POST http://localhost:5000/api/admin/tickets/:id/notes
POST http://localhost:5000/api/admin/tickets/:id/draftj