# BookLeaf Author Support Portal — Approach & Write-Up

## What I Built

A full-stack support portal where authors raise tickets, admins manage and reply to them, and AI assists with classification and response drafting.

---

## How I Approached It

**Step 1 — Read the docs carefully.**
I went through the full assignment, took notes on every requirement, and identified what was core (ticket flow + AI) vs. what was nice-to-have (file uploads, analytics). Prioritized accordingly.

**Step 2 — Designed the database first.**
Before writing any code, I thought through the data model:

- `users` — single table for both authors and admins. Role stored here. On login, role comes from DB and goes into the JWT — no role selector on the frontend. This keeps auth simple and secure.
- `authors` — author-specific profile data (phone, city, join date). Separate from users so admins (who are also users) don't get author rows.
- `books` — linked to authors. Stores all royalty and distribution data.
- `tickets` — one row per ticket. Stores status, category, priority, and AI fields. The ticket itself is just metadata.
- `ticket_messages` — the actual reply chain. Every message (author's first description, author replies, admin replies, internal notes) is a row here with `ticket_id` as the link. `is_internal = true` hides a message from the author. This is the key design — tickets and messages are separate so the thread can grow without touching the ticket row.

**Step 3 — Built in order of dependency.**

1. Login page (auth first, everything else needs a token)
2. Author side: My Books → Add Book → Raise Ticket → My Tickets with thread view
3. Admin side: Ticket queue → Reply chain → Category/Priority/Status edit
4. Polling for real-time feel
5. Sorting and filtering on admin queue
6. AI integration (last, because it sits on top of the ticket flow)

---

## Key Decisions & Trade-offs

**Polling instead of WebSockets.**
The ticket thread refreshes every 5 seconds by calling the API. WebSockets would give true real-time updates but cause issues on Render's free tier (connections drop on cold start, sticky sessions needed). Polling is simple, reliable, and good enough for a support portal where responses aren't instant anyway. For production: swap in Socket.io or Server-Sent Events.

**Single login form for both roles.**
No "I am an admin / I am an author" toggle. The role comes from the database after verifying the password. This is more secure — an attacker can't try admin-only routes by just selecting a role on the frontend.

**JWT with role + author_id baked in.**
After login, the token carries `user_id`, `role`, and `author_id`. Every protected API reads from `req.user` — the frontend never sends a role or author_id in the request body. This prevents privilege escalation.

**AI as fire-and-forget for classification.**
When an author submits a ticket, the API inserts the ticket and immediately returns a 201 to the author. The AI classification runs in the background (`setImmediate`). If AI fails, the ticket still exists with default values and the admin sees "classify manually." The author's experience is never blocked by AI latency or downtime.

**AI draft cached per ticket, invalidated on new message.**
When an admin opens a ticket, the AI generates a draft based on the last 5 messages + the relevant Knowledge Base section. This draft is cached in `tickets.ai_draft`. If the admin closes and reopens the same ticket (no new messages), the cached draft is returned — no extra API call. When any new message arrives, the cache is cleared so the next draft is fresh and context-aware.

**Knowledge Base sent selectively.**
Only the KB section matching the ticket's category is sent to the AI (royalty tickets get royalty policy, printing tickets get printing policy). Sending the full KB on every call would waste tokens and dilute the prompt.

---

## What I'd Do With More Time

- **WebSockets** for true real-time (Socket.io on backend, useSocket hook on frontend)
- **File uploads** for ticket attachments (S3 or Cloudinary)
- **Admin analytics dashboard** — ticket volume, avg resolution time, AI classification accuracy
- **Email notifications** when ticket status changes
- **Rate limiting per user** instead of global rate limiting
- **Pagination** on ticket list for scale
