const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/paymentController');

router.post('/payments', createPayment);

module.exports = router;
