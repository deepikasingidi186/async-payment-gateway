require('dotenv').config();

const Queue = require('bull');
const crypto = require('crypto');
const axios = require('axios');
const pool = require('../config/db');

// Payment queue
const paymentQueue = new Queue('payment-queue', process.env.REDIS_URL);

// Webhook queue
const webhookQueue = new Queue('webhook-queue', process.env.REDIS_URL);

console.log('Worker started. Waiting for jobs...');

/**
 * PROCESS PAYMENT JOB
 */
paymentQueue.process(async (job) => {
  const { paymentId } = job.data;

  console.log('Processing payment:', paymentId);

  // Simulate payment delay (5 seconds)
  await new Promise((res) => setTimeout(res, 5000));

  // 90% success rate
  const success = Math.random() < 0.9;

  if (success) {
    await pool.query(
      `UPDATE payments 
       SET status = 'success', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [paymentId]
    );

    console.log('Payment SUCCESS:', paymentId);

    // Enqueue webhook
    await webhookQueue.add(
      {
        merchantId: '00000000-0000-0000-0000-000000000001',
        event: 'payment.success',
        payload: {
          payment: {
            id: paymentId,
            status: 'success'
          }
        }
      },
      {
        attempts: 5,
        backoff: {
          type: 'fixed',
          delay: 5000 // TEST MODE retry (5s)
        }
      }
    );

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

    // Enqueue webhook
    await webhookQueue.add(
      {
        merchantId: '00000000-0000-0000-0000-000000000001',
        event: 'payment.failed',
        payload: {
          payment: {
            id: paymentId,
            status: 'failed'
          }
        }
      },
      {
        attempts: 5,
        backoff: {
          type: 'fixed',
          delay: 5000 // TEST MODE retry
        }
      }
    );
  }
});

/**
 * PROCESS WEBHOOK JOB
 */
webhookQueue.process(async (job) => {
  const { event, payload } = job.data;

  const webhookUrl = 'http://host.docker.internal:4000/webhook';
  const webhookSecret = 'whsec_test_abc123';

  const body = JSON.stringify({
    event,
    timestamp: Math.floor(Date.now() / 1000),
    data: payload
  });

  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  try {
    const response = await axios.post(webhookUrl, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature
      },
      timeout: 5000
    });

    console.log('Webhook delivered:', response.status);
  } catch (err) {
    console.log('Webhook delivery failed. Retrying...');
    throw err; // Bull will retry
  }
});

const refundQueue = new Queue('refund-queue', process.env.REDIS_URL);

refundQueue.process(async (job) => {
  const { refundId } = job.data;

  await new Promise(r => setTimeout(r, 3000));

  await pool.query(
    `UPDATE refunds 
     SET status='processed', processed_at=CURRENT_TIMESTAMP
     WHERE id=$1`,
    [refundId]
  );

  await webhookQueue.add(
    {
      merchantId: '00000000-0000-0000-0000-000000000001',
      event: 'refund.processed',
      payload: { refund: { id: refundId, status: 'processed' } }
    },
    { attempts: 5, backoff: { type: 'fixed', delay: 5000 } }
  );

  console.log('Refund processed:', refundId);
});
