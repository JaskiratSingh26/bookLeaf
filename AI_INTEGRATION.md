# AI Integration — BookLeaf Support Portal

## Model Choice

**Claude Haiku (`claude-haiku-4-5-20251001`)** via Anthropic API.

Why Haiku:
- Cheapest Claude model — ~$0.00025 per 1K input tokens
- Fast enough for real-time draft generation (~1–2 seconds)
- Follows structured output instructions reliably (critical for JSON classification)
- Classification call: ~$0.0001 per ticket
- Draft call: ~$0.001 per ticket

---

## Feature 1 — Auto Classification (on ticket create)

**When:** Fires in background after ticket is inserted. Author gets immediate 201 response.

**What it does:** Reads the ticket subject + first message, returns category and priority as JSON.

**Endpoint triggered internally:** None — called via  in `POST /api/tickets/create_ticket`

**Prompt strategy:**
- Short prompt (~200 tokens input)
- Strict rules per category and priority
- `max_tokens: 50` — only needs a small JSON object
- Output: `{"category":"royalty","priority":"high"}`
- Strips markdown backticks before parsing (model sometimes wraps JSON in code blocks)

**On success:** Updates `tickets.category`, `tickets.priority`, `tickets.ai_category`, `tickets.ai_priority`, `tickets.ai_status = 'done'`

**On failure:** Sets `tickets.ai_status = 'failed'`. Ticket is safe, admin sees it and classifies manually.

**Categories:**
| DB value | Display |
|----------|---------|
| `royalty` | Royalty & Payments |
| `isbn` | ISBN & Metadata Issues |
| `printing` | Printing & Quality |
| `distribution` | Distribution & Availability |
| `production` | Book Status & Production Updates |
| `general` | General Inquiry |

**Priorities:** `critical`, `high`, `medium`, `low`

---

## Feature 2 — AI Draft Response (admin side)

**When:** Admin opens a ticket modal → frontend calls `GET /api/admin/tickets/:id/draft`

**Endpoint:** `GET /api/admin/tickets/:id/draft` — returns cached draft or generates new one
**Endpoint:** `POST /api/admin/tickets/:id/draft` — force regenerate (ignores cache)

**What it does:** Generates a draft reply for the admin to edit before sending.

**Prompt strategy:**
- Sends only the KB section matching the ticket's category (not the full KB) — saves ~500 tokens per call
- Sends only the last 5 messages of the thread (not full history)
- Includes tone guidelines (empathetic, specific, clear next step)
- `max_tokens: 300` — enough for a complete support reply

**Caching:**
- Draft saved to `tickets.ai_draft` after generation
- On reopen (no new messages): cached draft returned, no API call
- On new message (author or admin reply): `ai_draft` set to NULL, next open generates fresh draft

**On failure:** Returns `{ draft: '', error: 'AI unavailable — type manually' }` with 503 status. Admin sees empty textarea and types manually — no feature blockage.

---

## Cost Management Summary

| What | Tokens (approx) | Cost per call |
|------|----------------|---------------|
| Classification | ~300 in, 20 out | ~$0.0001 |
| Draft generation | ~600 in, 200 out | ~$0.0008 |
| Draft (cached) | 0 | $0 |

Per 100 tickets: ~$0.01 classification + ~$0.08 drafts = under $0.10 total.

---

## Error Handling

- AI timeout or rate limit → `ai_status = 'failed'`, ticket unaffected
- Bad JSON from AI → regex strips markdown, then parse; if still fails → fallback to failed state
- Draft API down → 503 with empty draft, admin writes manually
- API key missing → server logs error, graceful 503 to frontend
