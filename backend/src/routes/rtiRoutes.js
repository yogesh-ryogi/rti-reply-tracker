const express = require('express');
const rtiController = require('../controllers/rtiController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('citizen'), rtiController.createRTI);
router.get('/mine', restrictTo('citizen'), rtiController.getMyRTIs);
router.get('/panchayat', restrictTo('clerk', 'pdo'), rtiController.getPanchayatRTIs);
router.get('/stats', rtiController.getStats);
router.post('/:id/reply', restrictTo('clerk'), rtiController.replyRTI);
router.post('/:id/nudge', restrictTo('pdo'), rtiController.nudgeRTI);

module.exports = router;
