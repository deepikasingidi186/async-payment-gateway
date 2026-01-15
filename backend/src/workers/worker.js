require('dotenv').config();
const Queue = require('bull');

const paymentQueue = new Queue('payment-queue', process.env.REDIS_URL);

console.log('Worker started, waiting for jobs...');

const pool = require('../config/db');

paymentQueue.process(async (job) => {
  const { paymentId } = job.data;

  console.log('Processing payment:', paymentId);

  // simulate delay (5–10 sec)
  await new Promise(res => setTimeout(res, 5000));

  // decide success/failure
  const success = Math.random() < 0.9; // 90% success

  if (success) {
    await pool.query(
      `UPDATE payments 
       SET status = 'success', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [paymentId]
    );

    console.log('Payment SUCCESS:', paymentId);
  } else {
    await pool.query(
      `UPDATE payments 
       SET status = 'failed', 
           error_code = 'PAYMENT_FAILED',
           error_description = 'Transaction failed',
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [paymentId]
    );

    console.log('Payment FAILED:', paymentId);
  }
});


