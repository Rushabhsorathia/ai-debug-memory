const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Add x-api-key header.' });
  }
  next();
};

module.exports = authMiddleware;
