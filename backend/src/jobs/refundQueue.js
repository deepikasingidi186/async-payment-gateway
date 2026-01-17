const Queue = require('bull');
module.exports = new Queue('refund-queue', process.env.REDIS_URL);
