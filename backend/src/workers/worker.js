require('dotenv').config();
const Queue = require('bull');

const paymentQueue = new Queue('payment-queue', process.env.REDIS_URL);

console.log('Worker started, waiting for jobs...');

paymentQueue.process(async (job) => {
  console.log('Processing job:', job.id, job.data);

  // simulate work
  await new Promise((res) => setTimeout(res, 3000));

  console.log('Job completed:', job.id);
});
