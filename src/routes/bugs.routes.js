const express = require('express');
const router = express.Router();
const { storeBugFix, listFixes, getFix, updateFix, deleteFix, submitFeedback } = require('../controllers/bugs.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/', authMiddleware, storeBugFix);
router.get('/', authMiddleware, listFixes);
router.get('/:bugId', authMiddleware, getFix);
router.put('/:bugId', authMiddleware, updateFix);
router.delete('/:bugId', authMiddleware, deleteFix);
router.post('/:bugId/feedback', authMiddleware, submitFeedback);

module.exports = router;
