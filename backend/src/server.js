require('dotenv').config();
const express = require('express');
const pool = require('./config/db');

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  const result = await pool.query('SELECT 1');
  res.json({ status: 'ok', db: 'connected' });
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
