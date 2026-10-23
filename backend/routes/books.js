const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db/pool');

router.use(auth);

// GET /api/books
router.get('/', (req, res) => {
  res.json({ message: 'TODO: my books' });
});

// POST /api/books/add
router.post('/add', async (req, res) => {
  // author_id JWT se — frontend se nahi lena
  const author_id = req.user.author_id; // AUTH... format — books FK yahi chahta hai
  // const name = req.user.name;


  const {
    book_id, title, isbn, genre, publication_date, status,
    mrp, author_royalty_per_copy, total_copies_sold,
    total_royalty_earned, royalty_paid, royalty_pending,
    last_royalty_payout_date, print_partner
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO books (
        id, author_id, title, isbn, genre, publication_date, status,
        mrp, author_royalty_per_copy, total_copies_sold,
        total_royalty_earned, royalty_paid, royalty_pending,
        last_royalty_payout_date, print_partner
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        book_id, author_id, title, isbn, genre, publication_date, status,
        mrp, author_royalty_per_copy, total_copies_sold,
        total_royalty_earned, royalty_paid, royalty_pending,
        last_royalty_payout_date, print_partner
      ]
    );
    res.status(201).json({ book: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/view
router.get('/view', async (req, res) => {
  try {
    const author_id = req.user.author_id;
    const result = await pool.query('SELECT * FROM books WHERE author_id = $1', [author_id]);
    res.json({ books: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
