const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectMongo = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/ai_debug_memory';
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

const disconnectMongo = async () => {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
};

module.exports = { connectMongo, disconnectMongo };
