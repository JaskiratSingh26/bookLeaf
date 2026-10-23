// test helath route

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET   /api/health          — health check
router.get('/', (req, res) => {
  res.json({ message: 'Health check' });
});

router.get('/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({ message: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

// POST /api/health/test-user  — test insert into users table
router.post('/test-user', async (req, res) => {
  const { name, email, password_hash, role } = req.body;
  console.log(req.body);
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name, email, password_hash, role]
    );
    res.status(201).json({ message: 'User inserted', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
