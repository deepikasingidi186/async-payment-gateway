const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const paymentQueue = require('../jobs/queue');

exports.createPayment = async (req, res) => {
  const paymentId = `pay_${uuidv4().replace(/-/g, '').slice(0,16)}`;

  const { order_id, method, vpa } = req.body;

  await pool.query(
    `INSERT INTO payments (id, merchant_id, order_id, amount, method, vpa)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [paymentId, '00000000-0000-0000-0000-000000000001', order_id, 50000, method, vpa]
  );

  await paymentQueue.add({ paymentId });

  res.status(201).json({
    id: paymentId,
    order_id,
    amount: 50000,
    status: 'pending'
  });
};
