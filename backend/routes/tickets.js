const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db/pool');
const { classifyTicket } = require('../services/aiService');

router.use(auth);

// GET /api/tickets — list my tickets
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tickets WHERE author_id = $1 ORDER BY updated_at DESC`,
      [req.user.author_id]
    );
    res.json({ tickets: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets/create_ticket
router.post('/create_ticket', async (req, res) => {
  const author_id = req.user.author_id;
  const { book_id, subject, description } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ error: 'subject and description required' });
  }

  try {
    // 1. ticket insert — defaults: status=open, category=general, priority=medium, ai_status=pending
    const ticket = await pool.query(
      `INSERT INTO tickets (author_id, book_id, subject)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [author_id, book_id || null, subject]
    );
    const ticketId = ticket.rows[0].id;

    // 2. description ko pehla message insert karo
    await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_user_id, sender_role, body, is_internal)
       VALUES ($1, $2, $3, $4, false)`,
      [ticketId,author_id, 'author', description]
    );

    // 3. response turant bhej do — author wait na kare
    res.status(201).json({ ticket: ticket.rows[0] });

    // 4. fire and forget — response ke baad background mein AI call
    setImmediate(() => classifyTicket(ticketId));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tickets/ALL_tickets — admin: saare tickets
router.get('/ALL_tickets', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tickets ORDER BY updated_at DESC`
    );
    res.json({ tickets: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//GEt all the converstion of that ticekt form ticket messge tablle
router.get('/get_conversation/:ticket_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC`,
      [req.params.ticket_id]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//Get all the tickets of cuurecnt author from ticket table
router.get('/my_tickets', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tickets WHERE author_id = $1 ORDER BY updated_at DESC`,
      [req.user.author_id]
    );
    res.json({ tickets: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// this is route is same as admin insert msg but we are wrting here for author also

// POST /api/admin/tickets/:id/author_messages — author reply
router.post('/:id/author_messages', async (req, res) => {
  const { body} = req.body;
  if (!body) return res.status(400).json({ error: 'body required' });

  try {
  


    const msg = await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_user_id, sender_role, body, is_internal)
       VALUES ($1, $2, 'author', $3, $4) RETURNING *`,
      [req.params.id, req.user.author_id, body, false]
    );
    // naya message → draft cache clear
    await pool.query(
      `UPDATE tickets SET updated_at = NOW(), ai_draft = NULL WHERE id = $1`,
      [req.params.id]
    );

    res.status(201).json({ message: msg.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;