const crypto = require('crypto');
const pool = require('../config/db');
const paymentQueue = require('../jobs/queue');
const { getCached, saveCached } = require('../utils/idempotency');

const MERCHANT_ID = '00000000-0000-0000-0000-000000000001';

const generatePaymentId = () => {
  return 'pay_' + crypto.randomBytes(8).toString('hex');
};

exports.createPayment = async (req, res) => {
  try {
    // ✅ Parse body
    const { order_id, method, vpa } = req.body;

    if (!order_id || !method) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Missing required fields'
        }
      });
    }

    // ✅ Idempotency handling (BEFORE DB WRITE)
    const idempotencyKey = req.header('Idempotency-Key');

    if (idempotencyKey) {
      const cachedResponse = await getCached(
        idempotencyKey,
        MERCHANT_ID
      );

      if (cachedResponse) {
        return res.status(201).json(cachedResponse);
      }
    }

    // ✅ Create payment
    const paymentId = generatePaymentId();

    const amount = 50000; // fixed for now (₹500)

    await pool.query(
      `INSERT INTO payments 
       (id, merchant_id, order_id, amount, method, vpa, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
      [
        paymentId,
        MERCHANT_ID,
        order_id,
        amount,
        method,
        vpa || null
      ]
    );

    // ✅ Enqueue async processing
    await paymentQueue.add({ paymentId });

    // ✅ Response object
    const responseBody = {
      id: paymentId,
      order_id,
      amount,
      currency: 'INR',
      method,
      vpa,
      status: 'pending'
    };

    // ✅ Store idempotent response
    if (idempotencyKey) {
      await saveCached(
        idempotencyKey,
        MERCHANT_ID,
        responseBody
      );
    }

    return res.status(201).json(responseBody);

  } catch (err) {
    console.error('Create payment error:', err);

    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        description: 'Something went wrong'
      }
    });
  }
};
