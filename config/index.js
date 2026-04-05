const config = {
  PORT: parseInt(process.env.PORT || '3457', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://mongo:27017/ai_debug_memory',
  API_KEY: process.env.API_KEY || 'dm_default_dev_key',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

module.exports = config;
