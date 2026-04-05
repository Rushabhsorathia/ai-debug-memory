const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/bugs.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, getStats);

module.exports = router;
