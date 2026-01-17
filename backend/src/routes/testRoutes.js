const router = require('express').Router();
const { getJobStatus } = require('../controllers/testController');

router.get('/test/jobs/status', getJobStatus);
module.exports = router;
