const Queue = require('bull');

const paymentQueue = new Queue('payment-queue', process.env.REDIS_URL);
const webhookQueue = new Queue('webhook-queue', process.env.REDIS_URL);
const refundQueue = new Queue('refund-queue', process.env.REDIS_URL);

exports.getStatus = async () => {
  const [
    pWaiting, pActive, pCompleted, pFailed,
    wWaiting, wActive, wCompleted, wFailed,
    rWaiting, rActive, rCompleted, rFailed
  ] = await Promise.all([
    paymentQueue.getWaitingCount(),
    paymentQueue.getActiveCount(),
    paymentQueue.getCompletedCount(),
    paymentQueue.getFailedCount(),

    webhookQueue.getWaitingCount(),
    webhookQueue.getActiveCount(),
    webhookQueue.getCompletedCount(),
    webhookQueue.getFailedCount(),

    refundQueue.getWaitingCount(),
    refundQueue.getActiveCount(),
    refundQueue.getCompletedCount(),
    refundQueue.getFailedCount(),
  ]);

  return {
    pending: pWaiting + wWaiting + rWaiting,
    processing: pActive + wActive + rActive,
    completed: pCompleted + wCompleted + rCompleted,
    failed: pFailed + wFailed + rFailed,
    worker_status: 'running'
  };
};
