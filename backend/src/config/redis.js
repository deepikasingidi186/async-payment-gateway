const IORedis = require('ioredis');

const redis = new IORedis(process.env.REDIS_URL);

redis.on('connect', () => {
  console.log('Redis connected');
});

module.exports = redis;
