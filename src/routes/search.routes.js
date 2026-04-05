const express = require('express');
const router = express.Router();
const { searchFixes } = require('../controllers/bugs.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/', authMiddleware, searchFixes);

module.exports = router;
