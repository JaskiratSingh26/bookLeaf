const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db/pool');
const { generateDraft } = require('../services/aiService');

router.use(auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  next();
});

// GET /api/admin/tickets
router.get('/tickets', (req, res) => {
  res.json({ message: 'TODO: admin ticket queue' });
});

// POST /api/admin/tickets/:id/messages — admin reply
router.post('/tickets/:id/messages', async (req, res) => {
  const { body, is_internal = false } = req.body;
  if (!body) return res.status(400).json({ error: 'body required' });

  try {
    console.log(req.body)
    console.log(req.user)

    //  lets find author id from ticekt tanleusing  prams id then inset it to author beause if we dont do that then amdin uthor id will e inserted
    const find_author_id = await pool.query(`SELECT author_id FROM tickets WHERE id = $1`, [req.params.id])
    const author_id = find_author_id.rows[0].author_id
    console.log(find_author_id)

    const msg = await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_user_id, sender_role, body, is_internal)
       VALUES ($1, $2, 'admin', $3, $4) RETURNING *`,
      [req.params.id, author_id, body, is_internal]
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


router.patch('/tickets/:id/category', async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: 'category required' });

  try {
    await pool.query(`UPDATE tickets SET category = $1 WHERE id = $2`, [category, req.params.id]);
    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// PATCH /api/admin/tickets/:id/status
router.patch('/tickets/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });
  try {
    await pool.query(`UPDATE tickets SET status=$1, updated_at=NOW() WHERE id=$2`, [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/tickets/:id/priority
router.patch('/tickets/:id/priority', async (req, res) => {
  const { priority } = req.body;
  if (!priority) return res.status(400).json({ error: 'priority required' });
  try {
    await pool.query(`UPDATE tickets SET priority=$1, updated_at=NOW() WHERE id=$2`, [priority, req.params.id]);
    res.json({ message: 'Priority updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/tickets/:id/draft — generate ya cached draft return karo
router.get('/tickets/:id/draft', async (req, res) => {
  try {
    const draft = await generateDraft(req.params.id, false);
    res.json({ draft });
  } catch (err) {
    res.status(503).json({ draft: '', error: 'AI unavailable — type manually' });
  }
});

// POST /api/admin/tickets/:id/draft — force regenerate
router.post('/tickets/:id/draft', async (req, res) => {
  try {
    const draft = await generateDraft(req.params.id, true);
    res.json({ draft });
  } catch (err) {
    res.status(503).json({ draft: '', error: 'AI unavailable — type manually' });
  }
});

module.exports = router;
