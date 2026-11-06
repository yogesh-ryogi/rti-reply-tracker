const express = require('express');
const schemeController = require('../controllers/schemeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public listing (home page shows schemes even when not logged in)
router.get('/', schemeController.listSchemes);
router.get('/:id', schemeController.getScheme);

module.exports = router;
