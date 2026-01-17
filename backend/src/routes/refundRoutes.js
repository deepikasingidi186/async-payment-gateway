const express = require('express');
const router = express.Router();
const { createRefund } = require('../controllers/refundController');

router.post('/payments/:payment_id/refunds', createRefund);

module.exports = router;
