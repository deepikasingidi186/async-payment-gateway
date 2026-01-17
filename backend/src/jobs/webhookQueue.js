const Queue = require('bull');

const webhookQueue = new Queue(
  'webhook-queue',
  process.env.REDIS_URL
);

module.exports = webhookQueue;
