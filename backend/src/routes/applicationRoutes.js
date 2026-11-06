const express = require('express');
const applicationController = require('../controllers/applicationController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('citizen'), applicationController.createApplication);
router.get('/mine', restrictTo('citizen'), applicationController.getMyApplications);
router.get('/panchayat', restrictTo('clerk'), applicationController.getPanchayatApplications);

router.patch('/:id/status', restrictTo('clerk'), applicationController.updateStatus);
router.post('/:id/request-payment', restrictTo('clerk'), applicationController.requestPayment);
router.post('/:id/pay', restrictTo('citizen'), applicationController.pay);
router.post('/:id/complete', restrictTo('clerk'), applicationController.complete);

module.exports = router;
