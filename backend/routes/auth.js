const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, mobile } = req.body;
if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, password, role required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    // lets make author id 
    const authorId = 'AUTH' + Date.now();
    const result = await pool.query(
      `INSERT INTO users (name,author_id, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role`,
      [name, authorId, email, hash, 'author', mobile]
    );

    // insert into authors table
    await pool.query(
      `INSERT INTO authors (author_id, city, phone, joined_date) VALUES ($1, $2, $3, $4)`,
      [authorId, 'Delhi', mobile, new Date()]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }
  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.id, author_id: user.author_id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, author_id: user.author_id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
