require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pool = require('./db/pool');
const healthRoutes = require('./routes/health');
// const healthDb = require('./routes/health/db');
const authRoutes    = require('./routes/auth');
const bookRoutes    = require('./routes/books');
const ticketRoutes  = require('./routes/tickets');
const adminRoutes   = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',    authRoutes);
app.use('/api/books',   bookRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/health',  healthRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
