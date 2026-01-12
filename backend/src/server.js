const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
