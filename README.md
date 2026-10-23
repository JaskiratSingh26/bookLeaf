# BookLeaf Author Support Portal

Full-stack support portal for authors to raise tickets and admins to manage them with AI assistance.

**Live Demo:** [Add after deploy]
**Backend:** Node.js + Express on Render
**Frontend:** React on Vercel
**Database:** PostgreSQL on Neon

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
|Admin | Admin@gmail.com | bookleaf@123 |
| Author | priya.sharma@email.com | bookleaf@123 |
| Author | rohit.kapoor@email.com | bookleaf@123 |
| Author | sneha.kulkarni@email.com | bookleaf@123 |


---

## Local Setup

### Prerequisites
- Node.js 18+
- A Neon PostgreSQL database (free at neon.tech)

### 1. Clone the repo
```bash
git clone <repo-url>
cd BOOK_PUBLISH
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```
DATABASE_URL=your_neon_connection_string
JWT_SECRET=any_long_random_string
claude_api_key=your_anthropic_api_key
PORT=5000
```

### 3. Run database schema
In Neon SQL Editor, run the contents of `backend/db/schema.sql`

### 4. Seed the database
```bash
cd backend
node db/seed.js
```

### 5. Start backend
```bash
npm start
```
Server runs on http://localhost:5000

### 6. Frontend setup
```bash
cd frontend/my-project
npm install
```

Create `frontend/my-project/.env`:
```
REACT_APP_API_URL=http://localhost:5000
```

### 7. Start frontend
```bash
npm start
```
App runs on http://localhost:3000

---

## Architecture

```
frontend/          React (CRA + Tailwind)
backend/
  routes/          Thin Express routers
  services/        aiService.js — classification + draft
  middleware/      auth.js (JWT verify)
  db/
    pool.js        pg Pool singleton
    schema.sql     All table definitions
    seed.js        10 authors, 18 books, 2 admins
```

**Auth flow:** Single login form → role from DB → JWT with `{user_id, role, author_id}` → middleware reads `req.user` on every protected route. Frontend never sends role in request body.

**Ticket thread:** `tickets` table = one row per ticket (metadata). `ticket_messages` = reply chain. First message is the author's description. `is_internal = true` hides a message from the author.

**Real-time:** Polling every 5 seconds. Production upgrade: Socket.io or SSE.

**AI:** See `AI_INTEGRATION.md` for full details.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/register` | Register new author |

### Books (Author)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books/view` | Author's own books |
| POST | `/api/books/add` | Add a book |

### Tickets (Author)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets/my_tickets` | Author's tickets |
| POST | `/api/tickets/create_ticket` | Raise a ticket |
| GET | `/api/tickets/get_conversation/:id` | Full message thread |
| POST | `/api/tickets/:id/author_messages` | Author reply |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets/ALL_tickets` | All tickets (admin) |
| POST | `/api/admin/tickets/:id/messages` | Admin reply |
| PATCH | `/api/admin/tickets/:id/category` | Update category |
| PATCH | `/api/admin/tickets/:id/priority` | Update priority |
| PATCH | `/api/admin/tickets/:id/status` | Update status |
| GET | `/api/admin/tickets/:id/draft` | Get AI draft (cached) |
| POST | `/api/admin/tickets/:id/draft` | Regenerate AI draft |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health |
| GET | `/api/health/db` | DB connection check |

---

## Known Limitations

- Polling every 5s — not true real-time. Production: use WebSockets.
- File attachments: UI only, no actual upload implemented.
- No pagination on ticket list (fine for demo, needed at scale).
- Render free tier has ~30s cold start — first request after inactivity is slow.
