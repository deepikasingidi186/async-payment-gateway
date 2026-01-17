const { getStatus } = require('../utils/queueStatus');

exports.getJobStatus = async (req, res) => {
  try {
    const status = await getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      worker_status: 'stopped'
    });
  }
};
