const pool = require('../config/db');
const refundQueue = require('../jobs/refundQueue');
const crypto = require('crypto');

const genId = () =>
  'rfnd_' + crypto.randomBytes(8).toString('hex');

exports.createRefund = async (req, res) => {
  const { payment_id } = req.params;
  const { amount, reason } = req.body;
  const merchantId = '00000000-0000-0000-0000-000000000001';

  const { rows } = await pool.query(
    'SELECT amount, status FROM payments WHERE id=$1',
    [payment_id]
  );
  if (!rows.length || rows[0].status !== 'success')
    return res.status(400).json({ error: 'Payment not refundable' });

  const refunded = await pool.query(
    "SELECT COALESCE(SUM(amount),0) total FROM refunds WHERE payment_id=$1",
    [payment_id]
  );

  if (amount > rows[0].amount - refunded.rows[0].total)
    return res.status(400).json({ error: 'Refund amount exceeds available amount' });

  const refundId = genId();

  await pool.query(
    `INSERT INTO refunds (id,payment_id,merchant_id,amount,reason)
     VALUES ($1,$2,$3,$4,$5)`,
    [refundId, payment_id, merchantId, amount, reason]
  );

  await refundQueue.add({ refundId });

  res.status(201).json({
    id: refundId,
    payment_id,
    amount,
    reason,
    status: 'pending'
  });
};
